import Phaser from 'phaser';

/**
 * Combo/streak multiplier system.
 * Consecutive successful actions (catches, objective completions) build a combo.
 * Higher combo = bigger reward multipliers.
 * Combo breaks on mission failure or time expiry.
 */
export class ComboSystem {
  private combo: number = 0;
  private maxCombo: number = 0;
  private comboTimer: number = 0;
  private comboTimeout: number = 15; // Seconds before combo expires
  private scene: Phaser.Scene | null = null;
  private comboText: Phaser.GameObjects.Text | null = null;
  private comboContainer: Phaser.GameObjects.Container | null = null;

  init(scene: Phaser.Scene): void {
    this.scene = scene;

    // Screen-space combo display
    const { width } = scene.cameras.main;
    this.comboContainer = scene.add.container(width / 2, 60);
    this.comboContainer.setScrollFactor(0);
    this.comboContainer.setDepth(997);
    this.comboContainer.setVisible(false);

    this.comboText = scene.add.text(0, 0, '', {
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.comboContainer.add(this.comboText);
  }

  /** Register a successful action */
  hit(): void {
    this.combo++;
    this.comboTimer = this.comboTimeout;

    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.showCombo();
  }

  /** Combo broken */
  break(): void {
    if (this.combo > 0) {
      this.combo = 0;
      this.comboContainer?.setVisible(false);
    }
  }

  update(delta: number): void {
    if (this.combo <= 0) return;

    this.comboTimer -= delta / 1000;
    if (this.comboTimer <= 0) {
      this.break();
    }

    // Flash when about to expire
    if (this.comboTimer < 3 && this.comboText) {
      this.comboText.setAlpha(0.5 + Math.sin(Date.now() * 0.01) * 0.5);
    }
  }

  private showCombo(): void {
    if (!this.comboText || !this.comboContainer || !this.scene) return;

    this.comboContainer.setVisible(true);

    const mult = this.getMultiplier();
    this.comboText.setText(`${this.combo}x COMBO  ×${mult.toFixed(1)}`);
    this.comboText.setAlpha(1);

    // Pop animation
    this.scene.tweens.add({
      targets: this.comboText,
      scaleX: { from: 1.3, to: 1 },
      scaleY: { from: 1.3, to: 1 },
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Color based on combo level
    if (this.combo >= 10) {
      this.comboText.setColor('#ff1744'); // Red hot
    } else if (this.combo >= 5) {
      this.comboText.setColor('#ff9100'); // Orange
    } else if (this.combo >= 3) {
      this.comboText.setColor('#ffd700'); // Gold
    } else {
      this.comboText.setColor('#ffffff'); // White
    }
  }

  /** Get the current reward multiplier */
  getMultiplier(): number {
    if (this.combo <= 1) return 1.0;
    if (this.combo <= 3) return 1.2;
    if (this.combo <= 5) return 1.5;
    if (this.combo <= 10) return 2.0;
    return 2.5; // Max multiplier
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }
}
