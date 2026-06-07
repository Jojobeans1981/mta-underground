import { PlayerSave, CharacterClass, ClassProgress, PlayerSettings, PlayerStats } from '@/types/game.types';
import { SAVE_KEY, SAVE_VERSION } from '@/config/constants';
import { STARTING_MONEY } from '@/config/balance';

export class SaveManager {
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  createNewSave(selectedClass: CharacterClass): PlayerSave {
    const now = Date.now();

    const defaultClassProgress = (): ClassProgress => ({
      unlocked: false,
      level: 1,
      xp: 0,
      xpToNextLevel: 200,
      completedMissionIds: [],
      unlockedMissionIds: [],
      equippedItems: [],
      ownedItems: [],
      activeSkinId: '',
      ownedSkinIds: [],
    });

    const defaultSettings: PlayerSettings = {
      musicVolume: 0.5,
      sfxVolume: 0.8,
      vibration: true,
      showFps: false,
      language: 'en',
    };

    const defaultStats: PlayerStats = {
      totalPlayTime: 0,
      totalMissionsCompleted: 0,
      totalMoneyEarned: 0,
      totalMoneySpent: 0,
      totalXpEarned: 0,
      highestLevel: 1,
      missionsFailedCount: 0,
      npcsCaught: 0,
      faresEvaded: 0,
      passengersDelivered: 0,
    };

    const policeProgress: ClassProgress = {
      unlocked: true,
      level: 1,
      xp: 0,
      xpToNextLevel: 200,
      completedMissionIds: [],
      unlockedMissionIds: ['police_m01', 'police_m02'],
      equippedItems: ['police_radio_1'],
      ownedItems: ['police_radio_1'],
      activeSkinId: 'police_skin_default',
      ownedSkinIds: ['police_skin_default'],
    };

    const save: PlayerSave = {
      version: SAVE_VERSION,
      createdAt: now,
      lastPlayedAt: now,
      selectedClass: selectedClass,
      classes: {
        police: policeProgress,
        rider: defaultClassProgress(),
        driver: defaultClassProgress(),
      },
      wallet: STARTING_MONEY,
      settings: defaultSettings,
      stats: defaultStats,
    };

    this.save(save);
    return save;
  }

  save(data: PlayerSave): void {
    data.lastPlayedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  load(): PlayerSave | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw === null) return null;

    try {
      const data = JSON.parse(raw) as PlayerSave;
      return this.migrate(data);
    } catch {
      return null;
    }
  }

  migrate(data: PlayerSave): PlayerSave {
    // Future migrations go here
    // if (data.version < 2) { ... }
    data.version = SAVE_VERSION;
    return data;
  }

  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }

  exportSave(): string {
    return localStorage.getItem(SAVE_KEY) ?? '';
  }

  importSave(json: string): PlayerSave | null {
    try {
      const data = JSON.parse(json) as PlayerSave;
      if (typeof data.version !== 'number') return null;
      return data;
    } catch {
      return null;
    }
  }
}
