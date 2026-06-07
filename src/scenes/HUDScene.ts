import Phaser from 'phaser';
import { MiniMap } from '@/ui/MiniMap';
import { MissionTracker } from '@/ui/MissionTracker';
import { RadioDisplay } from '@/ui/RadioDisplay';
import { MoneyDisplay } from '@/ui/MoneyDisplay';
import { XPBar } from '@/ui/XPBar';
import { NotificationToast } from '@/ui/NotificationToast';
import { MapManager } from '@/managers/MapManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { ProgressionManager } from '@/managers/ProgressionManager';
import { AudioManager } from '@/managers/AudioManager';
import { SaveManager } from '@/managers/SaveManager';
import { GameEvents } from '@/types/events.types';
import { MissionDefinition } from '@/types/game.types';
import { hexToNum, COLOR_UI_TEXT_DIM } from '@/graphics/colors';
import { ActionFeed } from '@/ui/ActionFeed';
import { HUD_PADDING } from '@/config/constants';

export class HUDScene extends Phaser.Scene {
  private minimap: MiniMap | null = null;
  private missionTracker: MissionTracker | null = null;
  private radioDisplay: RadioDisplay | null = null;
  private moneyDisplay: MoneyDisplay | null = null;
  private xpBar: XPBar | null = null;
  private notificationToast: NotificationToast | null = null;
  private fpsText: Phaser.GameObjects.Text | null = null;
  private escKey: Phaser.Input.Keyboard.Key | null = null;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const economyManager = this.game.registry.get('economyManager') as EconomyManager | undefined;
    const progressionManager = this.game.registry.get('progressionManager') as ProgressionManager | undefined;
    const audioManager = this.game.registry.get('audioManager') as AudioManager | undefined;

    // Minimap — pass subway lines so route connections are drawn
    const mapManager = this.game.registry.get('mapManager') as MapManager;
    if (mapManager.currentDistrict) {
      this.minimap = new MiniMap(this, mapManager.currentDistrict, mapManager.subwayLines);
    }

    // Mission tracker
    this.missionTracker = new MissionTracker(this);

    // Radio display
    this.radioDisplay = new RadioDisplay(this);

    // Money display
    this.moneyDisplay = new MoneyDisplay(this);
    if (economyManager) {
      this.moneyDisplay.setBalance(economyManager.getBalance());
    }

    // XP bar
    this.xpBar = new XPBar(this);
    if (progressionManager) {
      this.xpBar.setLevel(progressionManager.getLevel());
      this.xpBar.setProgress(progressionManager.getXPProgress());
    }

    // Notification toast
    this.notificationToast = new NotificationToast(this);

