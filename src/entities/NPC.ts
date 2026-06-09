import Phaser from 'phaser';
import { Entity } from '@/entities/Entity';
import { NPCType, BehaviorPattern, NPCDefinition } from '@/types/game.types';
import { WORLD_WIDTH, WORLD_HEIGHT, NPC_SIZE } from '@/config/constants';
import { NPC_SPRITE_RES } from '@/graphics/SpriteFactory';
import { AgentPersona, AgentMood, AgentIntent, Needs, makeNeeds } from '@/data/personas';
import { Resident } from '@/systems/ResidentRegistry';

export class NPC extends Entity {
  npcType: NPCType;
  behaviorPattern: BehaviorPattern;
  originalBehavior: BehaviorPattern;
  speed: number;
  interactable: boolean;
  dialogueLines: string[];

  // --- Living-City agent state ---
  persona: AgentPersona | null = null;
  mood: AgentMood = 'content';
  intent: AgentIntent = 'idle';
  /** Set true once the agent reaches a station and "boards" — flagged for despawn. */
  boarded: boolean = false;

  private currentTarget: { x: number; y: number } | null = null;
  private behaviorTimer: number = 0;
  private pauseTimer: number = 0;
  private isPaused: boolean = false;
  private fleeFromX: number = 0;
  private fleeFromY: number = 0;
  private dirChangeTimer: number = 0;
  private fleeAngleOffset: number = 0;

  // Goal-seek (commute) state
  private goalTarget: { x: number; y: number } | null = null;
  private onGoalReached: (() => void) | null = null;

  // Ambient speech bubble
  private speechBubble: Phaser.GameObjects.Text | null = null;
  private bubbleTimer: number = 0;

  // Social: standing and chatting with another agent
  inConversation: boolean = false;
  private conversationTimer: number = 0;

  // Persistent name tag for recognizable residents
  private nameTag: Phaser.GameObjects.Text | null = null;

  // The Sims layer: needs, persistent identity, witness state
  needs: Needs = makeNeeds();
  resident: Resident | null = null;
  isWitness: boolean = false;
  /** Called as the NPC is recycled so the system can persist its needs. */
  onAgentRelease: ((npc: NPC) => void) | null = null;
  private witnessMark: Phaser.GameObjects.Text | null = null;

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

    // Tick any active speech bubble (independent of movement)
    this.tickBubble(dt);

    // Standing in a conversation — hold still until it ends
    if (this.inConversation) {
      body.setVelocity(0, 0);
      this.conversationTimer -= dt;
      if (this.conversationTimer <= 0) {
        this.inConversation = false;
        this.isPaused = true;
        this.pauseTimer = 0.4 + Math.random() * 0.6;
      }
      return;
    }

    // Goal-seek runs even while "paused" so commuters keep heading to the train
    if (this.behaviorPattern === 'goal_seek') {
      this.updateGoalSeek(dt, body);
      return;
    }

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

  // ===== Living-City agent behavior =====

  /** Move toward a fixed goal (e.g. a station entrance). Fires a callback on arrival. */
  private updateGoalSeek(dt: number, body: Phaser.Physics.Arcade.Body): void {
    if (!this.goalTarget) {
      body.setVelocity(0, 0);
      return;
    }
    const dx = this.goalTarget.x - this.x;
    const dy = this.goalTarget.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 8) {
      body.setVelocity(0, 0);
      const cb = this.onGoalReached;
      this.goalTarget = null;
      this.onGoalReached = null;
      if (cb) cb();
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    body.setVelocity(nx * this.speed, ny * this.speed);
    if (this.entitySprite) this.entitySprite.setFlipX(nx < -0.1);
  }

  /** Assign a persona, mood and intent. A speed multiplier reflects urgency. */
  assignAgent(persona: AgentPersona, mood: AgentMood, intent: AgentIntent, speedMul: number): void {
    this.persona = persona;
    this.mood = mood;
    this.intent = intent;
    this.speed = Math.max(20, this.speed * speedMul);
  }

  /** Send the agent toward a world point; `onReached` fires once on arrival. */
  setGoal(x: number, y: number, onReached: () => void): void {
    this.goalTarget = { x, y };
    this.onGoalReached = onReached;
    this.behaviorPattern = 'goal_seek';
    this.isPaused = false;
  }

  hasPersona(): boolean {
    return this.persona !== null;
  }

