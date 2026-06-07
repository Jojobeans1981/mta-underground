import Phaser from 'phaser';
import { hexToNum } from '@/graphics/colors';

/**
 * Wanted level system — GTA-style heat mechanic.
 *
 * As POLICE: Wanted level = pursuit intensity. Higher = faster evaders, more at once.
 * As RIDER: Evading fares raises your wanted level. Police NPCs chase you.
 * As DRIVER: Traffic violations raise wanted level.
 *
 * Stars: 1-5, decay over time when not in trouble.
 */
export class WantedSystem {
  private stars: number = 0;
  private maxStars: number = 5;
  private heat: number = 0; // 0-100 within current star level
  private decayRate: number = 2; // Heat decay per second when idle
  private starContainer: Phaser.GameObjects.Container | null = null;
  private starTexts: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene | null = null;
  private isActive: boolean = false;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.stars = 0;
    this.heat = 0;

    // Create star display (screen-space, top area)
    const { width } = scene.cameras.main;
    this.starContainer = scene.add.container(width / 2, 16);
    this.starContainer.setScrollFactor(0);
    this.starContainer.setDepth(998);
    this.starContainer.setVisible(false);

    // 5 star positions
    this.starTexts = [];
    for (let i = 0; i < this.maxStars; i++) {
      const star = scene.add.text(-40 + i * 20, 0, '★', {
        fontSize: '14px',
        color: '#333333',
      }).setOrigin(0.5);
      this.starContainer.add(star);
      this.starTexts.push(star);
    }
  }

  /** Add heat from an action (evading fare, catching someone, etc.) */
  addHeat(amount: number): void {
    if (!this.isActive) {
      this.isActive = true;
      this.starContainer?.setVisible(true);
    }

    this.heat += amount;

    while (this.heat >= 100 && this.stars < this.maxStars) {
      this.heat -= 100;
      this.stars++;
      this.onStarGained();
    }

    if (this.stars >= this.maxStars) {
      this.heat = 100;
    }

    this.updateDisplay();
  }

  update(delta: number): void {
    if (!this.isActive || this.stars === 0) return;

    // Heat decays when not actively doing things
    this.heat -= this.decayRate * (delta / 1000);

    if (this.heat <= 0) {
      this.heat = 0;
      if (this.stars > 0) {
        this.stars--;
        this.heat = 80; // Drop to 80% of previous level
        if (this.stars === 0) {
          this.heat = 0;
          this.isActive = false;
          this.starContainer?.setVisible(false);
        }
      }
    }

    this.updateDisplay();
  }

  private updateDisplay(): void {
    for (let i = 0; i < this.maxStars; i++) {
      if (i < this.stars) {
        this.starTexts[i].setColor('#ffd700'); // Gold = active
        this.starTexts[i].setAlpha(1);
      } else if (i === this.stars && this.heat > 0) {
        // Partially filled star
        this.starTexts[i].setColor('#ffd700');
        this.starTexts[i].setAlpha(0.3 + (this.heat / 100) * 0.7);
      } else {
        this.starTexts[i].setColor('#333333');
        this.starTexts[i].setAlpha(0.5);
      }
    }

    // Flash effect at high wanted levels
    if (this.stars >= 4 && this.scene) {
      for (let i = 0; i < this.stars; i++) {
        if (!this.starTexts[i].getData('flashing')) {
          this.starTexts[i].setData('flashing', true);
          this.scene.tweens.add({
            targets: this.starTexts[i],
            alpha: { from: 0.5, to: 1 },
            duration: 300,
            yoyo: true,
            repeat: -1,
          });
        }
      }
    }
  }

  private onStarGained(): void {
    // Screen flash effect
    if (this.scene) {
      const { width, height } = this.scene.cameras.main;
      const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xff0000, 0.15);
      flash.setScrollFactor(0).setDepth(900);
      this.scene.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 500,
        onComplete: () => flash.destroy(),
      });
    }
  }

  getStars(): number {
    return this.stars;
  }

  getHeat(): number {
    return this.heat;
  }

  /** Get difficulty multiplier based on wanted level */
  getDifficultyMultiplier(): number {
    return 1 + this.stars * 0.15; // 15% harder per star
  }

  /** Get speed multiplier for fleeing NPCs */
  getFleeSpeedMultiplier(): number {
    return 1 + this.stars * 0.1; // 10% faster per star
  }

  reset(): void {
    this.stars = 0;
    this.heat = 0;
    this.isActive = false;
    this.starContainer?.setVisible(false);
    this.updateDisplay();
  }
}
