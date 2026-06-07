import Phaser from 'phaser';
import { ensureSceneLoaded, SceneKey } from '@/sceneLoader';
import { Player } from '@/entities/Player';
import { MapManager } from '@/managers/MapManager';
import { InputManager } from '@/managers/InputManager';
import { NPCManager } from '@/managers/NPCManager';
import { MissionManager } from '@/managers/MissionManager';
import { SaveManager } from '@/managers/SaveManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { ProgressionManager } from '@/managers/ProgressionManager';
import { TileRenderer } from '@/graphics/TileRenderer';
import { AudioManager } from '@/managers/AudioManager';
import { DayNightSystem } from '@/systems/DayNightSystem';
import { DialogueSystem } from '@/systems/DialogueSystem';
import { PursuitSystem } from '@/systems/PursuitSystem';
import { PatrolSystem, PatrolCheckpoint } from '@/systems/PatrolSystem';
import { WeatherSystem } from '@/systems/WeatherSystem';
import { FareEvader } from '@/entities/FareEvader';
import { NPC } from '@/entities/NPC';
import { GameEvents } from '@/types/events.types';
import { TutorialOverlay } from '@/ui/TutorialOverlay';
import { ObjectiveArrow } from '@/ui/ObjectiveArrow';
import { PlayerIndicator } from '@/ui/PlayerIndicator';
import { InteractionGlow } from '@/ui/InteractionGlow';
import { WaypointMarker } from '@/ui/WaypointMarker';
import { WantedSystem } from '@/systems/WantedSystem';
import { RandomEventSystem, RandomEvent } from '@/systems/RandomEventSystem';
import { ComboSystem } from '@/systems/ComboSystem';
import { DailyChallengeSystem } from '@/systems/DailyChallengeSystem';
import { AchievementSystem } from '@/systems/AchievementSystem';
import { ParticleEffects } from '@/systems/ParticleEffects';
import { FloatingTextSystem } from '@/systems/FloatingTextSystem';
import { StreakAnnouncer } from '@/systems/StreakAnnouncer';
import { PowerUpSystem } from '@/systems/PowerUpSystem';
import { TrafficSystem } from '@/systems/TrafficSystem';
import { ScreenFX } from '@/systems/ScreenFX';
import { SpecialAbilitySystem } from '@/systems/SpecialAbilitySystem';
import { ActionFeed } from '@/ui/ActionFeed';
import { EnvironmentalHazards } from '@/systems/EnvironmentalHazards';
import { CinematicCamera } from '@/systems/CinematicCamera';
import {
  CAMERA_LERP,
  CAMERA_ZOOM_DEFAULT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  STATION_ENTRANCE_SIZE,
} from '@/config/constants';
import { Station, MissionDefinition } from '@/types/game.types';
import { hexToNum, COLOR_UI_PRIMARY } from '@/graphics/colors';

export class GameScene extends Phaser.Scene {
  player: Player | null = null;
  private mapManager: MapManager | null = null;
  private inputManager: InputManager | null = null;
  private npcManager: NPCManager | null = null;
  private missionManager: MissionManager | null = null;
  private saveManager: SaveManager | null = null;
  private economyManager: EconomyManager | null = null;
  private progressionManager: ProgressionManager | null = null;
  private buildingBodies: Phaser.Physics.Arcade.StaticGroup | null = null;
  private entranceZones: Phaser.Physics.Arcade.StaticGroup | null = null;
  private colliders: Phaser.Physics.Arcade.Collider[] = [];
  private overlaps: Phaser.Physics.Arcade.Collider[] = [];
  private dayNightSystem: DayNightSystem | null = null;
  private dialogueSystem: DialogueSystem | null = null;
  private pursuitSystem: PursuitSystem | null = null;
  private patrolSystem: PatrolSystem | null = null;
  private weatherSystem: WeatherSystem | null = null;
  private audioManager: AudioManager | null = null;
  private nearStation: Station | null = null;
  private footstepTimer: number = 0;
  private tutorial: TutorialOverlay | null = null;
  private objectiveArrow: ObjectiveArrow | null = null;
  private playerIndicator: PlayerIndicator | null = null;
  private interactionGlow: InteractionGlow | null = null;
  private waypointMarker: WaypointMarker | null = null;
  private wantedSystem: WantedSystem | null = null;
  private randomEventSystem: RandomEventSystem | null = null;
  private comboSystem: ComboSystem | null = null;
  private dailyChallenges: DailyChallengeSystem | null = null;
  private achievements: AchievementSystem | null = null;

  // === NEW OVER-THE-TOP SYSTEMS ===
  private particles: ParticleEffects | null = null;
  private floatingText: FloatingTextSystem | null = null;
  private streakAnnouncer: StreakAnnouncer | null = null;
  private powerUpSystem: PowerUpSystem | null = null;
  private trafficSystem: TrafficSystem | null = null;
  private screenFX: ScreenFX | null = null;
  private specialAbility: SpecialAbilitySystem | null = null;
  private actionFeed: ActionFeed | null = null;
  private envHazards: EnvironmentalHazards | null = null;
  private cinematicCamera: CinematicCamera | null = null;
  private sprintTrailTimer: number = 0;
  private nearMissTimer: number = 0;

