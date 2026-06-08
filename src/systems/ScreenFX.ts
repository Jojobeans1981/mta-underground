import Phaser from 'phaser';

/**
 * Full-screen visual effects:
 * - Slow motion (time scale manipulation)
 * - Vignette overlay
 * - Screen flash (white, red, gold)
 * - CRT scan lines (retro option)
 * - Screen pulse (bass-beat effect)
 */
export class ScreenFX {
  private scene: Phaser.Scene;
  private vignetteGraphics: Phaser.GameObjects.Graphics | null = null;
  private scanLines: Phaser.GameObjects.Graphics | null = null;
  private slowMoActive: boolean = false;
  private slowMoTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createVignette();
  }

  private createVignette(): void {
    const { width, height } = this.scene.cameras.main;
    this.vignetteGraphics = this.scene.add.graphics();
    this.vignetteGraphics.setScrollFactor(0).setDepth(850);

    // Faint cool color-grade across the whole frame for a modern night look
    this.vignetteGraphics.fillStyle(0x16223f, 0.07);
    this.vignetteGraphics.fillRect(0, 0, width, height);

    // Cinematic corner darkening — smooth falloff, tuned to keep the
    // top-down play area readable while still framing the screen.
    const steps = 12;
    const maxInset = Math.min(width, height) * 0.24;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const alpha = Math.pow(1 - t, 1.7) * 0.4;
      const inset = t * maxInset;
      this.vignetteGraphics.fillStyle(0x05060c, alpha);
      this.vignetteGraphics.fillRect(0, 0, width, inset);
      this.vignetteGraphics.fillRect(0, height - inset, width, inset);
      this.vignetteGraphics.fillRect(0, 0, inset, height);
      this.vignetteGraphics.fillRect(width - inset, 0, inset, height);
    }
  }

  /** Trigger slow-motion for N seconds */
  slowMotion(duration: number = 2): void {
    if (this.slowMoActive) return;
    this.slowMoActive = true;
    this.slowMoTimer = duration;

    // Blue tint overlay for slow-mo
    const { width, height } = this.scene.cameras.main;
    const tintOverlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x0000ff, 0.08);
    tintOverlay.setScrollFactor(0).setDepth(880).setName('slowmo_tint');

    // Slow the game time
    this.scene.time.timeScale = 0.3;
    this.scene.physics.world.timeScale = 3; // Physics inverse

    // Zoom in slightly for dramatic effect
    const currentZoom = this.scene.cameras.main.zoom;
    this.scene.tweens.add({
      targets: this.scene.cameras.main,
      zoom: currentZoom * 1.15,
      duration: 200,
      ease: 'Power2',
    });
  }

  update(delta: number): void {
    if (this.slowMoActive) {
      this.slowMoTimer -= delta / 1000;
      if (this.slowMoTimer <= 0) {
        this.endSlowMotion();
      }
    }
  }

  private endSlowMotion(): void {
    this.slowMoActive = false;
    // Remove blue tint overlay
    const tint = this.scene.children.getByName('slowmo_tint');
    if (tint) tint.destroy();
    this.scene.time.timeScale = 1;
    this.scene.physics.world.timeScale = 1;

    // Restore zoom
    const viewWidth = this.scene.cameras.main.width;
    const targetZoom = viewWidth / 250;
    this.scene.tweens.add({
      targets: this.scene.cameras.main,
      zoom: targetZoom,
      duration: 300,
      ease: 'Power2',
    });
  }

  /** White flash */
  flashWhite(intensity: number = 0.3, duration: number = 300): void {
    this.flash(0xffffff, intensity, duration);
  }

  /** Gold flash for rewards */
  flashGold(intensity: number = 0.2, duration: number = 400): void {
    this.flash(0xffd700, intensity, duration);
  }

  /** Red flash for danger */
  flashRed(intensity: number = 0.2, duration: number = 300): void {
    this.flash(0xff0000, intensity, duration);
  }

  private flash(color: number, intensity: number, duration: number): void {
    const { width, height } = this.scene.cameras.main;
    const rect = this.scene.add.rectangle(width / 2, height / 2, width, height, color, intensity);
    rect.setScrollFactor(0).setDepth(890);
    this.scene.tweens.add({
      targets: rect, alpha: 0, duration,
      ease: 'Power2', onComplete: () => rect.destroy(),
    });
  }

  /** Camera punch — quick directional shake then snap back */
  cameraPunch(dirX: number = 0, dirY: number = -1, intensity: number = 8): void {
    const cam = this.scene.cameras.main;
    const origX = cam.scrollX;
    const origY = cam.scrollY;
    // Don't modify scroll directly — use a quick shake
    cam.shake(150, intensity * 0.001);
  }

  /** Bass pulse — brief scale-up of camera */
  bassPulse(): void {
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    this.scene.tweens.add({
      targets: cam,
      zoom: baseZoom * 1.03,
      duration: 80,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  isSlowMo(): boolean {
    return this.slowMoActive;
  }

  destroy(): void {
    this.vignetteGraphics?.destroy();
    this.scanLines?.destroy();
    if (this.slowMoActive) {
      this.endSlowMotion();
    }
  }
}
