import Phaser from 'phaser';

/**
 * OVER-THE-TOP particle effects for every action in the game.
 * Confetti, explosions, speed lines, money showers, neon trails.
 */
export class ParticleEffects {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Burst of colored squares when catching an NPC */
  catchExplosion(x: number, y: number): void {
    const colors = [0xff6f00, 0xffd700, 0xff1744, 0x00e676, 0x2979ff];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.3;
      const speed = 30 + Math.random() * 50;
      const size = 1.5 + Math.random() * 2;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = this.scene.add.rectangle(x, y, size, size, color);
      p.setDepth(150);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        rotation: Math.random() * 6,
        duration: 400 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }

    // Shockwave ring
    const ring = this.scene.add.circle(x, y, 2, 0xffffff, 0);
    ring.setStrokeStyle(1.5, 0xffd700, 0.8);
    ring.setDepth(149);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 8, scaleY: 8,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  /** Confetti rain from top of screen for mission complete */
  confettiRain(): void {
    const { width } = this.scene.cameras.main;
    const cam = this.scene.cameras.main;
    const colors = [0xff6f00, 0xffd700, 0xff1744, 0x00e676, 0x2979ff, 0xaa00ff, 0xff4081];

    for (let i = 0; i < 60; i++) {
      const delay = Math.random() * 800;
      const startX = Math.random() * width;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2 + Math.random() * 3;
      const isCircle = Math.random() > 0.5;

      this.scene.time.delayedCall(delay, () => {
        const p = isCircle
          ? this.scene.add.circle(startX, -10, size / 2, color, 0.9)
          : this.scene.add.rectangle(startX, -10, size, size * 1.5, color, 0.9);
        p.setScrollFactor(0).setDepth(999);

        this.scene.tweens.add({
          targets: p,
          y: cam.height + 20,
          x: startX + (Math.random() - 0.5) * 200,
          rotation: Math.random() * 10 - 5,
          alpha: 0.3,
          duration: 1500 + Math.random() * 1000,
          ease: 'Sine.easeIn',
          onComplete: () => p.destroy(),
        });
      });
    }
  }

  /** Money bills flying out of a point */
  moneyShower(x: number, y: number, amount: number): void {
    const count = Math.min(Math.ceil(amount / 20), 15);
    for (let i = 0; i < count; i++) {
      const bill = this.scene.add.rectangle(x, y, 4, 2, 0x4caf50, 0.9);
      bill.setDepth(140);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 20 + Math.random() * 30;
      this.scene.tweens.add({
        targets: bill,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 10,
        alpha: 0,
        rotation: Math.random() * 4 - 2,
        duration: 600 + Math.random() * 300,
        delay: i * 30,
        ease: 'Power1',
        onComplete: () => bill.destroy(),
      });
    }
  }

  /** XP sparkle burst */
  xpBurst(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const dist = 10 + Math.random() * 20;
      // Render at 8x for crisp world-space text
      const star = this.scene.add.text(x, y, '✦', {
        fontSize: '32px', color: '#7c4dff',
      }).setOrigin(0.5).setDepth(141).setScale(0.125);
      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 500,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
  }

  /** Sprint speed lines (screen-space, radial blur effect) */
  sprintLines(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startDist = 80 + Math.random() * 100;
      const endDist = startDist + 60 + Math.random() * 80;
      const sx = cx + Math.cos(angle) * startDist;
      const sy = cy + Math.sin(angle) * startDist;
      const ex = cx + Math.cos(angle) * endDist;
      const ey = cy + Math.sin(angle) * endDist;

      const line = this.scene.add.line(0, 0, sx, sy, ex, ey, 0xffffff, 0.15);
      line.setScrollFactor(0).setDepth(800).setLineWidth(0.5);
      this.scene.tweens.add({
        targets: line,
        alpha: 0,
        duration: 200,
        onComplete: () => line.destroy(),
      });
    }
  }

  /** Level up MEGA explosion */
  levelUpExplosion(): void {
    const { width, height } = this.scene.cameras.main;
    const cx = width / 2;
    const cy = height / 2;

    // Giant flash
    const flash = this.scene.add.rectangle(cx, cy, width, height, 0xffd700, 0.4);
    flash.setScrollFactor(0).setDepth(998);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 600,
      ease: 'Power3', onComplete: () => flash.destroy(),
    });

    // Ring explosion
    for (let r = 0; r < 3; r++) {
      const ring = this.scene.add.circle(cx, cy, 5, 0xffffff, 0);
      ring.setStrokeStyle(2, 0xffd700, 0.6);
      ring.setScrollFactor(0).setDepth(997);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 30 + r * 8, scaleY: 30 + r * 8,
        alpha: 0,
        duration: 700 + r * 200,
        delay: r * 100,
        ease: 'Power2',
        onComplete: () => ring.destroy(),
      });
    }

    // Confetti on top
    this.confettiRain();
  }

  /** Neon trail behind moving player (world-space) */
  neonTrail(x: number, y: number, color: number = 0xff6f00): void {
    const dot = this.scene.add.circle(x, y, 2, color, 0.5);
    dot.setDepth(85);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scaleX: 0.2, scaleY: 0.2,
      duration: 300,
      onComplete: () => dot.destroy(),
    });
  }

  /** Danger flash (red screen pulse for wanted level up) */
  dangerFlash(): void {
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(
      width / 2, height / 2, width, height, 0xff0000, 0.2
    );
    flash.setScrollFactor(0).setDepth(900);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      onComplete: () => flash.destroy(),
    });
  }

  /** Event pickup sparkle */
  pickupSparkle(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const spark = this.scene.add.circle(
        x, y, 1.5, 0x4caf50, 0.8
      );
      spark.setDepth(142);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 15,
        y: y + Math.sin(angle) * 15,
        alpha: 0, scaleX: 0, scaleY: 0,
        duration: 350,
        ease: 'Power2',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Power-up collect: spiral inward then pop */
  powerUpCollect(x: number, y: number, color: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const dist = 25;
      const p = this.scene.add.circle(
        x + Math.cos(angle) * dist,
        y + Math.sin(angle) * dist,
        1.5, color, 0.8
      );
      p.setDepth(145);
      this.scene.tweens.add({
        targets: p,
        x: x, y: y,
        alpha: 0,
        duration: 300,
        delay: i * 15,
        ease: 'Power3',
        onComplete: () => p.destroy(),
      });
    }
    // Pop at center
    this.scene.time.delayedCall(300, () => {
      const pop = this.scene.add.circle(x, y, 3, color, 0.7);
      pop.setDepth(146);
      this.scene.tweens.add({
        targets: pop, scaleX: 5, scaleY: 5, alpha: 0,
        duration: 250, onComplete: () => pop.destroy(),
      });
    });
  }
}