    // Pause button (top-left)
    const pauseBtn = this.add.text(HUD_PADDING, HUD_PADDING, '| |', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#00000066',
      padding: { x: 6, y: 3 },
    })
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      audioManager?.playSFX('ui_click');
      if (!this.scene.isActive('PauseScene')) {
        this.scene.launch('PauseScene');
      }
    });

    // FPS counter (hidden by default)
    this.fpsText = this.add.text(HUD_PADDING, HUD_PADDING + 28, '', {
      fontSize: '9px',
      color: COLOR_UI_TEXT_DIM,
    }).setScrollFactor(0).setDepth(999);

    // ESC key to pause
    if (this.input.keyboard) {
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.escKey.on('down', () => {
        if (!this.scene.isActive('PauseScene')) {
          this.scene.launch('PauseScene');
        }
      });
    }

    // === Event Listeners ===

    this.game.events.on(GameEvents.MISSION_STARTED, (data: { mission: MissionDefinition }) => {
      this.missionTracker?.setMission(data.mission);
      this.radioDisplay?.showMessage(
        `Dispatch: ${data.mission.title} — ${data.mission.description}`,
        'urgent'
      );
      audioManager?.playSFX('radio_crackle');
    });

    this.game.events.on(GameEvents.MISSION_OBJECTIVE_COMPLETE, (data: { objectiveId: string; mission: MissionDefinition }) => {
      const idx = data.mission.objectives.findIndex((o) => o.id === data.objectiveId);
      if (idx >= 0) {
        const obj = data.mission.objectives[idx];
        this.missionTracker?.updateObjective(idx, obj.count, obj.count, true);
      }
      this.radioDisplay?.showMessage('Objective complete. Good work, Officer.', 'normal');
      audioManager?.playSFX('radio_beep');
    });

    this.game.events.on(GameEvents.MISSION_COMPLETED, () => {
      this.missionTracker?.clear();
      this.radioDisplay?.showMessage('Mission complete. Return to base.', 'normal');
      audioManager?.playSFX('mission_complete');
    });

    this.game.events.on(GameEvents.MISSION_FAILED, (data: { reason: string }) => {
      this.missionTracker?.clear();
      this.radioDisplay?.showMessage(`Mission failed: ${data.reason}`, 'urgent');
      audioManager?.playSFX('mission_fail');
    });

    this.game.events.on(GameEvents.MONEY_EARNED, (data: { amount: number; newBalance: number }) => {
      this.moneyDisplay?.updateBalance(data.newBalance);
      audioManager?.playSFX('money_earn');
    });

    this.game.events.on(GameEvents.MONEY_SPENT, (data: { amount: number; newBalance: number }) => {
      this.moneyDisplay?.updateBalance(data.newBalance);
      audioManager?.playSFX('money_spend');
    });

    // Radio hints (non-mission)
    this.game.events.on('radio.hint', (message: string) => {
      this.radioDisplay?.showMessage(message, 'normal');
    });

    this.game.events.on(GameEvents.XP_EARNED, () => {
      if (progressionManager) {
        this.xpBar?.animateProgress(progressionManager.getXPProgress());
      }
    });

    this.game.events.on(GameEvents.LEVEL_UP, (data: { newLevel: number }) => {
      this.xpBar?.setLevel(data.newLevel);
      this.xpBar?.animateLevelUp();
      this.notificationToast?.show('level_up', `LEVEL UP! Now Level ${data.newLevel}`);
      audioManager?.playSFX('levelup');

      // ActionFeed integration
      const feed = this.game.registry.get('actionFeed') as ActionFeed | undefined;
      feed?.levelUp(data.newLevel);
    });

    this.game.events.on(GameEvents.MISSION_UNLOCKED, () => {
      this.notificationToast?.show('mission_unlock', `New Mission Available!`);
    });

    this.game.events.on(GameEvents.ITEM_PURCHASED, (data: { name: string }) => {
      this.notificationToast?.show('purchase', `Purchased: ${data.name}`);
    });

    this.events.once('shutdown', () => {
      this.cleanupHUDScene();
    });

    // Ensure HUD renders on top
    this.scene.bringToTop();
  }

  private cleanupHUDScene(): void {
    if (this.game && this.game.events) {
      this.game.events.off(GameEvents.MISSION_STARTED);
      this.game.events.off(GameEvents.MISSION_OBJECTIVE_COMPLETE);
      this.game.events.off(GameEvents.MISSION_COMPLETED);
      this.game.events.off(GameEvents.MISSION_FAILED);
      this.game.events.off(GameEvents.MONEY_EARNED);
      this.game.events.off(GameEvents.MONEY_SPENT);
      this.game.events.off('radio.hint');
      this.game.events.off(GameEvents.XP_EARNED);
      this.game.events.off(GameEvents.LEVEL_UP);
      this.game.events.off(GameEvents.MISSION_UNLOCKED);
      this.game.events.off(GameEvents.ITEM_PURCHASED);
    }

    this.minimap?.destroy();
    this.missionTracker?.destroy();
    this.radioDisplay?.destroy();
    this.moneyDisplay?.destroy();
    this.xpBar?.destroy();
    this.notificationToast?.destroy();
    this.fpsText?.destroy();
    this.escKey?.destroy();

    this.minimap = null;
    this.missionTracker = null;
    this.radioDisplay = null;
    this.moneyDisplay = null;
    this.xpBar = null;
    this.notificationToast = null;
    this.fpsText = null;
    this.escKey = null;
  }

  update(_time: number, delta: number): void {
    // Minimap
    const playerPos = this.game.registry.get('playerPos') as { x: number; y: number } | undefined;
    if (playerPos && this.minimap) {
      this.minimap.update(playerPos.x, playerPos.y);
    }

    // Radio typewriter
    this.radioDisplay?.update(delta);

    // Mission timer
    const missionTimer = this.game.registry.get('missionTimer') as number | null | undefined;
    if (missionTimer !== undefined && missionTimer !== null) {
      this.missionTracker?.updateTimer(missionTimer);
    }

    // Notification toast
    this.notificationToast?.update(delta);

    // FPS counter
    const showFps = this.game.registry.get('showFps') as boolean | undefined;
    if (showFps && this.fpsText) {
      this.fpsText.setVisible(true);
      this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    } else if (this.fpsText) {
      this.fpsText.setVisible(false);
    }
  }
}