  /** Show a small floating speech bubble above the NPC for a few seconds. */
  showBubble(text: string): void {
    if (!this.scene) return;
    this.hideBubble();
    const bubble = this.scene.add.text(0, -11, text, {
      fontSize: '22px',
      color: '#ffffff',
      align: 'center',
      backgroundColor: '#000000d9',
      padding: { x: 7, y: 4 },
      wordWrap: { width: 300 },
    }).setOrigin(0.5, 1).setScale(0.2).setDepth(70);
    this.add(bubble);
    this.speechBubble = bubble;
    this.bubbleTimer = 2.6 + Math.min(text.length, 60) * 0.03;
    // Pop-in
    bubble.setAlpha(0);
    this.scene.tweens.add({ targets: bubble, alpha: 1, duration: 150 });
  }

  hasBubble(): boolean {
    return this.speechBubble !== null;
  }

  private hideBubble(): void {
    if (this.speechBubble) {
      this.speechBubble.destroy();
      this.speechBubble = null;
    }
    this.bubbleTimer = 0;
  }

  private tickBubble(dt: number): void {
    if (!this.speechBubble) return;
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.hideBubble();
    }
  }

  /** Stop and chat for a few seconds. Faces the partner if given. */
  startConversation(durationSec: number, faceX?: number): void {
    this.inConversation = true;
    this.conversationTimer = durationSec;
    this.behaviorPattern = this.originalBehavior;
    this.currentTarget = null;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.setVelocity(0, 0);
    if (faceX !== undefined && this.entitySprite) {
      this.entitySprite.setFlipX(faceX < this.x);
    }
  }

  /** Show a persistent name tag above the head (for recognizable residents). */
  showNameTag(name: string): void {
    if (!this.scene) return;
    if (this.nameTag) {
      if (this.nameTag.text !== name) this.nameTag.setText(name);
      return;
    }
    const tag = this.scene.add.text(0, -9, name, {
      fontSize: '18px',
      color: '#ffe9a8',
      align: 'center',
      backgroundColor: '#000000b3',
      padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScale(0.13).setDepth(68).setAlpha(0);
    this.add(tag);
    this.nameTag = tag;
    this.scene.tweens.add({ targets: tag, alpha: 0.9, duration: 200 });
  }

  hideNameTag(): void {
    if (this.nameTag) {
      this.nameTag.destroy();
      this.nameTag = null;
    }
  }

  hasNameTag(): boolean {
    return this.nameTag !== null;
  }

  /** Attach a persistent resident — its persona and remembered needs. */
  bindResident(resident: Resident): void {
    this.resident = resident;
    this.persona = resident.persona;
    this.needs = { ...resident.needs };
  }

  isKnownToPlayer(): boolean {
    return this.resident?.metPlayer ?? false;
  }

  getRelationship(): number {
    return this.resident?.relationship ?? 0;
  }

  /** Flag this agent as having witnessed a crime — shows a worried marker. */
  setWitness(on: boolean): void {
    this.isWitness = on;
    if (on) {
      if (!this.witnessMark && this.scene) {
        const mark = this.scene.add.text(5, -8, '!', {
          fontSize: '20px', color: '#ff5252', fontStyle: 'bold',
        }).setOrigin(0.5, 1).setScale(0.16).setDepth(72).setAlpha(0);
        this.add(mark);
        this.witnessMark = mark;
        this.scene.tweens.add({
          targets: mark, alpha: 1, y: -10,
          duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
    } else {
      this.witnessMark?.destroy();
      this.witnessMark = null;
    }
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

    // Reset agent brain so a recycled NPC gets a fresh life
    this.persona = null;
    this.mood = 'content';
    this.intent = 'idle';
    this.boarded = false;
    this.goalTarget = null;
    this.onGoalReached = null;
    this.inConversation = false;
    this.conversationTimer = 0;
    this.resident = null;
    this.isWitness = false;
    this.onAgentRelease = null;
    this.needs = makeNeeds();
    this.hideBubble();
    this.hideNameTag();
    this.setWitness(false);

    if (this.entitySprite) {
      this.entitySprite.setTexture(textureKey);
      this.entitySprite.setScale(NPC_SIZE / NPC_SPRITE_RES);
      this.entitySprite.setAlpha(1);
    }
  }

  deactivate(): void {
    // Persist this agent's needs back to its resident before recycling
    if (this.onAgentRelease) {
      const cb = this.onAgentRelease;
      this.onAgentRelease = null;
      cb(this);
    }
    this.hideBubble();
    this.hideNameTag();
    this.setWitness(false);
    this.inConversation = false;
    super.deactivate();
  }
}
