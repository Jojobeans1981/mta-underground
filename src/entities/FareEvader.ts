import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { FARE_EVADER_DEFINITION } from '@/data/npcs';

export class FareEvader extends NPC {
  hasBeenSpotted: boolean = false;
  private detectionRange: number = 150; // Increased from 100
  private alertIndicator: Phaser.GameObjects.Text | null = null;

  // Persistent overhead marker so player can always find the evader
  private overheadMarker: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, FARE_EVADER_DEFINITION, 'npc_fare_evader');

    // Start stationary (loitering, waiting to be spotted)
    this.behaviorPattern = 'stationary';
    this.originalBehavior = 'stationary';

    // Create persistent overhead marker — red pulsing diamond + "SUSPECT" label
    this.overheadMarker = scene.add.container(x, y - 18);
    this.overheadMarker.setDepth(160);

    // Red pulsing ring
    const ring = scene.add.circle(0, 0, 6, 0xff4444, 0);
    ring.setStrokeStyle(0.8, 0xff4444, 0.5);
    scene.tweens.add({
      targets: ring,
      scaleX: { from: 0.6, to: 1.5 }, scaleY: { from: 0.6, to: 1.5 },
      alpha: { from: 0.5, to: 0 },
      duration: 1000, repeat: -1,
    });
    this.overheadMarker.add(ring);

    // Red diamond indicator
    const diamond = scene.add.graphics();
    diamond.fillStyle(0xff4444, 0.9);
    diamond.fillTriangle(0, -4, 3, 0, -3, 0);
    diamond.fillTriangle(0, 4, 3, 0, -3, 0);
    this.overheadMarker.add(diamond);

    // Bobbing animation
    scene.tweens.add({
      targets: this.overheadMarker,
      y: y - 22,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // "SUSPECT" label (rendered at 8x for crisp text)
    const label = scene.add.text(0, -8, 'SUSPECT', {
      fontSize: '32px', color: '#ff4444', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 6,
    }).setOrigin(0.5, 1).setScale(0.125);
    this.overheadMarker.add(label);
  }

  spot(playerX: number, playerY: number): void {
    if (this.hasBeenSpotted) return;

    this.hasBeenSpotted = true;

    // Big "!" alert
    this.alertIndicator = this.scene.add.text(this.x, this.y - 15, '!', {
      fontSize: '48px',
      color: '#ff0000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(170).setScale(0.125);

    // Remove alert after 0.5s
    this.scene.time.delayedCall(500, () => {
      this.alertIndicator?.destroy();
      this.alertIndicator = null;
    });

    // Change marker label to "FLEEING!"
    if (this.overheadMarker) {
      // Replace label
      const oldLabel = this.overheadMarker.getAt(2) as Phaser.GameObjects.Text;
      if (oldLabel) oldLabel.setText('FLEEING!');
    }

    // Start fleeing
    this.setFleeing(playerX, playerY);
  }

  update(delta: number): void {
    super.update(delta);

    // Keep overhead marker tracking
    if (this.overheadMarker) {
      this.overheadMarker.setPosition(this.x, this.y - 18);
    }

    // Update alert indicator position
    if (this.alertIndicator) {
      this.alertIndicator.setPosition(this.x, this.y - 15);
    }
  }

  setDetectionRange(range: number): void {
    this.detectionRange = range;
  }

  getDetectionRange(): number {
    return this.detectionRange;
  }

  deactivate(): void {
    super.deactivate();
    this.overheadMarker?.destroy();
    this.overheadMarker = null;
    this.alertIndicator?.destroy();
    this.alertIndicator = null;
  }

  destroy(fromScene?: boolean): void {
    this.overheadMarker?.destroy();
    this.overheadMarker = null;
    this.alertIndicator?.destroy();
    this.alertIndicator = null;
    super.destroy(fromScene);
  }
}
