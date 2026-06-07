import Phaser from 'phaser';

/**
 * GTA-style streak announcements.
 * Shows escalating text across the screen for consecutive catches/actions.
 */

interface StreakLevel {
  threshold: number;
  text: string;
  color: string;
  size: string;
  shake: number;
}

const STREAK_LEVELS: StreakLevel[] = [
  { threshold: 2, text: 'DOUBLE!', color: '#ffd700', size: '28px', shake: 0.003 },
  { threshold: 3, text: 'TRIPLE THREAT!', color: '#ff9100', size: '32px', shake: 0.005 },
  { threshold: 5, text: 'ON FIRE!', color: '#ff6d00', size: '36px', shake: 0.008 },
  { threshold: 7, text: 'UNSTOPPABLE!', color: '#ff1744', size: '40px', shake: 0.01 },
  { threshold: 10, text: 'LEGENDARY!!', color: '#d500f9', size: '44px', shake: 0.015 },
  { threshold: 15, text: 'G O D   M O D E', color: '#00e5ff', size: '48px', shake: 0.02 },
];

export class StreakAnnouncer {
  private scene: Phaser.Scene;
  private currentStreak: number = 0;
  private lastAnnounced: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Register a hit and potentially announce */
  hit(): void {
    this.currentStreak++;

    // Find the highest threshold we've crossed that hasn't been announced
    for (let i = STREAK_LEVELS.length - 1; i >= 0; i--) {
      const level = STREAK_LEVELS[i];
      if (this.currentStreak >= level.threshold && this.lastAnnounced < level.threshold) {
        this.announce(level);
        this.lastAnnounced = level.threshold;
        break;
      }
    }
  }

  reset(): void {
    if (this.currentStreak >= 3) {
      this.announceBreak();
    }
    this.currentStreak = 0;
    this.lastAnnounced = 0;
  }

  private announce(level: StreakLevel): void {
    const { width, height } = this.scene.cameras.main;

    // Screen shake
    this.scene.cameras.main.shake(200, level.shake);

    // Background flash
    const flashColor = Phaser.Display.Color.HexStringToColor(level.color).color;
    const flash = this.scene.add.rectangle(
      width / 2, height / 2, width, height, flashColor, 0.15
    );
    flash.setScrollFactor(0).setDepth(940);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 500,
      onComplete: () => flash.destroy(),
    });

    // Main text — slams in with elastic bounce
    const mainText = this.scene.add.text(width / 2, height * 0.3, level.text, {
      fontSize: level.size,
      color: level.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(960);

    mainText.setScale(0.1).setAlpha(0);
    this.scene.tweens.add({
      targets: mainText,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold then fade
        this.scene.tweens.add({
          targets: mainText,
          scaleX: 1.1, scaleY: 1.1,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.scene.tweens.add({
              targets: mainText,
              alpha: 0, y: height * 0.25, scaleX: 0.7, scaleY: 0.7,
              duration: 500, delay: 400,
              onComplete: () => mainText.destroy(),
            });
          },
        });
      },
    });

    // Streak count subtitle
    const sub = this.scene.add.text(
      width / 2, height * 0.3 + 40,
      `${this.currentStreak} STREAK`,
      { fontSize: '16px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(959);
    sub.setAlpha(0);
    this.scene.tweens.add({
      targets: sub, alpha: 1, duration: 200, delay: 200,
      onComplete: () => {
        this.scene.tweens.add({
          targets: sub, alpha: 0, duration: 500, delay: 600,
          onComplete: () => sub.destroy(),
        });
      },
    });

    // Side decorative lines
    for (let side = -1; side <= 1; side += 2) {
      const line = this.scene.add.rectangle(
        width / 2 + side * (width * 0.45), height * 0.3,
        4, 60, flashColor, 0.8
      );
      line.setScrollFactor(0).setDepth(955);
      this.scene.tweens.add({
        targets: line,
        x: width / 2 + side * 120,
        alpha: 0, scaleY: 0.3,
        duration: 600, delay: 100,
        ease: 'Power3',
        onComplete: () => line.destroy(),
      });
    }
  }

  private announceBreak(): void {
    const { width, height } = this.scene.cameras.main;
    const breakText = this.scene.add.text(
      width / 2, height * 0.4,
      'STREAK BROKEN',
      { fontSize: '20px', color: '#ff4444', fontStyle: 'bold', stroke: '#000000', strokeThickness: 3 }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(945);
    breakText.setAlpha(0);
    this.scene.tweens.add({
      targets: breakText, alpha: 0.8, duration: 200,
      onComplete: () => {
        this.scene.tweens.add({
          targets: breakText, alpha: 0, duration: 600, delay: 400,
          onComplete: () => breakText.destroy(),
        });
      },
    });
    this.scene.cameras.main.shake(100, 0.005);
  }

  getStreak(): number {
    return this.currentStreak;
  }
}
