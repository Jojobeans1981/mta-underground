import Phaser from 'phaser';
import { Entity } from '@/entities/Entity';
import { NPCType, BehaviorPattern, NPCDefinition } from '@/types/game.types';
import { WORLD_WIDTH, WORLD_HEIGHT, NPC_SIZE } from '@/config/constants';
import { NPC_SPRITE_RES } from '@/graphics/SpriteFactory';

export class NPC extends Entity {
  npcType: NPCType;
  behaviorPattern: BehaviorPattern;
  originalBehavior: BehaviorPattern;
  speed: number;
  interactable: boolean;
  dialogueLines: string[];

  private currentTarget: { x: number; y: number } | null = null;
  private behaviorTimer: number = 0;
  private pauseTimer: number = 0;
  private isPaused: boolean = false;
  private fleeFromX: number = 0;
  private fleeFromY: number = 0;
  private dirChangeTimer: number = 0;
  private fleeAngleOffset: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, definition: NPCDefinition, textureKey: string) {
    super(scene, x, y, textureKey, definition.id + '_' + Math.floor(Math.random() * 100000));

    // Scale down from high-res texture to world size
    if (this.entitySprite) {
      this.entitySprite.setScale(NPC_SIZE / NPC_SPRITE_RES);
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setSize(NPC_SIZE, NPC_SIZE);
    }

    this.npcType = definition.type;
    this.behaviorPattern = definition.behaviorPattern;
    this.originalBehavior = definition.behaviorPattern;
    this.speed = definition.speed;
    this.interactable = definition.interactable;
    this.dialogueLines = [...definition.dialogueLines];

    // Start with a random pause so NPCs don't all move in sync
    this.pauseTimer = Math.random() * 2;
    this.isPaused = true;
  }

  update(delta: number): void {
    if (!this.isActive) return;

    const dt = delta / 1000;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Handle pause between movements
    if (this.isPaused) {
      body.setVelocity(0, 0);
      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.isPaused = false;
        this.pickNewTarget();
      }
      return;
    }

    switch (this.behaviorPattern) {
      case 'wander':
        this.updateWander(dt, body);
        break;
      case 'follow_path':
        this.updateFollowPath(dt, body);
        break;
      case 'stationary':
        this.updateStationary(dt, body);
        break;
      case 'crowd':
        this.updateCrowd(dt, body);
        break;
      case 'flee':
        this.updateFlee(dt, body);
        break;
      case 'patrol':
        this.updateWander(dt, body); // Default to wander for now
        break;
    }
  }

  private updateWander(dt: number, body: Phaser.Physics.Arcade.Body): void {
    if (!this.currentTarget) {
      this.pickNewTarget();
      return;
    }

    if (this.moveToTarget(dt, body)) {
      // Reached target, pause
      this.isPaused = true;
      this.pauseTimer = 1 + Math.random() * 2;
      this.currentTarget = null;
    }
  }

  private updateFollowPath(dt: number, body: Phaser.Physics.Arcade.Body): void {
    if (!this.currentTarget) {
      // Pick a target far away in a random cardinal direction
      const dir = Math.floor(Math.random() * 4);
      const dist = 150 + Math.random() * 100;
      switch (dir) {
        case 0: this.currentTarget = { x: this.x + dist, y: this.y }; break;
        case 1: this.currentTarget = { x: this.x - dist, y: this.y }; break;
        case 2: this.currentTarget = { x: this.x, y: this.y + dist }; break;
        case 3: this.currentTarget = { x: this.x, y: this.y - dist }; break;
      }
      this.clampTarget();
      return;
    }

    if (this.moveToTarget(dt, body)) {
      this.isPaused = true;
      this.pauseTimer = 0.5 + Math.random() * 1;
      this.currentTarget = null;
    }
  }

  private updateStationary(_dt: number, body: Phaser.Physics.Arcade.Body): void {
    body.setVelocity(0, 0);
    // Occasionally face a random direction
    this.behaviorTimer -= _dt;
    if (this.behaviorTimer <= 0) {
      this.behaviorTimer = 3 + Math.random() * 4;
      if (this.entitySprite) {
        this.entitySprite.setFlipX(Math.random() > 0.5);
      }
    }
  }

  private updateCrowd(dt: number, body: Phaser.Physics.Arcade.Body): void {
    if (!this.currentTarget) {
      // Small radius movement
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 20;
      this.currentTarget = {
        x: this.x + Math.cos(angle) * dist,
        y: this.y + Math.sin(angle) * dist,
      };
      this.clampTarget();
      return;
    }

    if (this.moveToTarget(dt, body)) {
      this.isPaused = true;
      this.pauseTimer = 0.5 + Math.random() * 1;
      this.currentTarget = null;
    }
  }

  private updateFlee(dt: number, body: Phaser.Physics.Arcade.Body): void {
    // Run away from the flee source
    const dx = this.x - this.fleeFromX;
    const dy = this.y - this.fleeFromY;
    const dist = Math.hypot(dx, dy);

    if (dist < 1) {
      body.setVelocity(this.speed, 0);
      return;
    }

    // Change direction offset periodically for unpredictability
    this.dirChangeTimer -= dt;
    if (this.dirChangeTimer <= 0) {
      this.dirChangeTimer = 0.4 + Math.random() * 0.3;
      this.fleeAngleOffset = (Math.random() - 0.5) * 1.0; // Up to ~30 degrees
    }

    const baseAngle = Math.atan2(dy, dx);
    const angle = baseAngle + this.fleeAngleOffset;

    let vx = Math.cos(angle) * this.speed;
    let vy = Math.sin(angle) * this.speed;

    // Slow down when changing direction sharply (corner slowdown)
    const angleDiff = Math.abs(this.fleeAngleOffset);
    if (angleDiff > 0.3) {
      vx *= 0.9;
      vy *= 0.9;
    }

    body.setVelocity(vx, vy);

    // Flip sprite
    if (this.entitySprite) {
      this.entitySprite.setFlipX(vx < 0);
    }
  }

  private moveToTarget(dt: number, body: Phaser.Physics.Arcade.Body): boolean {
    if (!this.currentTarget) return true;

    const dx = this.currentTarget.x - this.x;
    const dy = this.currentTarget.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 5) {
      body.setVelocity(0, 0);
      return true;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    body.setVelocity(nx * this.speed, ny * this.speed);

    // Flip sprite
    if (this.entitySprite) {
      this.entitySprite.setFlipX(nx < -0.1);
    }

    return false;
  }

  private pickNewTarget(): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 60;
    this.currentTarget = {
      x: this.x + Math.cos(angle) * dist,
      y: this.y + Math.sin(angle) * dist,
    };
    this.clampTarget();
  }

  private clampTarget(): void {
    if (!this.currentTarget) return;
    this.currentTarget.x = Phaser.Math.Clamp(this.currentTarget.x, 60, WORLD_WIDTH - 60);
    this.currentTarget.y = Phaser.Math.Clamp(this.currentTarget.y, 60, WORLD_HEIGHT - 60);
  }

  getDialogue(): string {
    if (this.dialogueLines.length === 0) return '...';
    return this.dialogueLines[Math.floor(Math.random() * this.dialogueLines.length)];
  }

  setFleeing(fleeFromX: number, fleeFromY: number): void {
    this.behaviorPattern = 'flee';
    this.fleeFromX = fleeFromX;
    this.fleeFromY = fleeFromY;
    this.isPaused = false;
    this.dirChangeTimer = 0;
  }

  updateFleeTarget(fleeFromX: number, fleeFromY: number): void {
    this.fleeFromX = fleeFromX;
    this.fleeFromY = fleeFromY;
  }

  stopFleeing(): void {
    this.behaviorPattern = this.originalBehavior;
    this.currentTarget = null;
    this.isPaused = true;
    this.pauseTimer = 0.5;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setVelocity(0, 0);
    }
  }

  initFromDefinition(definition: NPCDefinition, textureKey: string): void {
    this.npcType = definition.type;
    this.behaviorPattern = definition.behaviorPattern;
    this.originalBehavior = definition.behaviorPattern;
    this.speed = definition.speed;
    this.interactable = definition.interactable;
    this.dialogueLines = [...definition.dialogueLines];
    this.currentTarget = null;
    this.isPaused = true;
    this.pauseTimer = Math.random() * 2;

    if (this.entitySprite) {
      this.entitySprite.setTexture(textureKey);
      this.entitySprite.setScale(NPC_SIZE / NPC_SPRITE_RES);
    }
  }
}
