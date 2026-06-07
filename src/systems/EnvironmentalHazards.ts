import Phaser from 'phaser';

/**
 * Environmental hazards scattered around the world.
 * - Steam vents: periodic steam bursts that push player sideways
 * - Puddles: slow player movement
 * - Construction zones: barriers you can't pass through
 * - Manhole covers: visual detail + occasional steam
 */

interface Hazard {
  type: 'steam_vent' | 'puddle' | 'manhole';
  x: number;
  y: number;
  container: Phaser.GameObjects.Container;
  active: boolean;
  timer: number;
}

export class EnvironmentalHazards {
  private scene: Phaser.Scene | null = null;
  private hazards: Hazard[] = [];

  init(scene: Phaser.Scene): void {
    this.scene = scene;

    // Place hazards deterministically based on world grid
    const verticalXs = [150, 300, 500, 700, 850];
    const horizontalYs = [150, 250, 350, 450, 550, 650, 750];

    // Steam vents at some intersections
    for (let i = 0; i < verticalXs.length; i++) {
      for (let j = 0; j < horizontalYs.length; j++) {
        const hash = (i * 7 + j * 13) % 10;

        if (hash === 0 || hash === 3) {
          this.createSteamVent(
            verticalXs[i] + (hash === 3 ? 12 : -12),
            horizontalYs[j] + (hash === 3 ? -8 : 8)
          );
        }

        if (hash === 1 || hash === 5) {
          this.createPuddle(
            verticalXs[i] + (hash === 1 ? 15 : -15),
            horizontalYs[j] + 15
          );
        }

        if (hash === 7) {
          this.createManhole(verticalXs[i], horizontalYs[j]);
        }
      }
    }
  }

  private createSteamVent(x: number, y: number): void {
    if (!this.scene) return;

    const container = this.scene.add.container(x, y);
    container.setDepth(75);

    // Grate
    const grate = this.scene.add.rectangle(0, 0, 5, 5, 0x444444, 0.7);
    grate.setStrokeStyle(0.3, 0x333333);
    container.add(grate);

    // Grate lines
    for (let i = -1; i <= 1; i++) {
      container.add(this.scene.add.rectangle(0, i * 1.5, 4, 0.3, 0x333333, 0.5));
    }

    this.hazards.push({
      type: 'steam_vent', x, y, container,
      active: false,
      timer: 3 + Math.random() * 5, // Random start delay
    });
  }

  private createPuddle(x: number, y: number): void {
    if (!this.scene) return;

    const container = this.scene.add.container(x, y);
    container.setDepth(72);

    // Puddle shape — irregular ellipse
    const puddle = this.scene.add.ellipse(0, 0, 12 + Math.random() * 6, 5 + Math.random() * 3, 0x1a4a6e, 0.35);
    container.add(puddle);

    // Reflection highlights
    container.add(this.scene.add.ellipse(-2, -1, 3, 1, 0x4488aa, 0.15));
    container.add(this.scene.add.ellipse(2, 0, 2, 0.8, 0x4488aa, 0.1));

    // Subtle ripple animation
    this.scene.tweens.add({
      targets: puddle,
      scaleX: { from: 0.95, to: 1.05 },
      scaleY: { from: 1.05, to: 0.95 },
      duration: 2000, yoyo: true, repeat: -1,
    });

    this.hazards.push({
      type: 'puddle', x, y, container,
      active: true, timer: 0,
    });
  }

  private createManhole(x: number, y: number): void {
    if (!this.scene) return;

    const container = this.scene.add.container(x, y);
    container.setDepth(71);

    // Manhole cover — circle with cross pattern
    const cover = this.scene.add.circle(0, 0, 4, 0x555555, 0.7);
    cover.setStrokeStyle(0.5, 0x444444);
    container.add(cover);

    // Cross pattern
    container.add(this.scene.add.rectangle(0, 0, 5, 0.5, 0x444444, 0.4));
    container.add(this.scene.add.rectangle(0, 0, 0.5, 5, 0x444444, 0.4));

    // Inner circle
    container.add(this.scene.add.circle(0, 0, 2, 0x4a4a4a, 0.4));

    this.hazards.push({
      type: 'manhole', x, y, container,
      active: false,
      timer: 8 + Math.random() * 10,
    });
  }

  /**
   * Update hazards. Returns speed multiplier for player (puddles slow you down).
   */
  update(playerX: number, playerY: number, delta: number): { speedMult: number; pushX: number; pushY: number } {
    if (!this.scene) return { speedMult: 1, pushX: 0, pushY: 0 };
    const dt = delta / 1000;
    let speedMult = 1;
    let pushX = 0;
    let pushY = 0;

    for (const hazard of this.hazards) {
      const dist = Math.hypot(hazard.x - playerX, hazard.y - playerY);

      switch (hazard.type) {
        case 'steam_vent':
        case 'manhole':
          hazard.timer -= dt;
          if (hazard.timer <= 0) {
            hazard.timer = 4 + Math.random() * 6;
            this.emitSteam(hazard.x, hazard.y);

            // Push player if nearby
            if (dist < 15) {
              const angle = Math.atan2(playerY - hazard.y, playerX - hazard.x);
              pushX += Math.cos(angle) * 30;
              pushY += Math.sin(angle) * 30;
            }
          }
          break;

        case 'puddle':
          if (dist < 8) {
            speedMult = Math.min(speedMult, 0.6); // 40% slowdown
          }
          break;
      }
    }

    return { speedMult, pushX, pushY };
  }

  private emitSteam(x: number, y: number): void {
    if (!this.scene) return;

    // Steam particles rising
    for (let i = 0; i < 6; i++) {
      const puff = this.scene.add.circle(
        x + (Math.random() - 0.5) * 4,
        y,
        1 + Math.random() * 2,
        0xcccccc,
        0.3
      );
      puff.setDepth(120);

      this.scene.tweens.add({
        targets: puff,
        y: y - 15 - Math.random() * 10,
        x: x + (Math.random() - 0.5) * 8,
        alpha: 0,
        scaleX: 2 + Math.random(),
        scaleY: 2 + Math.random(),
        duration: 600 + Math.random() * 400,
        delay: i * 50,
        onComplete: () => puff.destroy(),
      });
    }
  }
}
