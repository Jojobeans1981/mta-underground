import Phaser from 'phaser';

export interface PatrolCheckpoint {
  id: string;
  position: { x: number; y: number };
  stationId?: string;
  reached: boolean;
}

export class PatrolSystem {
  private checkpoints: PatrolCheckpoint[] = [];
  private currentCheckpointIndex: number = 0;
  private isActive: boolean = false;
  private checkpointRadius: number = 30;
  private scene: Phaser.Scene;
  private marker: Phaser.GameObjects.Container | null = null;
  private markerCircle: Phaser.GameObjects.Arc | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  startPatrol(checkpoints: PatrolCheckpoint[]): void {
    this.checkpoints = checkpoints.map((cp) => ({ ...cp, reached: false }));
    this.currentCheckpointIndex = 0;
    this.isActive = true;
    this.renderMarker();
  }

  update(playerX: number, playerY: number): PatrolCheckpoint | null {
    if (!this.isActive) return null;

    const current = this.checkpoints[this.currentCheckpointIndex];
    if (!current || current.reached) return null;

    const dist = Math.hypot(playerX - current.position.x, playerY - current.position.y);

    if (dist < this.checkpointRadius) {
      current.reached = true;
      this.currentCheckpointIndex++;

      if (this.currentCheckpointIndex < this.checkpoints.length) {
        this.renderMarker();
      } else {
        // All checkpoints reached
        this.destroyMarker();
      }

      return current;
    }

    // Update marker position if it exists
    if (this.marker && this.markerCircle) {
      this.marker.setPosition(current.position.x, current.position.y);
    }

    return null;
  }

  private renderMarker(): void {
    this.destroyMarker();

    const current = this.checkpoints[this.currentCheckpointIndex];
    if (!current) return;

    this.marker = this.scene.add.container(current.position.x, current.position.y);
    this.marker.setDepth(80);

    // Pulsing circle
    this.markerCircle = this.scene.add.circle(0, 0, 12, 0xff6f00, 0.4);
    this.marker.add(this.markerCircle);

    // Inner dot
    const dot = this.scene.add.circle(0, 0, 4, 0xff6f00, 0.8);
    this.marker.add(dot);

    // Pulse animation
    this.scene.tweens.add({
      targets: this.markerCircle,
      scaleX: { from: 0.8, to: 1.3 },
      scaleY: { from: 0.8, to: 1.3 },
      alpha: { from: 0.6, to: 0.2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private destroyMarker(): void {
    this.marker?.destroy();
    this.marker = null;
    this.markerCircle = null;
  }

  getActiveCheckpointPosition(): { x: number; y: number } | null {
    if (!this.isActive) return null;
    const current = this.checkpoints[this.currentCheckpointIndex];
    return current ? current.position : null;
  }

  getAllReached(): boolean {
    return this.checkpoints.every((cp) => cp.reached);
  }

  getProgress(): { completed: number; total: number } {
    const completed = this.checkpoints.filter((cp) => cp.reached).length;
    return { completed, total: this.checkpoints.length };
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  stop(): void {
    this.isActive = false;
    this.destroyMarker();
    this.checkpoints = [];
  }
}
