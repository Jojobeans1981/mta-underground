import Phaser from 'phaser';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  worldX: number;
  worldY: number;
  expiresIn: number;
}

export type PowerUpType = 'speed_boost' | 'magnet' | 'shield' | 'double_money' | 'slow_time';

interface PowerUpDef {
  type: PowerUpType;
  name: string;
  color: number;
  duration: number; // effect duration in seconds
  icon: string;
}

const POWERUP_DEFS: PowerUpDef[] = [
  { type: 'speed_boost', name: 'Turbo Boost', color: 0x00e5ff, duration: 10, icon: '⚡' },
  { type: 'magnet', name: 'Money Magnet', color: 0xffd700, duration: 12, icon: '🧲' },
  { type: 'shield', name: 'Shield', color: 0x4caf50, duration: 8, icon: '🛡️' },
  { type: 'double_money', name: '2X Money', color: 0xff6f00, duration: 15, icon: '💰' },
  { type: 'slow_time', name: 'Slow Mo', color: 0xd500f9, duration: 6, icon: '⏳' },
];

interface ActiveEffect {
  type: PowerUpType;
  timeLeft: number;
  indicator: Phaser.GameObjects.Text | null;
}

/**
 * Power-up drops and active effects.
 * Power-ups spawn from caught NPCs and world events.
 * Active effects modify gameplay (speed, earnings, time).
 */
export class PowerUpSystem {
  private scene: Phaser.Scene | null = null;
  private pickups: Map<string, { powerup: PowerUp; container: Phaser.GameObjects.Container }> = new Map();
  private activeEffects: ActiveEffect[] = [];
  private counter: number = 0;
  private effectContainer: Phaser.GameObjects.Container | null = null;

  init(scene: Phaser.Scene): void {
    this.scene = scene;

    // Screen-space container for active effect indicators
    const { width } = scene.cameras.main;
    this.effectContainer = scene.add.container(width - 12, 90);
    this.effectContainer.setScrollFactor(0).setDepth(996);
  }

  /** Spawn a random power-up at a world position */
  spawnAt(worldX: number, worldY: number): void {
    if (!this.scene) return;
    if (this.pickups.size >= 3) return; // Max 3 on map at once

    // 30% chance to drop a power-up
    if (Math.random() > 0.3) return;

    const def = POWERUP_DEFS[Math.floor(Math.random() * POWERUP_DEFS.length)];
    this.counter++;
    const id = `pu_${this.counter}`;

    const powerup: PowerUp = {
      id,
      type: def.type,
      worldX,
      worldY,
      expiresIn: 20, // 20 sec to pick up
    };

    // World-space glowing orb
    const container = this.scene.add.container(worldX, worldY);
    container.setDepth(95);

    // Outer glow ring
    const glow = this.scene.add.circle(0, 0, 7, def.color, 0.15);
    this.scene.tweens.add({
      targets: glow,
      scaleX: { from: 0.8, to: 1.5 }, scaleY: { from: 0.8, to: 1.5 },
      alpha: { from: 0.1, to: 0.3 },
      duration: 600, yoyo: true, repeat: -1,
    });
    container.add(glow);

    // Inner orb
    const orb = this.scene.add.circle(0, 0, 4, def.color, 0.8);
    this.scene.tweens.add({
      targets: orb,
      scaleX: { from: 0.9, to: 1.1 }, scaleY: { from: 0.9, to: 1.1 },
      duration: 400, yoyo: true, repeat: -1,
    });
    container.add(orb);

    // Spinning sparkle dots
    for (let i = 0; i < 4; i++) {
      const sparkle = this.scene.add.circle(0, 0, 1, 0xffffff, 0.6);
      this.scene.tweens.add({
        targets: sparkle,
        x: { from: Math.cos(i * Math.PI / 2) * 5, to: Math.cos(i * Math.PI / 2 + Math.PI * 2) * 5 },
        y: { from: Math.sin(i * Math.PI / 2) * 5, to: Math.sin(i * Math.PI / 2 + Math.PI * 2) * 5 },
        duration: 1500, repeat: -1,
      });
      container.add(sparkle);
    }

    // Float bob
    this.scene.tweens.add({
      targets: container,
      y: { from: worldY - 2, to: worldY + 2 },
      duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.pickups.set(id, { powerup, container });
  }

  /** Check player proximity and collect power-ups. Returns collected type or null. */
  update(playerX: number, playerY: number, delta: number): PowerUpType | null {
    if (!this.scene) return null;
    const dt = delta / 1000;
    let collected: PowerUpType | null = null;

    // Check pickups
    for (const [id, entry] of this.pickups) {
      const dist = Math.hypot(entry.powerup.worldX - playerX, entry.powerup.worldY - playerY);
      if (dist < 12) {
        // Collected!
        this.activateEffect(entry.powerup.type);
        entry.container.destroy();
        this.pickups.delete(id);
        collected = entry.powerup.type;
        continue;
      }

      // Expire
      entry.powerup.expiresIn -= dt;
      if (entry.powerup.expiresIn <= 0) {
        entry.container.destroy();
        this.pickups.delete(id);
      }
    }

    // Update active effects
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
      const effect = this.activeEffects[i];
      effect.timeLeft -= dt;
      if (effect.indicator) {
        const secs = Math.ceil(effect.timeLeft);
        const def = POWERUP_DEFS.find(d => d.type === effect.type);
        effect.indicator.setText(`${def?.icon ?? '?'} ${secs}s`);
      }
      if (effect.timeLeft <= 0) {
        effect.indicator?.destroy();
        this.activeEffects.splice(i, 1);
      }
    }

    return collected;
  }

  private activateEffect(type: PowerUpType): void {
    if (!this.scene || !this.effectContainer) return;

    const def = POWERUP_DEFS.find(d => d.type === type);
    if (!def) return;

    // Remove existing effect of same type
    const existing = this.activeEffects.findIndex(e => e.type === type);
    if (existing >= 0) {
      this.activeEffects[existing].indicator?.destroy();
      this.activeEffects.splice(existing, 1);
    }

    // Create indicator
    const yPos = this.activeEffects.length * 18;
    const indicator = this.scene.add.text(0, yPos, `${def.icon} ${def.duration}s`, {
      fontSize: '11px',
      color: '#' + def.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0);
    this.effectContainer.add(indicator);

    this.activeEffects.push({ type, timeLeft: def.duration, indicator });
  }

  /** Check if a specific effect is active */
  hasEffect(type: PowerUpType): boolean {
    return this.activeEffects.some(e => e.type === type);
  }

  /** Get the speed multiplier from active effects */
  getSpeedMultiplier(): number {
    return this.hasEffect('speed_boost') ? 1.5 : 1.0;
  }

  /** Get the money multiplier from active effects */
  getMoneyMultiplier(): number {
    return this.hasEffect('double_money') ? 2.0 : 1.0;
  }

  /** Is slow-mo active? */
  isSlowMo(): boolean {
    return this.hasEffect('slow_time');
  }

  clearAll(): void {
    for (const entry of this.pickups.values()) {
      entry.container.destroy();
    }
    this.pickups.clear();
    for (const effect of this.activeEffects) {
      effect.indicator?.destroy();
    }
    this.activeEffects.length = 0;
  }
}
