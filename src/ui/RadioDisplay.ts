import Phaser from 'phaser';
import { hexToNum, COLOR_UI_SURFACE, COLOR_UI_PRIMARY } from '@/graphics/colors';

export class RadioDisplay {
  private container: Phaser.GameObjects.Container;
  private messageText: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private radioIcon: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  private isShowing: boolean = false;
  private fullMessage: string = '';
  private displayedChars: number = 0;
  private typeSpeed: number = 30; // chars per second
  private hideTimer: number = 0;
  private typingComplete: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const width = scene.cameras.main.width;

    this.container = scene.add.container(width / 2, 25);
    this.container.setScrollFactor(0);
    this.container.setDepth(996);

    // Background
    this.background = scene.add.rectangle(0, 25, 550, 60, hexToNum(COLOR_UI_SURFACE), 0.9);
    this.container.add(this.background);

    // Border
    this.border = scene.add.rectangle(0, 25, 555, 65);
    this.border.setStrokeStyle(2, hexToNum(COLOR_UI_PRIMARY));
    this.border.setFillStyle(0x000000, 0);
    this.container.add(this.border);

    // Radio icon
    this.radioIcon = scene.add.circle(-250, 25, 10, hexToNum(COLOR_UI_PRIMARY));
    this.container.add(this.radioIcon);

    // Message text
    this.messageText = scene.add.text(-220, 10, '', {
      fontSize: '20px',
      color: '#ffffff',
      wordWrap: { width: 450 },
    });
    this.container.add(this.messageText);

    this.container.setVisible(false);
  }

  showMessage(message: string, priority: 'normal' | 'urgent' = 'normal'): void {
    this.fullMessage = message;
    this.displayedChars = 0;
    this.typingComplete = false;
    this.hideTimer = 0;
    this.isShowing = true;

    this.typeSpeed = priority === 'urgent' ? 50 : 30;

    // Visual style based on priority
    if (priority === 'urgent') {
      this.messageText.setColor(COLOR_UI_PRIMARY);
      this.border.setStrokeStyle(2, hexToNum(COLOR_UI_PRIMARY));
      // Flash border
      this.scene.tweens.add({
        targets: this.border,
        alpha: { from: 0.3, to: 1 },
        duration: 300,
        repeat: 3,
        yoyo: true,
      });
    } else {
      this.messageText.setColor('#ffffff');
      this.border.setStrokeStyle(1, hexToNum(COLOR_UI_PRIMARY));
    }

    this.messageText.setText('');
    this.container.setVisible(true);

    // Pulse radio icon
    this.scene.tweens.add({
      targets: this.radioIcon,
      alpha: { from: 1, to: 0.3 },
      duration: 200,
      repeat: 2,
      yoyo: true,
    });
  }

  update(delta: number): void {
    if (!this.isShowing) return;

    const dt = delta / 1000;

    if (!this.typingComplete) {
      // Typewriter effect
      this.displayedChars += this.typeSpeed * dt;
      const chars = Math.floor(this.displayedChars);

      if (chars >= this.fullMessage.length) {
        this.messageText.setText(this.fullMessage);
        this.typingComplete = true;
        this.hideTimer = 3.0;
      } else {
        this.messageText.setText(this.fullMessage.substring(0, chars));
      }
    } else {
      // Auto-hide countdown
      this.hideTimer -= dt;
      if (this.hideTimer <= 0) {
        this.hide();
      }
    }
  }

  hide(): void {
    this.isShowing = false;
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.container.setVisible(false);
        this.container.setAlpha(1);
      },
    });
  }

  getIsShowing(): boolean {
    return this.isShowing;
  }

  destroy(): void {
    this.messageText.destroy();
    this.radioIcon.destroy();
    this.border.destroy();
    this.background.destroy();
    this.container.destroy();
  }
}
