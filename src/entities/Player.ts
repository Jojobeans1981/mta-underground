import Phaser from 'phaser';
import { CharacterClass, ItemEffect } from '@/types/game.types';
import {
  PLAYER_SIZE,
  PLAYER_SPEED,
  PLAYER_SPRINT_MULTIPLIER,
  PLAYER_STAMINA_MAX,
  PLAYER_STAMINA_DRAIN,
  PLAYER_STAMINA_REGEN,
} from '@/config/constants';
import { SPRITE_RES } from '@/graphics/SpriteFactory';

export class Player extends Phaser.GameObjects.Container {
  characterClass: CharacterClass;
  speed: number = PLAYER_SPEED;
  stamina: number = PLAYER_STAMINA_MAX;
  maxStamina: number = PLAYER_STAMINA_MAX;
  isInStation: boolean = false;
  currentStationId: string | null = null;
  isInteracting: boolean = false;

  private playerSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number, characterClass: CharacterClass) {
    super(scene, x, y);

    this.characterClass = characterClass;

    // Create the character sprite — scale down from high-res texture to world size
    this.playerSprite = scene.add.sprite(0, 0, 'player_' + characterClass);
    this.playerSprite.setScale(PLAYER_SIZE / SPRITE_RES);
    this.add(this.playerSprite);

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configure physics body
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_SIZE, PLAYER_SIZE);
    body.setCollideWorldBounds(true);
  }

  update(direction: { x: number; y: number }, isSprinting: boolean, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.isInteracting) {
      body.setVelocity(0, 0);
      return;
    }

    const dt = delta / 1000;

    // Calculate effective speed with sprint
    let effectiveSpeed: number;
    if (isSprinting && this.stamina > 0) {
      effectiveSpeed = this.speed * PLAYER_SPRINT_MULTIPLIER;
      this.stamina = Math.max(0, this.stamina - PLAYER_STAMINA_DRAIN * dt);
    } else {
      effectiveSpeed = this.speed;
      this.stamina = Math.min(this.maxStamina, this.stamina + PLAYER_STAMINA_REGEN * dt);
    }

    // Apply movement
    body.setVelocity(
      direction.x * effectiveSpeed,
      direction.y * effectiveSpeed
    );

    // Flip sprite based on horizontal direction
    if (direction.x < -0.1) {
      this.playerSprite.setFlipX(true);
    } else if (direction.x > 0.1) {
      this.playerSprite.setFlipX(false);
    }
  }

  enterStation(stationId: string): void {
    this.isInStation = true;
    this.currentStationId = stationId;
  }

  exitStation(): void {
    this.isInStation = false;
    this.currentStationId = null;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  applyItemEffects(effects: ItemEffect[]): void {
    // Reset to base values
    this.speed = PLAYER_SPEED;
    this.maxStamina = PLAYER_STAMINA_MAX;

    for (const effect of effects) {
      switch (effect.stat) {
        case 'speed':
          this.speed = PLAYER_SPEED * effect.modifier;
          break;
        case 'stamina':
          this.maxStamina = PLAYER_STAMINA_MAX * effect.modifier;
          break;
      }
    }
  }

  getStamina(): number {
    return this.stamina;
  }

  getMaxStamina(): number {
    return this.maxStamina;
  }
}
