import { MissionDefinition, MissionObjective, ClassProgress, MissionRewards, CharacterClass } from '@/types/game.types';
import { GameEvents } from '@/types/events.types';
import { SaveManager } from '@/managers/SaveManager';
import { POLICE_MISSIONS } from '@/data/missions/police-missions';
import { RIDER_MISSIONS } from '@/data/missions/rider-missions';
import { DRIVER_MISSIONS } from '@/data/missions/driver-missions';
import Phaser from 'phaser';

export type MissionState = 'idle' | 'briefing' | 'active' | 'complete' | 'failed';

export interface ObjectiveProgress {
  objective: MissionObjective;
  completed: boolean;
  currentCount: number;
}

export class MissionManager {
  activeMission: MissionDefinition | null = null;
  activeObjectives: Map<string, ObjectiveProgress> = new Map();
  missionTimer: number | null = null;
  missionState: MissionState = 'idle';
  private allMissions: MissionDefinition[] = [];
  private saveManager: SaveManager | null = null;
  private events: Phaser.Events.EventEmitter | null = null;

  init(saveManager: SaveManager, events: Phaser.Events.EventEmitter): void {
    this.saveManager = saveManager;
    this.events = events;
    this.allMissions = [...POLICE_MISSIONS, ...RIDER_MISSIONS, ...DRIVER_MISSIONS];
  }

  getAvailableMissions(classProgress: ClassProgress, classKey: CharacterClass): MissionDefinition[] {
    return this.allMissions
      .filter((m) => {
        // Only this character class's missions (each class plays its own borough)
        if (m.classRequired !== classKey) return false;

        // Not already completed
        if (classProgress.completedMissionIds.includes(m.id)) return false;

        // Level requirement
        if (classProgress.level < m.levelRequired) return false;

        // Unlock condition
        if (m.unlockCondition.type === 'always') return true;
        if (m.unlockCondition.type === 'level') {
          return classProgress.level >= (m.unlockCondition.value as number);
        }
        if (m.unlockCondition.type === 'mission_complete') {
          return classProgress.completedMissionIds.includes(m.unlockCondition.value as string);
        }

        return false;
      })
      .sort((a, b) => a.difficulty - b.difficulty);
  }

  startMission(missionId: string): boolean {
    const mission = this.allMissions.find((m) => m.id === missionId);
    if (!mission) return false;

    this.activeMission = mission;
    this.missionState = 'active';

    // Initialize objectives
    this.activeObjectives.clear();
    for (const obj of mission.objectives) {
      this.activeObjectives.set(obj.id, {
        objective: obj,
        completed: false,
        currentCount: 0,
      });
    }

    // Start timer if applicable
    this.missionTimer = mission.timeLimit;

    // Emit event
    this.events?.emit(GameEvents.MISSION_STARTED, { mission });

    return true;
  }

  updateObjective(objectiveId: string, increment: number = 1): boolean {
    const progress = this.activeObjectives.get(objectiveId);
    if (!progress || progress.completed) return false;

    progress.currentCount += increment;

    if (progress.currentCount >= progress.objective.count) {
      progress.completed = true;
      this.events?.emit(GameEvents.MISSION_OBJECTIVE_COMPLETE, {
        objectiveId,
        mission: this.activeMission,
      });
    }

    // Check if all non-optional objectives complete
    const allRequired = Array.from(this.activeObjectives.values())
      .filter((p) => !p.objective.optional);
    const allComplete = allRequired.every((p) => p.completed);

    if (allComplete) {
      this.completeMission();
      return true;
    }

    return false;
  }

  /** Find an objective by its targetId and update it */
  updateObjectiveByTarget(targetId: string, increment: number = 1): boolean {
    for (const [objId, progress] of this.activeObjectives) {
      if (progress.objective.targetId === targetId && !progress.completed) {
        return this.updateObjective(objId, increment);
      }
    }
    return false;
  }

  update(delta: number): void {
    if (this.missionState !== 'active') return;

    if (this.missionTimer !== null) {
      this.missionTimer -= delta / 1000;
      if (this.missionTimer <= 0) {
        this.missionTimer = 0;
        this.failMission('Time ran out!');
      }
    }
  }

  completeMission(): void {
    if (!this.activeMission) return;

    this.missionState = 'complete';

    // Calculate rewards (including bonus for optional objectives)
    const rewards = { ...this.activeMission.rewards };
    const optionals = Array.from(this.activeObjectives.values())
      .filter((p) => p.objective.optional);
    const optionalsDone = optionals.every((p) => p.completed);

    const finalRewards: MissionRewards = {
      money: rewards.money + (optionalsDone ? rewards.bonusMoney : 0),
      xp: rewards.xp + (optionalsDone ? rewards.bonusXp : 0),
      itemIds: [...rewards.itemIds],
      bonusMoney: optionalsDone ? rewards.bonusMoney : 0,
      bonusXp: optionalsDone ? rewards.bonusXp : 0,
    };

    // Update save data
    if (this.saveManager) {
      const save = this.saveManager.load();
      if (save) {
        const classKey = this.activeMission.classRequired;
        const classProgress = save.classes[classKey];
        if (!classProgress.completedMissionIds.includes(this.activeMission.id)) {
          classProgress.completedMissionIds.push(this.activeMission.id);
        }
        save.stats.totalMissionsCompleted++;
        this.saveManager.save(save);
      }
    }

    this.events?.emit(GameEvents.MISSION_COMPLETED, {
      mission: this.activeMission,
      rewards: finalRewards,
    });
  }

  failMission(reason: string): void {
    this.missionState = 'failed';

    if (this.saveManager) {
      const save = this.saveManager.load();
      if (save) {
        save.stats.missionsFailedCount++;
        this.saveManager.save(save);
      }
    }

    this.events?.emit(GameEvents.MISSION_FAILED, {
      mission: this.activeMission,
      reason,
    });
  }

  abandonMission(): void {
    this.missionState = 'idle';
    this.activeMission = null;
    this.activeObjectives.clear();
    this.missionTimer = null;
  }

  getObjectiveProgress(): Array<{
    id: string;
    description: string;
    current: number;
    target: number;
    completed: boolean;
    optional: boolean;
  }> {
    return Array.from(this.activeObjectives.values()).map((p) => ({
      id: p.objective.id,
      description: p.objective.description,
      current: p.currentCount,
      target: p.objective.count,
      completed: p.completed,
      optional: p.objective.optional,
    }));
  }

  getTimer(): number | null {
    return this.missionTimer;
  }

  getMission(id: string): MissionDefinition | undefined {
    return this.allMissions.find((m) => m.id === id);
  }

  isActive(): boolean {
    return this.missionState === 'active';
  }

  reset(): void {
    this.activeMission = null;
    this.activeObjectives.clear();
    this.missionTimer = null;
    this.missionState = 'idle';
  }
}
