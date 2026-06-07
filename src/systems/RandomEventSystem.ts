import Phaser from 'phaser';

export interface RandomEvent {
  id: string;
  title: string;
  description: string;
  type: 'bonus_money' | 'bonus_xp' | 'fare_evader_spotted' | 'lost_item' | 'crowd_surge';
  reward: { money: number; xp: number };
  worldX: number;
  worldY: number;
  expiresIn: number; // seconds
}

const EVENT_TEMPLATES = [
  { title: 'Dropped Wallet', desc: 'Someone dropped their wallet!', type: 'bonus_money' as const, money: 50, xp: 25 },
  { title: 'Good Samaritan', desc: 'Help a confused rider.', type: 'bonus_xp' as const, money: 20, xp: 75 },
  { title: 'Fare Evader Spotted', desc: 'A fare evader was seen nearby!', type: 'fare_evader_spotted' as const, money: 100, xp: 50 },
  { title: 'Lost MetroCard', desc: 'Found a MetroCard on the ground.', type: 'lost_item' as const, money: 30, xp: 15 },
  { title: 'Rush Hour Bonus', desc: 'Extra busy today. Bonus pay!', type: 'bonus_money' as const, money: 75, xp: 30 },
];

/**
 * Spawns random world events that reward players for exploring.
 * Events appear as pickup spots on the map, expire after a time.
 */
export class RandomEventSystem {
  private scene: Phaser.Scene | null = null;
  private activeEvents: Map<string, { event: RandomEvent; marker: Phaser.GameObjects.Container }> = new Map();
  private spawnTimer: number = 30; // Seconds until next event spawns
  private eventCounter: number = 0;
  private maxActiveEvents: number = 2;

  init(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  update(playerX: number, playerY: number, delta: number): RandomEvent | null {
    if (!this.scene) return null;
    const dt = delta / 1000;

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.activeEvents.size < this.maxActiveEvents) {
      this.spawnTimer = 25 + Math.random() * 20; // 25-45 seconds between events
      this.spawnRandomEvent(playerX, playerY);
    }

    // Check for player proximity to events (auto-collect)
    for (const [id, entry] of this.activeEvents) {
      const dist = Math.hypot(entry.event.worldX - playerX, entry.event.worldY - playerY);
      if (dist < 15) {
        // Collected!
        entry.marker.destroy();
        this.activeEvents.delete(id);
        return entry.event;
      }

      // Expire events
      entry.event.expiresIn -= dt;
      if (entry.event.expiresIn <= 0) {
        entry.marker.destroy();
        this.activeEvents.delete(id);
      }
    }

    return null;
  }

  private spawnRandomEvent(nearX: number, nearY: number): void {
    if (!this.scene) return;

    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];

    // Spawn within 100-200px of player, on walkable area
    const angle = Math.random() * Math.PI * 2;
    const dist = 100 + Math.random() * 100;
    const wx = Phaser.Math.Clamp(nearX + Math.cos(angle) * dist, 60, 940);
    const wy = Phaser.Math.Clamp(nearY + Math.sin(angle) * dist, 60, 940);

    this.eventCounter++;
    const id = `event_${this.eventCounter}`;

    const event: RandomEvent = {
      id,
      title: template.title,
      description: template.desc,
      type: template.type,
      reward: { money: template.money, xp: template.xp },
      worldX: wx,
      worldY: wy,
      expiresIn: 30, // 30 seconds to collect
    };

    // Create world marker
    const marker = this.scene.add.container(wx, wy);
    marker.setDepth(82);

    // Glowing pickup circle
    const glow = this.scene.add.circle(0, 0, 8, 0x4caf50, 0.3);
    this.scene.tweens.add({
      targets: glow,
      scaleX: { from: 0.7, to: 1.3 }, scaleY: { from: 0.7, to: 1.3 },
      alpha: { from: 0.2, to: 0.5 },
      duration: 800, yoyo: true, repeat: -1,
    });
    marker.add(glow);

    // Icon (small colored dot)
    const dot = this.scene.add.circle(0, 0, 3, 0x4caf50, 0.8);
    marker.add(dot);

    // Float animation
    this.scene.tweens.add({
      targets: marker, y: { from: wy - 2, to: wy + 2 },
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.activeEvents.set(id, { event, marker });
  }

  clearAll(): void {
    for (const entry of this.activeEvents.values()) {
      entry.marker.destroy();
    }
    this.activeEvents.clear();
  }
}
