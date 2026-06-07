import Phaser from 'phaser';
import { DAY_NIGHT_CYCLE_DURATION } from '@/config/constants';

export class DayNightSystem {
  private timeOfDay: number = 0.35; // Start at mid-morning
  private cycleDuration: number = DAY_NIGHT_CYCLE_DURATION;
  private overlay: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    // Create a large overlay that covers the world
    this.overlay = scene.add.rectangle(
      500, 500, // Center of the world
      2000, 2000, // Large enough to cover everything
      0x112244,
      0
    );
    this.overlay.setDepth(900);
  }

  update(delta: number): void {
    const dt = delta / 1000;
    this.timeOfDay = (this.timeOfDay + dt / this.cycleDuration) % 1.0;

    // Calculate overlay alpha based on time of day
    let alpha: number;

    if (this.timeOfDay < 0.20) {
      // Night (midnight to pre-dawn)
      alpha = 0.4;
    } else if (this.timeOfDay < 0.30) {
      // Sunrise: 0.4 → 0.0
      const t = (this.timeOfDay - 0.20) / 0.10;
      alpha = 0.4 * (1 - t);
    } else if (this.timeOfDay < 0.70) {
      // Day
      alpha = 0;
    } else if (this.timeOfDay < 0.80) {
      // Sunset: 0.0 → 0.4
      const t = (this.timeOfDay - 0.70) / 0.10;
      alpha = 0.4 * t;
    } else {
      // Night
      alpha = 0.4;
    }

    this.overlay.setAlpha(alpha);
  }

  getTimeOfDay(): number {
    return this.timeOfDay;
  }

  isNight(): boolean {
    return this.timeOfDay < 0.25 || this.timeOfDay > 0.75;
  }

  setTime(time: number): void {
    this.timeOfDay = time % 1.0;
  }
}
