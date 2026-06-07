import Phaser from 'phaser';
import { isMobile } from '@/config/game-config';

export class TutorialOverlay {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private isShowing: boolean = false;

  private static SEEN_KEY = 'mta_tutorial_seen';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width, height } = scene.cameras.main;
    const mobile = isMobile();

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(2000);
    this.container.setVisible(false);

    if (localStorage.getItem(TutorialOverlay.SEEN_KEY)) return;

    this.isShowing = true;
    this.container.setVisible(true);

    const bg = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    this.container.add(bg);

    const title = scene.add.text(width / 2, height * 0.10, 'HOW TO PLAY', {
      fontSize: '22px', color: '#ff6f00', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(title);

    if (mobile) {
      this.addInstruction(width * 0.3, height * 0.28, 'DRAG', 'Move around', 'Left side of screen');
      this.addInstruction(width * 0.7, height * 0.28, 'TAP', 'Interact', 'Orange button (right)');
      this.addInstruction(width * 0.3, height * 0.46, '2x TAP', 'Sprint', 'Double-tap joystick');
      this.addInstruction(width * 0.7, height * 0.46, 'ARROW', 'Follow it', 'Points to objectives');
    } else {
      this.addInstruction(width * 0.17, height * 0.30, 'WASD', 'Move', 'Arrow keys too');
      this.addInstruction(width * 0.37, height * 0.30, 'E', 'Interact', 'Talk, enter, etc.');
      this.addInstruction(width * 0.57, height * 0.30, 'SHIFT', 'Sprint', 'Hold to run');
      this.addInstruction(width * 0.77, height * 0.30, 'ESC', 'Pause', 'Menu & settings');
    }

    const tips = scene.add.text(width / 2, height * 0.58, [
      'Walk to a STATION entrance to start missions',
      'Complete missions to earn MONEY and XP',
      'Level up to unlock harder missions',
    ].join('\n'), {
      fontSize: '11px', color: '#aaaaaa', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    this.container.add(tips);

    const dismissText = mobile ? 'Tap anywhere to start' : 'Press any key to start';
    const dismiss = scene.add.text(width / 2, height * 0.78, dismissText, {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(dismiss);

    scene.tweens.add({
      targets: dismiss, alpha: { from: 0.5, to: 1 },
      duration: 600, yoyo: true, repeat: -1,
    });

    scene.input.once('pointerdown', () => this.dismiss());
    if (scene.input.keyboard) {
      scene.input.keyboard.once('keydown', () => this.dismiss());
    }
  }

  private addInstruction(x: number, y: number, key: string, title: string, sub: string): void {
    const keyBg = this.scene.add.text(x, y - 12, key, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: '#333355', padding: { x: 10, y: 5 },
    }).setOrigin(0.5);
    this.container.add(keyBg);

    const t = this.scene.add.text(x, y + 14, title, {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(t);

    const s = this.scene.add.text(x, y + 28, sub, {
      fontSize: '9px', color: '#888888',
    }).setOrigin(0.5);
    this.container.add(s);
  }

  private dismiss(): void {
    if (!this.isShowing) return;
    this.isShowing = false;
    localStorage.setItem(TutorialOverlay.SEEN_KEY, '1');
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 500,
      onComplete: () => { this.container.setVisible(false); this.container.destroy(); },
    });
  }

  getIsShowing(): boolean { return this.isShowing; }
  static reset(): void { localStorage.removeItem(TutorialOverlay.SEEN_KEY); }
}
