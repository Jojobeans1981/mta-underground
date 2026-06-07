import Phaser from 'phaser';
import { hexToNum, COLOR_UI_XP, COLOR_UI_PRIMARY, COLOR_UI_MONEY } from '@/graphics/colors';

interface ToastItem {
  type: string;
  message: string;
}

const TOAST_COLORS: Record<string, string> = {
  level_up: COLOR_UI_XP,
  mission_unlock: COLOR_UI_PRIMARY,
  item_unlock: '#1565c0',
  purchase: COLOR_UI_MONEY,
  achievement: '#4caf50',
};

export class NotificationToast {
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private messageText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private queue: ToastItem[] = [];
  private isShowing: boolean = false;
  private hideTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const width = scene.cameras.main.width;

    this.container = scene.add.container(width / 2, -100);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);

    // Background
    this.background = scene.add.rectangle(0, 0, 550, 70, hexToNum(COLOR_UI_XP), 0.9);
    this.background.setStrokeStyle(2, 0xffffff);
    this.container.add(this.background);

    // Message text
    this.messageText = scene.add.text(0, 0, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(this.messageText);

    this.container.setVisible(false);
  }

  show(type: string, message: string): void {
    this.queue.push({ type, message });

    if (!this.isShowing) {
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.queue.length === 0) {
      this.isShowing = false;
      return;
    }

    const item = this.queue.shift()!;
    this.isShowing = true;

    // Set color based on type
    const color = TOAST_COLORS[item.type] ?? COLOR_UI_PRIMARY;
    this.background.setFillStyle(hexToNum(color), 0.9);

    this.messageText.setText(item.message);
    this.container.setVisible(true);
    this.container.setY(-100);

    // Slide in
    this.scene.tweens.add({
      targets: this.container,
      y: 50,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.hideTimer = 3.0;
  }

  update(delta: number): void {
    if (!this.isShowing) return;

    this.hideTimer -= delta / 1000;
    if (this.hideTimer <= 0) {
      // Slide out
      this.scene.tweens.add({
        targets: this.container,
        y: -100,
        duration: 300,
        ease: 'Power2',
        onComplete: () => {
          this.container.setVisible(false);
          this.isShowing = false;
          // Show next in queue
          if (this.queue.length > 0) {
            this.scene.time.delayedCall(200, () => this.showNext());
          }
        },
      });
    }
  }

  destroy(): void {
    this.messageText.destroy();
    this.background.destroy();
    this.container.destroy();
  }
}
