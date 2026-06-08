import Phaser from 'phaser';
import { Station } from '@/types/game.types';
import { hexToNum, COLOR_UI_PRIMARY } from '@/graphics/colors';

const TAG_STORAGE_KEY = 'mta_graffiti_tags';
const RIVAL_RETAG_INTERVAL = 120; // seconds between rival retagging
const TAG_INTERACT_RANGE = 18;

// Graffiti colors — player and rival crews
const PLAYER_COLORS = [0xff00ff, 0x00ffff, 0xffff00, 0xff6600];
const RIVAL_COLORS = [0xff2222, 0x8844ff, 0x22aa22];
const RIVAL_CREW_NAMES = ['Los Tunnels', 'Bronx Kings', 'Q-Train Vandals'];

export interface TagSpot {
  id: string;
  worldX: number;
  worldY: number;
  stationId: string;
  owner: 'none' | 'player' | 'rival';
  rivalCrew: string;
  color: number;
}

interface TagSaveData {
  spots: { id: string; owner: string; rivalCrew: string; color: number }[];
  lastRivalRetag: number;
}

export class GraffitiSystem {
  private scene: Phaser.Scene;
  private spots: Map<string, TagSpot> = new Map();
  private containers: Map<string, Phaser.GameObjects.Container> = new Map();
  private playerColor: number;
  private lastRivalRetag: number = 0;
  private rivalRetagTimer: number = 0;
  private totalPlayerTags: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.playerColor = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
  }

  /** Generate tag spots around each station and load saved state */
  init(stations: Station[]): void {
    // Generate spots — 2-3 per station
    for (const station of stations) {
      const spotCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < spotCount; i++) {
        const angle = (i / spotCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 35 + Math.random() * 30;
        const id = `tag_${station.id}_${i}`;
        this.spots.set(id, {
          id,
          worldX: station.position.x + Math.cos(angle) * dist,
          worldY: station.position.y + Math.sin(angle) * dist,
          stationId: station.id,
          owner: 'none',
          rivalCrew: '',
          color: 0x555555,
        });
      }
    }

    // Load saved tag state
    this.loadState();

    // Initial rival presence — tag ~30% of unclaimed spots
    let unclaimed = Array.from(this.spots.values()).filter(s => s.owner === 'none');
    const rivalCount = Math.floor(unclaimed.length * 0.3);
    for (let i = 0; i < rivalCount; i++) {
      const idx = Math.floor(Math.random() * unclaimed.length);
      const spot = unclaimed[idx];
      spot.owner = 'rival';
      spot.rivalCrew = RIVAL_CREW_NAMES[Math.floor(Math.random() * RIVAL_CREW_NAMES.length)];
      spot.color = RIVAL_COLORS[Math.floor(Math.random() * RIVAL_COLORS.length)];
      unclaimed.splice(idx, 1);
    }

    // Count player tags
    this.totalPlayerTags = Array.from(this.spots.values()).filter(s => s.owner === 'player').length;

    // Render all spots
    for (const spot of this.spots.values()) {
      this.renderSpot(spot);
    }
  }

  /** Render a single tag spot in the world */
  private renderSpot(spot: TagSpot): void {
    // Destroy existing
    const existing = this.containers.get(spot.id);
    if (existing) existing.destroy();

    const container = this.scene.add.container(spot.worldX, spot.worldY);
    container.setDepth(45);

    if (spot.owner === 'none') {
      // Blank wall — subtle grey rectangle
      const wall = this.scene.add.rectangle(0, 0, 10, 8, 0x444444, 0.6);
      wall.setStrokeStyle(0.5, 0x666666);
      container.add(wall);

      // Subtle sparkle to draw attention
      const sparkle = this.scene.add.circle(3, -3, 1.5, 0xffffff, 0.4);
      container.add(sparkle);
      this.scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0.1, to: 0.5 },
        duration: 800 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
      });
    } else {
      // Tagged wall — colorful graffiti
      const wall = this.scene.add.rectangle(0, 0, 10, 8, spot.color, 0.8);
      wall.setStrokeStyle(0.5, 0xffffff);
      container.add(wall);

      // Drip effect
      const drip1 = this.scene.add.rectangle(-2, 5, 1, 3 + Math.random() * 3, spot.color, 0.6);
      container.add(drip1);
      const drip2 = this.scene.add.rectangle(2, 5, 1, 2 + Math.random() * 2, spot.color, 0.5);
      container.add(drip2);

      // Tag mark — simple symbol
      if (spot.owner === 'player') {
        // Player tag: star/crown
        const mark = this.scene.add.text(0, 0, '★', {
          fontSize: '16px', color: '#ffffff',
        }).setOrigin(0.5).setScale(0.125);
        container.add(mark);
      } else {
        // Rival tag: X mark
        const mark = this.scene.add.text(0, 0, 'X', {
          fontSize: '16px', color: '#000000', fontStyle: 'bold',
        }).setOrigin(0.5).setScale(0.125);
        container.add(mark);
      }

      // Crew label on player tags
      if (spot.owner === 'player') {
        const label = this.scene.add.text(0, -7, 'YOURS', {
          fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
          backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
        }).setOrigin(0.5, 1).setScale(0.0625);
        container.add(label);
      } else if (spot.owner === 'rival') {
        const label = this.scene.add.text(0, -7, spot.rivalCrew, {
          fontSize: '16px', color: '#ff4444', fontStyle: 'bold',
          backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
        }).setOrigin(0.5, 1).setScale(0.0625);
        container.add(label);
      }
    }

    this.containers.set(spot.id, container);
  }

  /** Check if player is near a taggable spot, return the spot and show prompt */
  getNearbySpot(playerX: number, playerY: number): TagSpot | null {
    let nearest: TagSpot | null = null;
    let nearestDist = TAG_INTERACT_RANGE;

    for (const spot of this.spots.values()) {
      if (spot.owner === 'player') continue; // Already yours
      const dist = Math.hypot(playerX - spot.worldX, playerY - spot.worldY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = spot;
      }
    }
    return nearest;
  }

  /** Tag a spot as the player's */
  tagSpot(spotId: string): { cred: number; wasRival: boolean; rivalCrew: string } | null {
    const spot = this.spots.get(spotId);
    if (!spot || spot.owner === 'player') return null;

    const wasRival = spot.owner === 'rival';
    const rivalCrew = spot.rivalCrew;

    spot.owner = 'player';
    spot.color = this.playerColor;
    spot.rivalCrew = '';

    this.totalPlayerTags++;

    // Cred: more for tagging over a rival
    const cred = wasRival ? 15 : 10;

    // Re-render
    this.renderSpot(spot);
    this.saveState();

    return { cred, wasRival, rivalCrew };
  }

  /** Rivals periodically retag some player spots */
  update(delta: number): void {
    this.rivalRetagTimer += delta / 1000;
    if (this.rivalRetagTimer < RIVAL_RETAG_INTERVAL) return;
    this.rivalRetagTimer = 0;

    // Pick 1-2 random player spots to rival-retag
    const playerSpots = Array.from(this.spots.values()).filter(s => s.owner === 'player');
    if (playerSpots.length === 0) return;

    const retagCount = Math.min(playerSpots.length, 1 + Math.floor(Math.random() * 2));
    for (let i = 0; i < retagCount; i++) {
      const idx = Math.floor(Math.random() * playerSpots.length);
      const spot = playerSpots[idx];
      spot.owner = 'rival';
      spot.rivalCrew = RIVAL_CREW_NAMES[Math.floor(Math.random() * RIVAL_CREW_NAMES.length)];
      spot.color = RIVAL_COLORS[Math.floor(Math.random() * RIVAL_COLORS.length)];
      this.totalPlayerTags--;
      this.renderSpot(spot);
      playerSpots.splice(idx, 1);
    }

    this.saveState();
  }

  getPlayerTagCount(): number {
    return this.totalPlayerTags;
  }

  getTotalSpotCount(): number {
    return this.spots.size;
  }

  getStreetCredLevel(): string {
    if (this.totalPlayerTags >= 20) return 'KING';
    if (this.totalPlayerTags >= 12) return 'LEGEND';
    if (this.totalPlayerTags >= 7) return 'KNOWN';
    if (this.totalPlayerTags >= 3) return 'UP & COMING';
    return 'NOBODY';
  }

  /** Show/hide interaction prompts near spots */
  updatePrompts(playerX: number, playerY: number): void {
    for (const [spotId, container] of this.containers) {
      const spot = this.spots.get(spotId);
      if (!spot || spot.owner === 'player') continue;

      const dist = Math.hypot(playerX - spot.worldX, playerY - spot.worldY);
      // We'll manage the prompt text from GameScene instead
    }
  }

  private saveState(): void {
    const data: TagSaveData = {
      spots: Array.from(this.spots.values()).map(s => ({
        id: s.id, owner: s.owner, rivalCrew: s.rivalCrew, color: s.color,
      })),
      lastRivalRetag: Date.now(),
    };
    try {
      localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore quota errors */ }
  }

  private loadState(): void {
    try {
      const raw = localStorage.getItem(TAG_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as TagSaveData;
      for (const saved of data.spots) {
        const spot = this.spots.get(saved.id);
        if (spot) {
          spot.owner = saved.owner as 'none' | 'player' | 'rival';
          spot.rivalCrew = saved.rivalCrew;
          spot.color = saved.color;
        }
      }
    } catch { /* corrupt data, start fresh */ }
  }

  destroy(): void {
    for (const container of this.containers.values()) {
      container.destroy();
    }
    this.containers.clear();
    this.spots.clear();
  }
}
