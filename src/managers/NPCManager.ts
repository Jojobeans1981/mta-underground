import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { Civilian } from '@/entities/Civilian';
import { NPCDefinition } from '@/types/game.types';
import { getNPCTextureKey, CIVILIAN_DEFINITIONS, getCivilianTextureKey } from '@/data/npcs';
import {
  MAX_NPCS_VISIBLE,
  NPC_SPAWN_RADIUS,
  NPC_DESPAWN_RADIUS,
  PLAYER_INTERACT_RADIUS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from '@/config/constants';

export class NPCManager {
  private activeNPCs: NPC[] = [];
  private npcPool: NPC[] = [];
  private maxActive: number = MAX_NPCS_VISIBLE;
  private spawnTimer: number = 0;
  private scene: Phaser.Scene | null = null;
  private npcGroup: Phaser.Physics.Arcade.Group | null = null;
  private poolMaxSize: number = 30;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    this.npcGroup = scene.physics.add.group({ runChildUpdate: false });
    this.activeNPCs = [];
    this.npcPool = [];
    this.spawnTimer = 0;
  }

  update(playerX: number, playerY: number, delta: number): void {
    if (!this.scene) return;

    const dt = delta / 1000;

    // Despawn far NPCs
    for (let i = this.activeNPCs.length - 1; i >= 0; i--) {
      const npc = this.activeNPCs[i];
      const dist = Math.hypot(npc.x - playerX, npc.y - playerY);
      if (dist > NPC_DESPAWN_RADIUS) {
        this.despawn(npc);
      }
    }

    // Spawn check every 0.5s
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.5;

      const deficit = this.maxActive - this.activeNPCs.length;
      // Spawn up to 3 per tick to avoid stutters
      const toSpawn = Math.min(deficit, 3);

      for (let i = 0; i < toSpawn; i++) {
        // Pick random position within spawn radius, but at least 60% away (off-screen)
        const angle = Math.random() * Math.PI * 2;
        const minDist = NPC_SPAWN_RADIUS * 0.6;
        const maxDist = NPC_SPAWN_RADIUS;
        const dist = minDist + Math.random() * (maxDist - minDist);

        const sx = playerX + Math.cos(angle) * dist;
        const sy = playerY + Math.sin(angle) * dist;

        // Clamp to world bounds
        const cx = Phaser.Math.Clamp(sx, 60, WORLD_WIDTH - 60);
        const cy = Phaser.Math.Clamp(sy, 60, WORLD_HEIGHT - 60);

        this.spawnCivilian(cx, cy);
      }
    }

    // Update all active NPCs
    for (const npc of this.activeNPCs) {
      npc.update(delta);
    }
  }

  spawnCivilian(x: number, y: number): NPC | null {
    if (!this.scene) return null;

    // Try to reuse from pool
    if (this.npcPool.length > 0) {
      const npc = this.npcPool.pop()!;
      const variant = Math.floor(Math.random() * 4);
      const def = CIVILIAN_DEFINITIONS[variant];
      const textureKey = getCivilianTextureKey(def.id);

      npc.initFromDefinition(def, textureKey);
      npc.setPosition(x, y);
      npc.activate();
      this.activeNPCs.push(npc);
      return npc;
    }

    // Create new civilian
    const variant = Math.floor(Math.random() * 4);
    const npc = new Civilian(this.scene, x, y, variant);
    npc.setDepth(50);

    if (this.npcGroup) {
      this.npcGroup.add(npc);
    }

    this.activeNPCs.push(npc);
    return npc;
  }

  spawnNPCFromDefinition(x: number, y: number, definition: NPCDefinition): NPC | null {
    if (!this.scene) return null;

    const textureKey = getNPCTextureKey(definition.type, definition.id);
    const npc = new NPC(this.scene, x, y, definition, textureKey);
    npc.setDepth(50);

    if (this.npcGroup) {
      this.npcGroup.add(npc);
    }

    this.activeNPCs.push(npc);
    return npc;
  }

  despawn(npc: NPC): void {
    const idx = this.activeNPCs.indexOf(npc);
    if (idx !== -1) {
      this.activeNPCs.splice(idx, 1);
    }

    npc.deactivate();

    if (this.npcPool.length < this.poolMaxSize) {
      this.npcPool.push(npc);
    } else {
      npc.destroy();
    }
  }

  despawnAll(): void {
    for (let i = this.activeNPCs.length - 1; i >= 0; i--) {
      this.despawn(this.activeNPCs[i]);
    }

    for (const pooledNpc of this.npcPool) {
      pooledNpc.destroy();
    }
    this.npcPool = [];
  }

  getNearbyNPCs(x: number, y: number, radius: number): NPC[] {
    return this.activeNPCs.filter((npc) => {
      const dist = Math.hypot(npc.x - x, npc.y - y);
      return dist < radius && npc.isActive;
    });
  }

  getInteractableNPC(playerX: number, playerY: number): NPC | null {
    const nearby = this.getNearbyNPCs(playerX, playerY, PLAYER_INTERACT_RADIUS);
    const interactable = nearby.filter((n) => n.interactable);

    if (interactable.length === 0) return null;

    // Return closest
    let closest = interactable[0];
    let closestDist = Math.hypot(closest.x - playerX, closest.y - playerY);

    for (let i = 1; i < interactable.length; i++) {
      const d = Math.hypot(interactable[i].x - playerX, interactable[i].y - playerY);
      if (d < closestDist) {
        closest = interactable[i];
        closestDist = d;
      }
    }

    return closest;
  }

  getGroup(): Phaser.Physics.Arcade.Group | null {
    return this.npcGroup;
  }

  getActiveCount(): number {
    return this.activeNPCs.length;
  }

  getActiveNPCs(): NPC[] {
    return this.activeNPCs;
  }
}
