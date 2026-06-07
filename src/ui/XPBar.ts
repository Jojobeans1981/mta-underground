import Phaser from 'phaser';
import { hexToNum, COLOR_UI_XP, COLOR_UI_SURFACE, COLOR_UI_MONEY } from '@/graphics/colors';
import { MINIMAP_SIZE, HUD_PADDING } from '@/config/constants';

export class XPBar {
  private container: Phaser.GameObjects.Container;
  private levelText: Phaser.GameObjects.Text;
  private barBg: Phaser.GameObjects.Rectangle;
  private barFill: Phaser.GameObjects.Rectangle;
  private levelUpText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private barWidth: number = 80;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const x = scene.cameras.main.width - MINIMAP_SIZE - HUD_PADDING;
    const y = HUD_PADDING + MINIMAP_SIZE + 60;

    this.barWidth = 200;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(999);

    // Level text
    this.levelText = scene.add.text(0, 0, 'LVL 1', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.container.add(this.levelText);

    // Bar background
    this.barBg = scene.add.rectangle(100 + this.barWidth / 2, 13, this.barWidth, 15, hexToNum(COLOR_UI_SURFACE));
    this.container.add(this.barBg);

    // Bar fill
    this.barFill = scene.add.rectangle(100, 13, 0, 15, hexToNum(COLOR_UI_XP));
    this.barFill.setOrigin(0, 0.5);
    this.container.add(this.barFill);

    // Level up text (hidden)
    this.levelUpText = scene.add.text(100 + this.barWidth / 2, -20, 'LEVEL UP!', {
      fontSize: '25px',
      color: COLOR_UI_MONEY,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0);
    this.container.add(this.levelUpText);
  }

  setLevel(level: number): void {
    this.levelText.setText('LVL ' + level);
  }

  setProgress(progress: number): void {
    const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
    this.barFill.width = clampedProgress * this.barWidth;
  }

  animateProgress(targetProgress: number): void {
    const target = Phaser.Math.Clamp(targetProgress, 0, 1) * this.barWidth;
    this.scene.tweens.add({
      targets: this.barFill,
      width: target,
      duration: 500,
      ease: 'Power2',
    });
  }

  animateLevelUp(): void {
    // Flash the bar gold
    this.scene.tweens.add({
      targets: this.barFill,
      width: this.barWidth,
      duration: 300,
      onComplete: () => {
        this.barFill.setFillStyle(hexToNum(COLOR_UI_MONEY));
        this.scene.time.delayedCall(400, () => {
          this.barFill.setFillStyle(hexToNum(COLOR_UI_XP));
          this.barFill.width = 0;
        });
      },
    });

    // Show "LEVEL UP!" text
    this.levelUpText.setAlpha(1);
    this.scene.tweens.add({
      targets: this.levelUpText,
      y: -50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        this.levelUpText.setY(-20);
      },
    });
  }

  destroy(): void {
    this.levelUpText.destroy();
    this.barFill.destroy();
    this.barBg.destroy();
    this.levelText.destroy();
    this.container.destroy();
  }
}
