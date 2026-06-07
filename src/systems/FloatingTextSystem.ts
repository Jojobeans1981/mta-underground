import Phaser from 'phaser';

/**
 * Floating text that pops up from world positions and drifts upward.
 * Used for: +$100, +50 XP, COMBO!, damage numbers, etc.
 *
 * World-space text is rendered at 8× the desired size and scaled down
 * so it stays crisp under camera zoom.
 */

const TEXT_RENDER_SCALE = 8;

export class FloatingTextSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Show floating text at a world position */
  spawn(
    worldX: number,
    worldY: number,
    text: string,
    color: string = '#ffffff',
    size: string = '5px',
    duration: number = 800
  ): void {
    // Parse the size and multiply for high-res rendering
    const pxVal = parseInt(size, 10) || 5;
    const renderSize = pxVal * TEXT_RENDER_SCALE;
    const displayScale = 1 / TEXT_RENDER_SCALE;

    const ft = this.scene.add.text(worldX, worldY, text, {
      fontSize: `${renderSize}px`,
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: TEXT_RENDER_SCALE,
    }).setOrigin(0.5).setDepth(200).setScale(displayScale);

    this.scene.tweens.add({
      targets: ft,
      y: worldY - 20,
      alpha: { from: 1, to: 0 },
      scaleX: { from: displayScale * 1.2, to: displayScale * 0.8 },
      scaleY: { from: displayScale * 1.2, to: displayScale * 0.8 },
      duration,
      ease: 'Power2',
      onComplete: () => ft.destroy(),
    });
  }

  /** Money earned — green with dollar sign */
  money(worldX: number, worldY: number, amount: number): void {
    this.spawn(worldX, worldY - 8, `+$${amount}`, '#4caf50', '5px');
  }

  /** XP earned — purple with sparkle */
  xp(worldX: number, worldY: number, amount: number): void {
    this.spawn(worldX + 5, worldY - 5, `+${amount} XP`, '#7c4dff', '4px');
  }

  /** Combo multiplier popup */
  combo(worldX: number, worldY: number, multiplier: number): void {
    const color = multiplier >= 2.0 ? '#ff1744' : multiplier >= 1.5 ? '#ff9100' : '#ffd700';
    this.spawn(worldX, worldY - 12, `×${multiplier.toFixed(1)} COMBO`, color, '5px', 1000);
  }

  /** Big screen-space announcement text (SCREEN SPACE — no scale hack needed) */
  screenAnnounce(text: string, color: string = '#ffd700', size: string = '36px'): void {
    const { width, height } = this.scene.cameras.main;
    const announce = this.scene.add.text(width / 2, height * 0.35, text, {
      fontSize: size,
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(950);

    // Slam in from scale 3 → 1, then fade out
    announce.setScale(3).setAlpha(0);
    this.scene.tweens.add({
      targets: announce,
      scaleX: 1, scaleY: 1, alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({
          targets: announce,
          alpha: 0, y: height * 0.3,
          duration: 800,
          delay: 600,
          ease: 'Power2',
          onComplete: () => announce.destroy(),
        });
      },
    });
  }
}
