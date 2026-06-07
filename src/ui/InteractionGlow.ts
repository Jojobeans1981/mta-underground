import Phaser from 'phaser';

/**
 * Screen-space glow rings around interactable objects when player is close.
 */
export class InteractionGlow {
  private glows: Map<string, Phaser.GameObjects.Arc> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  showGlow(key: string, screenX: number, screenY: number, color: number = 0xff6f00, radius: number = 12): void {
    let glow = this.glows.get(key);
    if (!glow) {
      glow = this.scene.add.circle(screenX, screenY, radius, color, 0.15);
      glow.setScrollFactor(0);
      glow.setDepth(98);
      this.glows.set(key, glow);

      this.scene.tweens.add({
        targets: glow,
        alpha: { from: 0.08, to: 0.25 },
        scaleX: { from: 0.8, to: 1.2 },
        scaleY: { from: 0.8, to: 1.2 },
        duration: 600, yoyo: true, repeat: -1,
      });
    }
    glow.setPosition(screenX, screenY);
    glow.setVisible(true);
  }

  hideGlow(key: string): void {
    const glow = this.glows.get(key);
    if (glow) glow.setVisible(false);
  }

  hideAll(): void {
    for (const glow of this.glows.values()) glow.setVisible(false);
  }

  destroy(): void {
    for (const glow of this.glows.values()) glow.destroy();
    this.glows.clear();
  }
}
