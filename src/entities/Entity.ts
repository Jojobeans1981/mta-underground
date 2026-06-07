import Phaser from 'phaser';

export abstract class Entity extends Phaser.GameObjects.Container {
  entityId: string;
  isActive: boolean = true;
  protected entitySprite: Phaser.GameObjects.Sprite | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    entityId: string
  ) {
    super(scene, x, y);

    this.entityId = entityId;

    // Create sprite
    this.entitySprite = scene.add.sprite(0, 0, textureKey);
    this.add(this.entitySprite);

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  abstract update(delta: number): void;

  setEntityPosition(x: number, y: number): void {
    this.setPosition(x, y);
  }

  getEntityPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  distanceTo(other: Entity): number {
    return Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
  }

  activate(): void {
    this.isActive = true;
    this.setActive(true);
    this.setVisible(true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = true;
    }
  }

  deactivate(): void {
    this.isActive = false;
    this.setActive(false);
    this.setVisible(false);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setVelocity(0, 0);
    }
  }

  destroy(fromScene?: boolean): void {
    this.entitySprite?.destroy();
    this.entitySprite = null;
    super.destroy(fromScene);
  }
}