  private stationPrompt: Phaser.GameObjects.Text | null = null;
  private missionNPCs: NPC[] = [];
  private missionMenuOpen: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Get managers
    this.mapManager = this.game.registry.get('mapManager') as MapManager;
    this.inputManager = this.game.registry.get('inputManager') as InputManager;
    this.npcManager = this.game.registry.get('npcManager') as NPCManager;
    this.missionManager = this.game.registry.get('missionManager') as MissionManager;
    this.saveManager = this.game.registry.get('saveManager') as SaveManager;
    this.economyManager = this.game.registry.get('economyManager') as EconomyManager;
    this.progressionManager = this.game.registry.get('progressionManager') as ProgressionManager;
    this.audioManager = this.game.registry.get('audioManager') as AudioManager;

    // Load district
    const districtId = (this.game.registry.get('currentDistrict') as string) || 'manhattan';
    const district = this.mapManager.loadDistrict(districtId as any);

    // Render
    TileRenderer.renderDistrict(this, district);
    TileRenderer.renderStationMarkers(this, district.stations);

    // Physics world
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Create player
    const save = this.saveManager?.load();
    const playerClass = save?.selectedClass ?? 'police';
    const startStation = district.stations[0];
    const startX = startStation.entrances[0].x;
    const startY = startStation.entrances[0].y - 15;
    this.player = new Player(this, startX, startY, playerClass);
    this.player.setDepth(100);

