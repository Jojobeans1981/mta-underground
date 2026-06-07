import Phaser from 'phaser';
import { ensureSceneLoaded, SceneKey } from '@/sceneLoader';
import { SpriteFactory } from '@/graphics/SpriteFactory';
import { SaveManager } from '@/managers/SaveManager';
import { InputManager } from '@/managers/InputManager';
import { AudioManager } from '@/managers/AudioManager';
import { MapManager } from '@/managers/MapManager';
import { NPCManager } from '@/managers/NPCManager';
import { MissionManager } from '@/managers/MissionManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { ProgressionManager } from '@/managers/ProgressionManager';
import { LeaderboardSystem } from '@/systems/LeaderboardSystem';
import { IAPManager } from '@/managers/IAPManager';
import { AdManager } from '@/managers/AdManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  async create(): Promise<void> {
    // Generate all programmatic textures
    SpriteFactory.generateAllTextures(this);

    // Instantiate managers
    const saveManager = new SaveManager();
    const inputManager = new InputManager();
    const audioManager = new AudioManager();
    const mapManager = new MapManager();
    const npcManager = new NPCManager();
    const missionManager = new MissionManager();
    const economyManager = new EconomyManager();
    const progressionManager = new ProgressionManager();
    const leaderboard = new LeaderboardSystem();
    const iapManager = new IAPManager();
    const adManager = new AdManager();

    // Store in registry
    this.game.registry.set('saveManager', saveManager);
    this.game.registry.set('inputManager', inputManager);
    this.game.registry.set('audioManager', audioManager);
    this.game.registry.set('mapManager', mapManager);
    this.game.registry.set('npcManager', npcManager);
    this.game.registry.set('missionManager', missionManager);
    this.game.registry.set('economyManager', economyManager);
    this.game.registry.set('progressionManager', progressionManager);
    this.game.registry.set('leaderboard', leaderboard);
    this.game.registry.set('iapManager', iapManager);
    this.game.registry.set('adManager', adManager);

    // Initialize managers
    audioManager.init(this);
    missionManager.init(saveManager, this.game.events);
    leaderboard.init();
    iapManager.init(this.game.events);
    adManager.init(this.game.events);

    // Check if ad-free was previously purchased
    if (iapManager.isAdFree()) {
      adManager.setAdFree(true);
    }

    // Economy and progression init from save (if exists)
    const save = saveManager.load();
    if (save) {
      economyManager.init(save, saveManager, this.game.events);
      progressionManager.init(save, saveManager, economyManager, this.game.events);
    }

    // Transition to MainMenuScene
    await ensureSceneLoaded(this, 'MainMenuScene');
    this.scene.start('MainMenuScene');
  }
}
