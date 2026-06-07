import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { GameEvents } from '@/types/events.types';
import { PLAYER_CATCH_RADIUS, WORLD_WIDTH, WORLD_HEIGHT } from '@/config/constants';

export class PursuitSystem {
  private target: NPC | null = null;
  private isActive: boolean = false;
  private catchRadius: number = PLAYER_CATCH_RADIUS;
  private escapeRadius: number = 500; // Distance from player at which target escapes
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  startPursuit(target: NPC): void {
    this.target = target;
    this.isActive = true;
    target.setFleeing(0, 0); // Will be updated each frame with player position
  }

  update(playerX: number, playerY: number, delta: number): void {
    if (!this.isActive || !this.target) return;

    // Update flee target to current player position
    this.target.updateFleeTarget(playerX, playerY);

    // Check catch condition
    const dist = Math.hypot(this.target.x - playerX, this.target.y - playerY);

    if (dist < this.catchRadius) {
      this.caught();
      return;
    }

    // Check escape condition (reached map edge)
    if (
      this.target.x < 20 ||
      this.target.x > WORLD_WIDTH - 20 ||
      this.target.y < 20 ||
      this.target.y > WORLD_HEIGHT - 20
    ) {
      this.escaped();
      return;
    }

    // Check if too far from player
    if (dist > this.escapeRadius) {
      this.escaped();
      return;
    }
  }

  private caught(): void {
    if (!this.target) return;

    // Stop NPC movement
    this.target.stopFleeing();

    // Flash effect
    this.scene.tweens.add({
      targets: this.target,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      repeat: 3,
      yoyo: true,
    });

    this.scene.game.events.emit(GameEvents.NPC_CAUGHT, {
      npcId: this.target.entityId,
    });

    this.isActive = false;
    this.target = null;
  }

  private escaped(): void {
    this.scene.game.events.emit(GameEvents.NPC_ESCAPED, {
      npcId: this.target?.entityId,
    });

    if (this.target) {
      this.target.deactivate();
    }

    this.isActive = false;
    this.target = null;
  }

  setCatchRadius(radius: number): void {
    this.catchRadius = radius;
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  getTarget(): NPC | null {
    return this.target;
  }

  getDistanceToTarget(playerX: number, playerY: number): number {
    if (!this.target) return Infinity;
    return Math.hypot(this.target.x - playerX, this.target.y - playerY);
  }

  stop(): void {
    if (this.target) {
      this.target.stopFleeing();
    }
    this.isActive = false;
    this.target = null;
  }
}
