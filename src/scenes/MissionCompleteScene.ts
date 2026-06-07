import Phaser from 'phaser';
import { ensureSceneLoaded, SceneKey } from '@/sceneLoader';
import { MissionDefinition, MissionRewards } from '@/types/game.types';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_SURFACE, COLOR_UI_SUCCESS, COLOR_UI_DANGER, COLOR_UI_MONEY, COLOR_UI_XP } from '@/graphics/colors';

export class MissionCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MissionCompleteScene' });
  }

  create(data: { mission: MissionDefinition; success: boolean; rewards?: MissionRewards; reason?: string }): void {
    const { width, height } = this.cameras.main;
    const { mission, success, rewards, reason } = data;

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);

    // Compact panel
    const panelW = width * 0.85;
    const panelH = height * 0.5;
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, hexToNum(COLOR_UI_SURFACE), 0.95);
    panel.setStrokeStyle(2, success ? hexToNum(COLOR_UI_SUCCESS) : hexToNum(COLOR_UI_DANGER));

    const panelTop = height / 2 - panelH / 2;
    let y = panelTop + 38;

    // Header
    this.add.text(width / 2, y, success ? 'MISSION COMPLETE' : 'MISSION FAILED', {
      fontSize: '30px', color: success ? COLOR_UI_SUCCESS : COLOR_UI_DANGER, fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 40;

    // Mission title
    this.add.text(width / 2, y, mission.title, {
      fontSize: '20px', color: '#cccccc',
    }).setOrigin(0.5);
    y += 45;

    if (success && rewards) {
      const moneyText = this.add.text(width / 2 - 75, y, '$0', {
        fontSize: '28px', color: COLOR_UI_MONEY, fontStyle: 'bold',
      }).setOrigin(0.5);

      const xpText = this.add.text(width / 2 + 75, y, 'XP: 0', {
        fontSize: '28px', color: COLOR_UI_XP, fontStyle: 'bold',
      }).setOrigin(0.5);

      const counter = { money: 0, xp: 0 };
      this.tweens.add({
        targets: counter,
        money: rewards.money,
        xp: rewards.xp,
        duration: 1000,
        ease: 'Power2',
        onUpdate: () => {
          moneyText.setText('$' + Math.floor(counter.money));
          xpText.setText('XP: ' + Math.floor(counter.xp));
        },
      });
      y += 50;

      if (rewards.bonusMoney > 0 || rewards.bonusXp > 0) {
        this.add.text(width / 2, y, `Bonus: +$${rewards.bonusMoney} / +${rewards.bonusXp} XP`, {
          fontSize: '18px', color: COLOR_UI_PRIMARY,
        }).setOrigin(0.5);
      }
    } else if (!success && reason) {
      this.add.text(width / 2, y, reason, {
        fontSize: '20px', color: '#ff8888', align: 'center',
      }).setOrigin(0.5);
    }

    // Buttons at bottom
    const btnY = panelTop + panelH - 43;

    if (success) {
      const contBg = this.add.rectangle(width / 2, btnY, 200, 50, hexToNum(COLOR_UI_PRIMARY));
      contBg.setInteractive({ useHandCursor: true });
      this.add.text(width / 2, btnY, 'CONTINUE', {
        fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      contBg.on('pointerdown', () => this.scene.stop('MissionCompleteScene'));
      contBg.on('pointerover', () => contBg.setFillStyle(hexToNum('#ff8f00')));
      contBg.on('pointerout', () => contBg.setFillStyle(hexToNum(COLOR_UI_PRIMARY)));
    } else {
      const retryBg = this.add.rectangle(width / 2 - 88, btnY, 138, 45, hexToNum(COLOR_UI_PRIMARY));
      retryBg.setInteractive({ useHandCursor: true });
      this.add.text(width / 2 - 88, btnY, 'RETRY', {
        fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      retryBg.on('pointerdown', () => {
        this.scene.stop('MissionCompleteScene');
        void this.loadAndLaunchScene('MissionBriefScene', { mission });
      });

      const quitBg = this.add.rectangle(width / 2 + 88, btnY, 138, 45, 0x555555);
      quitBg.setInteractive({ useHandCursor: true });
      this.add.text(width / 2 + 88, btnY, 'QUIT', {
        fontSize: '18px', color: '#cccccc', fontStyle: 'bold',
      }).setOrigin(0.5);
      quitBg.on('pointerdown', () => this.scene.stop('MissionCompleteScene'));
    }
  }

  private async loadAndLaunchScene(key: SceneKey, data?: any): Promise<void> {
    await ensureSceneLoaded(this, key);
    this.scene.launch(key, data);
  }
}