    // Camera auto-zoom
    const viewWidth = this.cameras.main.width;
    const targetWorldView = 250;
    const autoZoom = viewWidth / targetWorldView;
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP);
    this.cameras.main.setZoom(autoZoom);

    // Building collision
    this.buildingBodies = this.physics.add.staticGroup();
    const horizontalYs = [150, 250, 350, 450, 550, 650, 750];
    const verticalXs = [150, 300, 500, 700, 850];
    const landmarkBounds = district.landmarks.map((lm) => ({
      left: lm.position.x - lm.size.width / 2,
      right: lm.position.x + lm.size.width / 2,
      top: lm.position.y - lm.size.height / 2,
      bottom: lm.position.y + lm.size.height / 2,
    }));

    for (let i = 0; i < verticalXs.length - 1; i++) {
      for (let j = 0; j < horizontalYs.length - 1; j++) {
        const left = verticalXs[i] + 30;
        const right = verticalXs[i + 1] - 30;
        const top = horizontalYs[j] + 30;
        const bottom = horizontalYs[j + 1] - 30;
        if (right <= left || bottom <= top) continue;
        const cx = (left + right) / 2;
        const cy = (top + bottom) / 2;
        let skip = false;
        for (const bound of landmarkBounds) {
          if (cx > bound.left && cx < bound.right && cy > bound.top && cy < bound.bottom) {
            skip = true;
            break;
          }
        }
        if (skip) continue;
        const wall = this.add.rectangle(cx, cy, right - left, bottom - top).setVisible(false);
        this.buildingBodies.add(wall);
        const wb = wall.body as Phaser.Physics.Arcade.StaticBody;
        wb.setSize(right - left, bottom - top);
        wb.updateFromGameObject();
      }
    }
    this.colliders.push(this.physics.add.collider(this.player, this.buildingBodies));

    // Station entrance zones
    this.entranceZones = this.physics.add.staticGroup();
    for (const station of district.stations) {
      for (const entrance of station.entrances) {
        const zone = this.add.rectangle(entrance.x, entrance.y, STATION_ENTRANCE_SIZE + 10, STATION_ENTRANCE_SIZE + 10).setVisible(false);
        zone.setData('stationId', station.id);
        this.entranceZones.add(zone);
        const zb = zone.body as Phaser.Physics.Arcade.StaticBody;
        zb.setSize(STATION_ENTRANCE_SIZE + 10, STATION_ENTRANCE_SIZE + 10);
        zb.updateFromGameObject();
      }
    }
    this.overlaps.push(this.physics.add.overlap(this.player, this.entranceZones, (_p, zone) => {
      const zoneObj = zone as Phaser.GameObjects.Rectangle;
      this.nearStation = this.mapManager?.getStation(zoneObj.getData('stationId') as string) ?? null;
    }, undefined, this));

    // Station prompt (screen-space)
    this.stationPrompt = this.add.text(0, 0, '', {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#000000cc',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);

    // Input
    this.inputManager.setup(this);

    // NPC manager
    this.npcManager.init(this);
    const npcGroup = this.npcManager.getGroup();
    if (npcGroup) {
      this.colliders.push(this.physics.add.collider(this.player, npcGroup));
      this.colliders.push(this.physics.add.collider(npcGroup, this.buildingBodies));
    }

    // Core systems
    this.dialogueSystem = new DialogueSystem(this);
    this.dayNightSystem = new DayNightSystem(this);
    this.pursuitSystem = new PursuitSystem(this);
    this.patrolSystem = new PatrolSystem(this);
    this.weatherSystem = new WeatherSystem(this);
    this.weatherSystem.init();

    // Start music
    this.audioManager?.playMusic('street_theme');

    // Idle waypoints
    if (!this.missionManager?.isActive() && this.mapManager?.currentDistrict) {
      for (const station of this.mapManager.currentDistrict.stations) {
        this.waypointMarker?.addWaypoint(
          'idle_' + station.id,
          station.position.x, station.position.y,
          station.name, 0x4488ff
        );
      }
    }

    // Idle radio hint
    this.time.delayedCall(4000, () => {
      if (!this.missionManager?.isActive() && !this.tutorial?.getIsShowing()) {
        this.game.events.emit('radio.hint', 'Head to a station to pick up your first mission.');
      }
    });

    // Mission events
    this.game.events.on(GameEvents.MISSION_STARTED, (data: { mission: MissionDefinition }) => {
      this.onMissionStarted(data.mission);
    });
    this.game.events.on(GameEvents.MISSION_COMPLETED, (data: { mission: MissionDefinition }) => {
      this.onMissionEnded(data.mission, true);
    });
    this.game.events.on(GameEvents.MISSION_FAILED, (data: { mission: MissionDefinition }) => {
      this.onMissionEnded(data.mission, false);
    });
    this.game.events.on(GameEvents.MISSION_OBJECTIVE_COMPLETE, (data: { objectiveId: string }) => {
      this.waypointMarker?.completeWaypoint(data.objectiveId);
    });
    this.game.events.on(GameEvents.NPC_CAUGHT, (data: { npcId: string }) => {
      this.onNPCCaught(data.npcId);
    });

    // HUD
    if (!this.scene.isActive('HUDScene')) {
      void this.loadAndLaunchScene('HUDScene');
    }

    // Station exit listener
    this.game.events.on('exitStation', (stationId: string) => {
      this.returnFromStation(stationId);
    });

    // Re-bind input on wake
    this.events.on('wake', () => {
      this.inputManager?.setup(this);
    });

    // TAB key — full-screen transit map
    if (this.input.keyboard) {
      const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
      tabKey.on('down', () => {
        if (!this.scene.isActive('FullMapScene')) {
          void this.loadAndLaunchScene('FullMapScene');
        }
      });
    }

    this.events.once('shutdown', () => {
      this.cleanupScene();
    });

    // UX polish systems
    this.playerIndicator = new PlayerIndicator(this);
    this.objectiveArrow = new ObjectiveArrow(this);
    this.interactionGlow = new InteractionGlow(this);
    this.waypointMarker = new WaypointMarker(this);

    // Market-ready systems
    this.wantedSystem = new WantedSystem();
    this.wantedSystem.init(this);
    this.randomEventSystem = new RandomEventSystem();
    this.randomEventSystem.init(this);
    this.comboSystem = new ComboSystem();
    this.comboSystem.init(this);
    this.dailyChallenges = new DailyChallengeSystem();
    this.dailyChallenges.init();
    this.achievements = new AchievementSystem();
    this.achievements.init();

    // === OVER-THE-TOP SYSTEMS ===
    this.particles = new ParticleEffects(this);
    this.floatingText = new FloatingTextSystem(this);
    this.streakAnnouncer = new StreakAnnouncer(this);
    this.powerUpSystem = new PowerUpSystem();
    this.powerUpSystem.init(this);
    this.trafficSystem = new TrafficSystem();
    this.trafficSystem.init(this);
    this.screenFX = new ScreenFX(this);

    // === WAVE 2 SYSTEMS ===
    this.specialAbility = new SpecialAbilitySystem();
    this.specialAbility.init(this, playerClass);
    this.actionFeed = new ActionFeed(this);
    this.envHazards = new EnvironmentalHazards();
    this.envHazards.init(this);
    this.cinematicCamera = new CinematicCamera(this);

    // Store actionFeed in registry so HUD can access it
    this.game.registry.set('actionFeed', this.actionFeed);

    this.tutorial = new TutorialOverlay(this);

    // Epic fade-in with camera zoom punch
    this.cameras.main.fadeIn(500);
    const finalZoom = this.cameras.main.zoom;
    this.cameras.main.setZoom(finalZoom * 0.7);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: finalZoom,
      duration: 800,
      ease: 'Power2',
    });
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.inputManager) return;

    const cam = this.cameras.main;
    const toScreenX = (wx: number) => (wx - cam.scrollX) * cam.zoom;
    const toScreenY = (wy: number) => (wy - cam.scrollY) * cam.zoom;

    this.inputManager.update();

    if (this.missionMenuOpen) {
      this.inputManager.resetActionFlag();
      return;
    }

    const dir = this.inputManager.getDirection();
    const sprint = this.inputManager.isSprintHeld();

    // Apply power-up speed boost + special ability dash + environmental hazards
    const baseSpeed = 120;
    let speedMult = this.powerUpSystem?.getSpeedMultiplier() ?? 1;
    speedMult *= this.specialAbility?.getDashSpeedMultiplier() ?? 1;

    // Environmental hazards (puddles slow, steam pushes)
    let envPushX = 0;
    let envPushY = 0;
    if (this.envHazards) {
      const envResult = this.envHazards.update(this.player.x, this.player.y, delta);
      speedMult *= envResult.speedMult;
      envPushX = envResult.pushX;
      envPushY = envResult.pushY;
    }

    if (speedMult !== 1) {
      this.player.speed = baseSpeed * speedMult;
    } else {
      this.player.speed = baseSpeed;
    }

    this.player.update(dir, sprint, delta);

    // Apply steam vent push
    if (envPushX !== 0 || envPushY !== 0) {
      this.player.x += envPushX * delta / 1000;
      this.player.y += envPushY * delta / 1000;
      this.particles?.dangerFlash();
      this.floatingText?.spawn(this.player.x, this.player.y - 10, 'STEAM!', '#cccccc', '4px');
    }

    // Update systems
    this.npcManager?.update(this.player.x, this.player.y, delta);
    this.dialogueSystem?.update(delta);
    this.dayNightSystem?.update(delta);
    this.weatherSystem?.update(delta);
    this.screenFX?.update(delta);

    // === TRAFFIC ===
    this.trafficSystem?.update(delta);

    // Near-miss detection (dodge cars for bonus!)
    this.nearMissTimer -= delta / 1000;
    if (this.nearMissTimer <= 0 && this.trafficSystem?.checkNearMiss(this.player.x, this.player.y)) {
      this.nearMissTimer = 2; // Cooldown
      this.floatingText?.spawn(this.player.x, this.player.y - 10, 'NEAR MISS!', '#00e5ff', '5px');
      this.comboSystem?.hit();
      this.streakAnnouncer?.hit();
      this.economyManager?.earn(25, 'near_miss');
      this.floatingText?.money(this.player.x, this.player.y, 25);
      this.screenFX?.bassPulse();
      this.actionFeed?.nearMiss();
    }

    // === SPRINT TRAIL ===
    const isMoving = Math.abs(dir.x) > 0.1 || Math.abs(dir.y) > 0.1;
    if (isMoving && sprint) {
      this.sprintTrailTimer -= delta / 1000;
      if (this.sprintTrailTimer <= 0) {
        this.sprintTrailTimer = 0.05; // Trail dot every 50ms
        this.particles?.neonTrail(this.player.x, this.player.y,
          this.player.characterClass === 'police' ? 0x3949ab :
          this.player.characterClass === 'rider' ? 0x78909c : 0x1565c0
        );
      }

      // Speed lines on screen every 200ms
      if (Math.random() < 0.15) {
        this.particles?.sprintLines();
      }
    }

    // Footstep audio
    if (isMoving) {
      this.footstepTimer -= delta / 1000;
      if (this.footstepTimer <= 0) {
        const stepSound = sprint ? 'step_sprint' : 'footstep_concrete';
        this.audioManager?.playSFX(stepSound);
        this.footstepTimer = sprint ? 0.2 : 0.3;
      }
    } else {
      this.footstepTimer = 0;
    }

    // Day/night music
    if (this.dayNightSystem?.isNight() && !this.missionManager?.isActive()) {
      this.audioManager?.crossfadeMusic('night_theme');
    }

    // Market systems update
    this.wantedSystem?.update(delta);
    this.comboSystem?.update(delta);

    // === WAVE 2 UPDATES ===
    this.actionFeed?.update(delta);

    // Special ability (Q key)
    if (this.specialAbility && this.player) {
      const abilityActivated = this.specialAbility.update(delta, this.player.x, this.player.y);
      if (abilityActivated) {
        const abilityName = this.player.characterClass === 'police' ? 'Badge Flash' :
                            this.player.characterClass === 'rider' ? 'Parkour Dash' : 'Horn Blast';
        this.actionFeed?.abilityUsed(abilityName);
        this.screenFX?.bassPulse();

        // Police: stun nearby NPCs
        const stunRadius = this.specialAbility.getStunRadius();
        if (stunRadius > 0 && this.npcManager) {
          // Stun effect on nearby mission NPCs
          for (const npc of this.missionNPCs) {
            const npcDist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
            if (npcDist < stunRadius) {
              const npcBody = npc.body as Phaser.Physics.Arcade.Body | null;
              if (npcBody) npcBody.setVelocity(0, 0);
              this.floatingText?.spawn(npc.x, npc.y - 8, 'STUNNED!', '#ffd700', '4px');
            }
          }
        }

        // Driver: scare nearby NPCs away
        const scareRadius = this.specialAbility.getScareRadius();
        if (scareRadius > 0 && this.npcManager) {
          for (const npc of this.missionNPCs) {
            const npcDist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
            if (npcDist < scareRadius) {
              const angle = Math.atan2(npc.y - this.player.y, npc.x - this.player.x);
              const scareBody = npc.body as Phaser.Physics.Arcade.Body | null;
              if (scareBody) scareBody.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
              this.floatingText?.spawn(npc.x, npc.y - 8, 'SCARED!', '#ff6f00', '4px');
            }
          }
        }
      }
    }

    // === POWER-UPS ===
    if (this.powerUpSystem && this.player) {
      const collected = this.powerUpSystem.update(this.player.x, this.player.y, delta);
      if (collected) {
        this.particles?.powerUpCollect(this.player.x, this.player.y,
          collected === 'speed_boost' ? 0x00e5ff :
          collected === 'magnet' ? 0xffd700 :
          collected === 'shield' ? 0x4caf50 :
          collected === 'double_money' ? 0xff6f00 : 0xd500f9
        );
        this.screenFX?.flashGold(0.15, 200);
        this.cameras.main.shake(80, 0.003);

        const labels: Record<string, string> = {
          speed_boost: 'TURBO!', magnet: 'MAGNET!', shield: 'SHIELD!',
          double_money: '2X MONEY!', slow_time: 'SLOW MO!',
        };
        this.floatingText?.screenAnnounce(labels[collected] ?? 'POWER UP!', '#00e5ff', '30px');
        this.actionFeed?.powerUp(labels[collected] ?? 'Power Up');

        if (collected === 'slow_time') {
          this.screenFX?.slowMotion(4);
        }
      }
    }

    // === RANDOM EVENTS ===
    if (this.randomEventSystem && this.player) {
      const collectedEvent = this.randomEventSystem.update(this.player.x, this.player.y, delta);
      if (collectedEvent) {
        const mult = (this.comboSystem?.getMultiplier() ?? 1) * (this.powerUpSystem?.getMoneyMultiplier() ?? 1);
        const money = Math.floor(collectedEvent.reward.money * mult);
        const xp = Math.floor(collectedEvent.reward.xp * mult);
        this.economyManager?.earn(money, 'random_event');
        this.progressionManager?.addXP(xp, 'random_event');
        this.comboSystem?.hit();
        this.streakAnnouncer?.hit();
        this.audioManager?.playSFX('money_earn');

        // Visual feedback
        this.particles?.pickupSparkle(this.player.x, this.player.y);
        this.particles?.moneyShower(this.player.x, this.player.y, money);
        this.floatingText?.money(this.player.x, this.player.y, money);
        this.floatingText?.xp(this.player.x, this.player.y, xp);
        this.screenFX?.flashGold(0.1, 200);

        this.game.events.emit('radio.hint', `${collectedEvent.title}: +$${money}`);
        this.actionFeed?.eventCollected(collectedEvent.title, money);
      }
    }

    // Mission updates
    if (this.missionManager?.isActive()) {
      this.missionManager.update(delta);
      this.game.registry.set('missionTimer', this.missionManager.getTimer());

      // Pursuit system
      if (this.pursuitSystem?.getIsActive()) {
        this.pursuitSystem.update(this.player.x, this.player.y, delta);

        const dist = this.pursuitSystem.getDistanceToTarget(this.player.x, this.player.y);
        const intensity = 1 - Math.min(dist / 300, 1);
        this.audioManager?.setMusicIntensity(intensity);

        // Auto-spot fare evaders
        for (const npc of this.missionNPCs) {
          if (npc instanceof FareEvader && !npc.hasBeenSpotted) {
            const npcDist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
            if (npcDist < npc.getDetectionRange()) {
              npc.spot(this.player.x, this.player.y);
              this.pursuitSystem.startPursuit(npc);

              // Dramatic spot effect
              this.floatingText?.screenAnnounce('SUSPECT SPOTTED!', '#ff4444', '24px');
              this.screenFX?.flashRed(0.1, 200);
              this.cameras.main.shake(100, 0.004);
            }
          }
        }
      }

      // Patrol system
      if (this.patrolSystem?.getIsActive()) {
        const reached = this.patrolSystem.update(this.player.x, this.player.y);
        if (reached) {
          this.missionManager.updateObjectiveByTarget(reached.id);
          this.particles?.catchExplosion(this.player.x, this.player.y);
          this.floatingText?.spawn(this.player.x, this.player.y - 10, 'CHECKPOINT!', '#4caf50', '5px');
        }
      }
    } else {
      this.game.registry.set('missionTimer', null);
    }

    // Action button handling
    const actionPressed = this.inputManager.isActionPressed();
    const isMob = this.inputManager.isMobileDevice();
    const actionKey = isMob ? 'TAP' : 'E';

    // Station interaction
    if (this.nearStation) {
      this.stationPrompt?.setVisible(true);
      this.stationPrompt?.setPosition(toScreenX(this.player.x), toScreenY(this.player.y) - 30);

      if (this.missionManager?.isActive()) {
        this.stationPrompt?.setText(`[${actionKey}] Enter Station`);
        this.inputManager.setActionLabel('ENTER');
      } else {
        this.stationPrompt?.setText(`[${actionKey}] Station / Missions`);
        this.inputManager.setActionLabel('ENTER');
      }

      if (actionPressed) {
        if (this.missionManager?.isActive()) {
          this.transitionToStation(this.nearStation.id);
        } else {
          void this.showMissionSelect(this.nearStation);
        }
        this.nearStation = null;
        this.inputManager.resetActionFlag();
        return;
      }
    } else {
      this.stationPrompt?.setVisible(false);

      if (this.npcManager) {
        const nearNpc = this.npcManager.getInteractableNPC(this.player.x, this.player.y);
        if (nearNpc && !this.dialogueSystem?.isVisible()) {
          this.stationPrompt?.setVisible(true);
          this.stationPrompt?.setPosition(toScreenX(this.player.x), toScreenY(this.player.y) - 30);
          this.stationPrompt?.setText(`[${actionKey}] Talk`);
          this.inputManager.setActionLabel('TALK');
        } else {
          this.inputManager.setActionLabel('ACT');
        }
      }
    }

    // NPC interaction
    if (actionPressed && !this.nearStation && this.npcManager && this.dialogueSystem) {
      const npc = this.npcManager.getInteractableNPC(this.player.x, this.player.y);
      if (npc && !this.dialogueSystem.isVisible()) {
        this.dialogueSystem.show(npc.npcType, npc.getDialogue());
        this.audioManager?.playSFX('npc_interact');

        if (this.missionManager?.isActive()) {
          this.missionManager.updateObjectiveByTarget('civilian');
          this.missionManager.updateObjectiveByTarget('suspicious_npc');
        }
      }
    }

    this.nearStation = null;
    this.game.registry.set('playerPos', this.player.getPosition());

    // UX updates
    this.playerIndicator?.update(this.player.x, this.player.y);

    if (this.objectiveArrow) {
      if (this.patrolSystem?.getIsActive()) {
        const cp = this.patrolSystem.getActiveCheckpointPosition();
        if (cp) this.objectiveArrow.setTarget(cp.x, cp.y, 'Objective');
        else this.objectiveArrow.clear();
      } else if (this.pursuitSystem?.getIsActive()) {
        const target = this.pursuitSystem.getTarget();
        if (target) this.objectiveArrow.setTarget(target.x, target.y, 'Suspect');
        else this.objectiveArrow.clear();
      } else if (this.missionManager?.isActive() && this.missionNPCs.length > 0) {
        // Point at unspotted fare evader so player can find them
        const evader = this.missionNPCs.find(n => n instanceof FareEvader && !n.hasBeenSpotted) as FareEvader | undefined;
        if (evader) {
          this.objectiveArrow.setTarget(evader.x, evader.y, 'Suspect Area');
        } else {
          this.objectiveArrow.clear();
        }
      } else if (!this.missionManager?.isActive()) {
        const nearestStation = this.findNearestStation();
        if (nearestStation) {
          this.objectiveArrow.setTarget(
            nearestStation.entrances[0].x,
            nearestStation.entrances[0].y,
            nearestStation.name
          );
        }
      } else {
        this.objectiveArrow.clear();
      }
      this.objectiveArrow.update(this.player.x, this.player.y);
    }

    // Interaction glows
    if (this.interactionGlow && this.mapManager?.currentDistrict) {
      this.interactionGlow.hideAll();
      for (const station of this.mapManager.currentDistrict.stations) {
        for (const entrance of station.entrances) {
          const eDist = Math.hypot(entrance.x - this.player.x, entrance.y - this.player.y);
          if (eDist < 40) {
            this.interactionGlow.showGlow(
              'station_' + station.id,
              toScreenX(entrance.x), toScreenY(entrance.y),
              0xff6f00, 14
            );
          }
        }
      }
    }

    this.inputManager.resetActionFlag();
  }

  private cleanupScene(): void {
    this.colliders.forEach((collider) => collider.destroy());
    this.overlaps.forEach((overlap) => overlap.destroy());
    this.colliders = [];
    this.overlaps = [];

    if (this.game && this.game.events) {
      this.game.events.off(GameEvents.MISSION_STARTED);
      this.game.events.off(GameEvents.MISSION_COMPLETED);
      this.game.events.off(GameEvents.MISSION_FAILED);
      this.game.events.off(GameEvents.MISSION_OBJECTIVE_COMPLETE);
      this.game.events.off(GameEvents.NPC_CAUGHT);
      this.game.events.off('exitStation');
      this.game.events.off('radio.hint');
    }

    this.events.off('wake');

    this.npcManager?.despawnAll();
    this.inputManager?.destroy();
    this.actionFeed = null;
    this.particles = null;
    this.floatingText = null;
    this.powerUpSystem = null;
    this.trafficSystem = null;
    this.screenFX = null;
    this.specialAbility = null;
    this.envHazards = null;
    this.cinematicCamera = null;
    this.player = null;
  }

  private async loadAndLaunchScene(key: SceneKey, data?: any): Promise<void> {
    await ensureSceneLoaded(this, key);
    this.scene.launch(key, data);
  }

  private findNearestStation(): Station | null {
    if (!this.mapManager?.currentDistrict || !this.player) return null;
    let nearest: Station | null = null;
    let nearestDist = Infinity;
    for (const station of this.mapManager.currentDistrict.stations) {
      const dist = Math.hypot(
        station.entrances[0].x - this.player.x,
        station.entrances[0].y - this.player.y
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = station;
      }
    }
    return nearest;
  }

  // === Mission Select ===

  private async showMissionSelect(station: Station): Promise<void> {
    this.missionMenuOpen = true;

    // Must await so the scene is registered before we attach the shutdown listener
    await this.loadAndLaunchScene('MissionSelectScene', { stationName: station.name, stationId: station.id });

    this.scene.get('MissionSelectScene')?.events.once('shutdown', () => {
      this.missionMenuOpen = false;
    });

    this.game.events.once('enterStationFromMenu', (stationId: string) => {
      this.missionMenuOpen = false;
      this.transitionToStation(stationId);
    });
  }

  // === Mission Lifecycle ===

  private onMissionStarted(mission: MissionDefinition): void {
    this.cleanupMissionNPCs();

    const station = this.mapManager?.getStation(mission.stationId);
    if (!station) return;

    this.audioManager?.playSFX('mission_start');
    this.actionFeed?.missionStart(mission.title);

    // Cinematic mission intro if we have a station position
    if (this.cinematicCamera && this.player) {
      this.cinematicCamera.missionIntro(
        station.position.x, station.position.y,
        this.player.x, this.player.y,
        mission.title,
        () => { /* intro complete */ }
      );
    }

    // Epic mission start effect
    this.floatingText?.screenAnnounce('MISSION START', '#ff6f00', '32px');
    this.screenFX?.flashWhite(0.2, 400);
    this.cameras.main.shake(150, 0.005);

    switch (mission.type) {
      case 'pursuit':
        this.spawnPursuitNPCs(mission, station);
        this.audioManager?.crossfadeMusic('chase_theme');
        break;
      case 'patrol':
        this.startPatrolMission(mission);
        break;
      case 'investigate':
        break;
      case 'escort':
        break;
    }

    if (mission.id === 'police_m07') {
      this.dayNightSystem?.setTime(0.9);
    }

    this.placeObjectiveWaypoints(mission);
  }

  private placeObjectiveWaypoints(mission: MissionDefinition): void {
    this.waypointMarker?.clearAll();

    for (const obj of mission.objectives) {
      if (obj.optional) continue;

      let wx = 0, wy = 0, label = obj.description;
      let found = false;

      if (obj.type === 'reach_location' || obj.type === 'collect_item') {
        const targetId = obj.targetId.replace('_platform', '');
        const station = this.mapManager?.getStation(targetId);
        if (station) {
          wx = station.position.x; wy = station.position.y;
          label = station.name; found = true;
        }
      }

      if (obj.type === 'catch_npc') {
        const station = this.mapManager?.getStation(mission.stationId);
        if (station) {
          wx = station.position.x; wy = station.position.y;
          label = 'Suspect'; found = true;
        }
      }

      if (obj.type === 'interact_object' || obj.type === 'escort_npc') {
        const station = this.mapManager?.getStation(mission.stationId);
        if (station) {
          wx = station.position.x; wy = station.position.y;
          label = station.name; found = true;
        }
      }

      if (found) {
        const color = obj.type === 'catch_npc' ? 0xff4444 : 0xff6f00;
        this.waypointMarker?.addWaypoint(obj.id, wx, wy, label, color);
      }
    }
  }

  private spawnPursuitNPCs(mission: MissionDefinition, station: Station): void {
    for (const obj of mission.objectives) {
      if (obj.type === 'catch_npc') {
        const spawnX = station.position.x + (Math.random() - 0.5) * 60;
        const spawnY = station.position.y + (Math.random() - 0.5) * 60;
        const evader = new FareEvader(this, spawnX, spawnY);
        evader.setDepth(90);
        this.missionNPCs.push(evader);

        const npcGroup = this.npcManager?.getGroup();
        if (npcGroup) { npcGroup.add(evader); }

        // Point waypoint at ACTUAL evader position, not station center
        this.waypointMarker?.removeWaypoint(obj.id);
        this.waypointMarker?.addWaypoint(obj.id, spawnX, spawnY, 'Suspect', 0xff4444);
      }
    }
  }

  private startPatrolMission(mission: MissionDefinition): void {
    const checkpoints: PatrolCheckpoint[] = [];
    for (const obj of mission.objectives) {
      if (obj.type === 'reach_location') {
        const station = this.mapManager?.getStation(obj.targetId.replace('_platform', ''));
        if (station) {
          checkpoints.push({
            id: obj.targetId,
            position: station.position,
            stationId: station.id,
            reached: false,
          });
        }
      }
    }
    if (checkpoints.length > 0) {
      this.patrolSystem?.startPatrol(checkpoints);
    }
  }

  private onMissionEnded(mission: MissionDefinition, success: boolean): void {
    this.cleanupMissionNPCs();
    this.pursuitSystem?.stop();
    this.patrolSystem?.stop();
    this.waypointMarker?.clearAll();
    this.audioManager?.crossfadeMusic('street_theme');

    if (success) {
      // EPIC SUCCESS
      this.particles?.confettiRain();
      this.screenFX?.flashGold(0.2, 500);
      this.cameras.main.shake(200, 0.008);
      this.floatingText?.screenAnnounce('MISSION COMPLETE!', '#4caf50', '32px');
      this.actionFeed?.missionComplete();

      this.comboSystem?.hit();
      this.streakAnnouncer?.hit();
      this.dailyChallenges?.updateProgress('missions');

      // Power-up drop from completed mission
      this.powerUpSystem?.spawnAt(this.player!.x + 15, this.player!.y);
    } else {
      // Failure
      this.screenFX?.flashRed(0.3, 400);
      this.cameras.main.shake(300, 0.015);
      this.floatingText?.screenAnnounce('MISSION FAILED', '#ff4444', '32px');
      this.actionFeed?.missionFailed();
      this.comboSystem?.break();
      this.streakAnnouncer?.reset();
    }

    if (success && this.economyManager && this.progressionManager) {
      const comboMult = this.comboSystem?.getMultiplier() ?? 1;
      const moneyMult = this.powerUpSystem?.getMoneyMultiplier() ?? 1;
      const totalMoney = Math.floor((mission.rewards.money + mission.rewards.bonusMoney) * comboMult * moneyMult);
      this.economyManager.earn(totalMoney, mission.id);
      this.dailyChallenges?.updateProgress('money', totalMoney);

      const totalXP = Math.floor((mission.rewards.xp + mission.rewards.bonusXp) * comboMult);
      this.progressionManager.addXP(totalXP, mission.id);

      // Floating reward text
      if (this.player) {
        this.floatingText?.money(this.player.x, this.player.y, totalMoney);
        this.floatingText?.xp(this.player.x, this.player.y, totalXP);
        this.particles?.moneyShower(this.player.x, this.player.y, totalMoney);
      }

      // Award items
      for (const itemId of mission.rewards.itemIds) {
        const save = this.saveManager?.load();
        if (save) {
          const cp = save.classes[save.selectedClass];
          if (!cp.ownedItems.includes(itemId)) { cp.ownedItems.push(itemId); }
          if (!cp.ownedSkinIds.includes(itemId) && itemId.includes('skin')) {
            cp.ownedSkinIds.push(itemId);
          }
          this.saveManager?.save(save);
        }
      }

      // NPC caught stat
      const save = this.saveManager?.load();
      if (save) {
        const catchCount = mission.objectives.filter(o => o.type === 'catch_npc').length;
        save.stats.npcsCaught += catchCount;
        this.saveManager?.save(save);
      }
    }

    this.missionManager?.reset();
    void this.loadAndLaunchScene('MissionCompleteScene', {
      mission, success,
      rewards: success ? mission.rewards : undefined,
      reason: success ? undefined : 'Mission failed.',
    });
  }

  private onNPCCaught(npcId: string): void {
    if (!this.player) return;

    // === MEGA CATCH EFFECTS ===
    this.particles?.catchExplosion(this.player.x, this.player.y);
    this.screenFX?.slowMotion(1.5); // Bullet time!
    this.screenFX?.flashWhite(0.15, 200);
    this.cameras.main.shake(150, 0.008);
    this.audioManager?.playSFX('catch_npc');
    this.cinematicCamera?.catchCam(this.player.x, this.player.y);

    // ActionFeed entry
    const catchMult = this.comboSystem?.getMultiplier() ?? 1;
    const catchMoneyMult = this.powerUpSystem?.getMoneyMultiplier() ?? 1;
    const catchReward = Math.floor(100 * catchMult * catchMoneyMult);
    this.actionFeed?.caught(catchReward);

    // Combo + streak + wanted
    this.comboSystem?.hit();
    this.streakAnnouncer?.hit();
    this.wantedSystem?.addHeat(25);
    this.dailyChallenges?.updateProgress('npcs');

    // Floating text
    const mult = this.comboSystem?.getMultiplier() ?? 1;
    if (mult > 1) {
      this.floatingText?.combo(this.player.x, this.player.y, mult);
    }
    this.floatingText?.spawn(this.player.x, this.player.y - 15, 'CAUGHT!', '#ff6f00', '6px');

    // Chance to drop a power-up
    this.powerUpSystem?.spawnAt(this.player.x + 10, this.player.y + 5);

    // Achievements
    const save = this.saveManager?.load();
    if (save && this.achievements) {
      const unlocked = this.achievements.checkStats({
        npcsCaught: save.stats.npcsCaught + 1,
        totalMoneyEarned: save.stats.totalMoneyEarned,
        highestLevel: save.stats.highestLevel,
        completedMissions: save.classes[save.selectedClass].completedMissionIds,
        dailyStreak: this.dailyChallenges?.getStreak() ?? 0,
      });
      for (const ach of unlocked) {
        this.floatingText?.screenAnnounce(`🏆 ${ach.name}`, '#ffd700', '28px');
        this.particles?.levelUpExplosion();
        this.game.events.emit('radio.hint', `Achievement: ${ach.name}`);
        this.actionFeed?.achievement(ach.name);
      }
    }

    // Find objective
    if (!this.missionManager?.isActive()) return;
    for (const npc of this.missionNPCs) {
      if (npc.entityId === npcId) {
        const objectives = this.missionManager.getObjectiveProgress();
        for (const obj of objectives) {
          if (!obj.completed && (obj.description.toLowerCase().includes('catch') || obj.description.toLowerCase().includes('kingpin'))) {
            this.missionManager.updateObjective(obj.id, 1);
            break;
          }
        }
        break;
      }
    }
  }

  private cleanupMissionNPCs(): void {
    for (const npc of this.missionNPCs) {
      npc.deactivate();
      npc.destroy();
    }
    this.missionNPCs = [];
  }

  // === Scene Transitions ===

  private transitionToStation(stationId: string): void {
    this.npcManager?.despawnAll();
    this.weatherSystem?.hide();

    // Cinematic screen wipe transition
    if (this.cinematicCamera) {
      const finalZoom = this.cameras.main.zoom;
      this.cinematicCamera.screenWipe('left', () => {
        this.cameras.main.setZoom(finalZoom);
        this.scene.sleep('GameScene');
        void this.loadAndLaunchScene('StationScene', { stationId });
      });
    } else {
      // Fallback zoom transition
      const finalZoom = this.cameras.main.zoom;
      this.tweens.add({
        targets: this.cameras.main,
        zoom: finalZoom * 2,
        duration: 400,
        ease: 'Power2',
      });
      this.cameras.main.fadeOut(400);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.cameras.main.setZoom(finalZoom);
        this.scene.sleep('GameScene');
        void this.loadAndLaunchScene('StationScene', { stationId });
      });
    }
  }

  private returnFromStation(stationId: string): void {
    const station = this.mapManager?.getStation(stationId);
    if (station && this.player) {
      this.player.setPosition(station.entrances[0].x, station.entrances[0].y - 15);
    }

    this.dailyChallenges?.updateProgress('stations');
    this.achievements?.tryUnlock('first_station');

    if (this.missionManager?.isActive() && this.patrolSystem?.getIsActive()) {
      const checkpoints = this.patrolSystem['checkpoints'] as PatrolCheckpoint[];
      for (const cp of checkpoints) {
        if (!cp.reached && cp.stationId === stationId) {
          cp.reached = true;
          this.missionManager.updateObjectiveByTarget(cp.id);
        }
      }
    }

    if (this.missionManager?.isActive()) {
      this.missionManager.updateObjectiveByTarget(stationId);
    }

    this.scene.wake('GameScene');
    this.weatherSystem?.show();
    this.audioManager?.crossfadeMusic('street_theme');

    // Epic return zoom-out
    const viewWidth = this.cameras.main.width;
    const targetZoom = viewWidth / 250;
    this.cameras.main.setZoom(targetZoom * 1.5);
    this.cameras.main.fadeIn(400);
    this.tweens.add({
      targets: this.cameras.main,
      zoom: targetZoom,
      duration: 500,
      ease: 'Power2',
    });
  }
}
