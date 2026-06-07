import Phaser from 'phaser';

/**
 * Small pulsing dot under the player in SCREEN space (not affected by camera zoom).
 */
export class PlayerIndicator {
  private ring: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    // Screen-space indicator — follows player position converted to screen coords
    this.ring = scene.add.circle(0, 0, 8, 0xffffff, 0.12);
    this.ring.setScrollFactor(0);
    this.ring.setDepth(99);

    scene.tweens.add({
      targets: this.ring,
      alpha: { from: 0.08, to: 0.2 },
      scaleX: { from: 0.9, to: 1.15 },
      scaleY: { from: 0.9, to: 1.15 },
      duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  update(worldX: number, worldY: number): void {
    // Convert world position to screen position
    const cam = this.scene.cameras.main;
    const screenX = (worldX - cam.scrollX) * cam.zoom;
    const screenY = (worldY - cam.scrollY) * cam.zoom;
    this.ring.setPosition(screenX, screenY);
  }

  destroy(): void {
    this.ring.destroy();
  }
}
