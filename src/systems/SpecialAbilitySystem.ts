import Phaser from 'phaser';
import { CharacterClass } from '@/types/game.types';

/**
 * Class-specific special abilities with cooldowns.
 *
 * POLICE — Badge Flash: Stuns all nearby NPCs for 3 seconds. Shockwave effect.
 * RIDER  — Parkour Dash: Burst of speed + invincibility frames + afterimages.
 * DRIVER — Horn Blast: Scares NPCs away, clears a path, nearby cars honk back.
 *
 * Q key on desktop, double-tap action button on mobile.
 */

interface AbilityDef {
  name: string;
  icon: string;
  cooldown: number;    // seconds
  duration: number;    // active duration in seconds
  color: number;
}

const ABILITIES: Record<CharacterClass, AbilityDef> = {
  police: { name: 'Badge Flash', icon: '🔦', cooldown: 20, duration: 3, color: 0xffd700 },
  rider:  { name: 'Parkour Dash', icon: '💨', cooldown: 12, duration: 1.5, color: 0x00e5ff },
  driver: { name: 'Horn Blast', icon: '📯', cooldown: 15, duration: 2, color: 0xff6f00 },
};

export class SpecialAbilitySystem {
  private scene: Phaser.Scene | null = null;
  private characterClass: CharacterClass = 'police';
  private cooldownRemaining: number = 0;
  private isActive: boolean = false;
  private activeTimer: number = 0;
  private abilityDef: AbilityDef;

  // UI elements
  private container: Phaser.GameObjects.Container | null = null;
  private cooldownArc: Phaser.GameObjects.Graphics | null = null;
  private iconText: Phaser.GameObjects.Text | null = null;
  private readyGlow: Phaser.GameObjects.Arc | null = null;
  private keyHint: Phaser.GameObjects.Text | null = null;

  // Keyboard
  private qKey: Phaser.Input.Keyboard.Key | null = null;

  constructor() {
    this.abilityDef = ABILITIES.police;
  }

  init(scene: Phaser.Scene, characterClass: CharacterClass): void {
    this.scene = scene;
    this.characterClass = characterClass;
    this.abilityDef = ABILITIES[characterClass];
    this.cooldownRemaining = 0;

    const { width, height } = scene.cameras.main;

    // UI — bottom-center ability indicator
    this.container = scene.add.container(width / 2, height - 50);
    this.container.setScrollFactor(0).setDepth(995);

    // Background circle
    const bgCircle = scene.add.circle(0, 0, 22, 0x1a1a2e, 0.8);
    bgCircle.setStrokeStyle(2, this.abilityDef.color, 0.6);
    this.container.add(bgCircle);

    // Ready glow
    this.readyGlow = scene.add.circle(0, 0, 24, this.abilityDef.color, 0);
    this.container.add(this.readyGlow);
    scene.tweens.add({
      targets: this.readyGlow,
      alpha: { from: 0, to: 0.3 },
      scaleX: { from: 0.9, to: 1.3 }, scaleY: { from: 0.9, to: 1.3 },
      duration: 800, yoyo: true, repeat: -1,
    });

    // Icon
    this.iconText = scene.add.text(0, -2, this.abilityDef.icon, {
      fontSize: '18px',
    }).setOrigin(0.5);
    this.container.add(this.iconText);

    // Key hint
    this.keyHint = scene.add.text(0, 18, '[Q]', {
      fontSize: '8px', color: '#888888', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(this.keyHint);

    // Cooldown overlay arc
    this.cooldownArc = scene.add.graphics();
    this.cooldownArc.setScrollFactor(0).setDepth(996);
    this.container.add(this.cooldownArc);

    // Q key binding
    if (scene.input.keyboard) {
      this.qKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    }
  }

  update(delta: number, playerX: number, playerY: number): boolean {
    if (!this.scene) return false;
    const dt = delta / 1000;

    // Cooldown tick
    if (this.cooldownRemaining > 0) {
      this.cooldownRemaining -= dt;
      if (this.cooldownRemaining <= 0) {
        this.cooldownRemaining = 0;
        this.onReady();
      }
      this.updateCooldownUI();
    }

    // Active effect tick
    if (this.isActive) {
      this.activeTimer -= dt;
      if (this.activeTimer <= 0) {
        this.isActive = false;
      }
    }

    // Check for activation
    if (this.qKey && Phaser.Input.Keyboard.JustDown(this.qKey)) {
      return this.tryActivate(playerX, playerY);
    }

    return false;
  }

  tryActivate(playerX: number, playerY: number): boolean {
    if (!this.scene || this.cooldownRemaining > 0 || this.isActive) return false;

    this.isActive = true;
    this.activeTimer = this.abilityDef.duration;
    this.cooldownRemaining = this.abilityDef.cooldown;

    // Hide ready glow
    this.readyGlow?.setAlpha(0);

    // Visual feedback based on class
    switch (this.characterClass) {
      case 'police':
        this.activateBadgeFlash(playerX, playerY);
        break;
      case 'rider':
        this.activateParkourDash(playerX, playerY);
        break;
      case 'driver':
        this.activateHornBlast(playerX, playerY);
        break;
    }

    return true;
  }

  // === POLICE: Badge Flash ===
  private activateBadgeFlash(px: number, py: number): void {
    if (!this.scene) return;

    // Gold shockwave rings
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.circle(px, py, 5, 0xffd700, 0);
      ring.setStrokeStyle(1.5, 0xffd700, 0.8);
      ring.setDepth(150);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 6 + i * 3, scaleY: 6 + i * 3,
        alpha: 0,
        duration: 500 + i * 150,
        delay: i * 80,
        onComplete: () => ring.destroy(),
      });
    }

    // Gold flash
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xffd700, 0.3);
    flash.setScrollFactor(0).setDepth(900);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 400,
      onComplete: () => flash.destroy(),
    });

    this.scene.cameras.main.shake(200, 0.008);

    // Badge icon flies out from player
    // Render at 8x for crisp world-space text
    const badge = this.scene.add.text(px, py, '⭐', { fontSize: '64px' }).setOrigin(0.5).setDepth(160).setScale(0.125);
    this.scene.tweens.add({
      targets: badge, y: py - 20, alpha: 0, scaleX: 0.375, scaleY: 0.375,
      duration: 500, onComplete: () => badge.destroy(),
    });
  }

  // === RIDER: Parkour Dash ===
  private activateParkourDash(px: number, py: number): void {
    if (!this.scene) return;

    // Speed burst lines
    const { width, height } = this.scene.cameras.main;
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const startDist = 50 + Math.random() * 80;
      const endDist = startDist + 100;
      const sx = width / 2 + Math.cos(angle) * startDist;
      const sy = height / 2 + Math.sin(angle) * startDist;
      const ex = width / 2 + Math.cos(angle) * endDist;
      const ey = height / 2 + Math.sin(angle) * endDist;
      const line = this.scene.add.line(0, 0, sx, sy, ex, ey, 0x00e5ff, 0.3);
      line.setScrollFactor(0).setDepth(800).setLineWidth(1);
      this.scene.tweens.add({
        targets: line, alpha: 0, duration: 300,
        onComplete: () => line.destroy(),
      });
    }

    // Cyan flash
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x00e5ff, 0.2);
    flash.setScrollFactor(0).setDepth(899);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 250,
      onComplete: () => flash.destroy(),
    });

    // Zoom effect
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    this.scene.tweens.add({
      targets: cam, zoom: baseZoom * 0.85,
      duration: 150, yoyo: true, ease: 'Power2',
    });
  }

  // === DRIVER: Horn Blast ===
  private activateHornBlast(px: number, py: number): void {
    if (!this.scene) return;

    // Sound wave rings (orange)
    for (let i = 0; i < 5; i++) {
      const ring = this.scene.add.circle(px, py, 3, 0xff6f00, 0);
      ring.setStrokeStyle(2, 0xff6f00, 0.6);
      ring.setDepth(148);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 5 + i * 2, scaleY: 5 + i * 2,
        alpha: 0,
        duration: 600,
        delay: i * 100,
        onComplete: () => ring.destroy(),
      });
    }

    // "HONK!" text
    // Render at 8x for crisp world-space text
    const honk = this.scene.add.text(px, py - 12, 'HONK!', {
      fontSize: '48px', color: '#ff6f00', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(160).setScale(0.125);
    this.scene.tweens.add({
      targets: honk, y: py - 25, alpha: 0, scaleX: 0.25, scaleY: 0.25,
      duration: 600, onComplete: () => honk.destroy(),
    });

    // Orange screen pulse
    const { width, height } = this.scene.cameras.main;
    const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, 0xff6f00, 0.15);
    flash.setScrollFactor(0).setDepth(898);
    this.scene.tweens.add({
      targets: flash, alpha: 0, duration: 300,
      onComplete: () => flash.destroy(),
    });

    this.scene.cameras.main.shake(100, 0.004);
  }

  private onReady(): void {
    if (!this.scene || !this.readyGlow || !this.container) return;

    // "READY!" pulse
    const { width, height } = this.scene.cameras.main;
    const readyText = this.scene.add.text(width / 2, height - 80, `${this.abilityDef.icon} READY!`, {
      fontSize: '16px', color: '#' + this.abilityDef.color.toString(16).padStart(6, '0'),
      fontStyle: 'bold', stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(994);

    this.scene.tweens.add({
      targets: readyText,
      alpha: { from: 1, to: 0 }, y: height - 100,
      duration: 1000, onComplete: () => readyText.destroy(),
    });

    // Re-show glow
    this.scene.tweens.add({
      targets: this.readyGlow,
      alpha: 0.3, duration: 300,
    });
  }

  private updateCooldownUI(): void {
    if (!this.cooldownArc || !this.iconText) return;

    this.cooldownArc.clear();
    if (this.cooldownRemaining > 0) {
      const frac = this.cooldownRemaining / this.abilityDef.cooldown;
      // Dark overlay
      this.cooldownArc.fillStyle(0x000000, 0.6);
      this.cooldownArc.slice(0, 0, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac, true);
      this.cooldownArc.fillPath();

      // Cooldown seconds
      this.iconText.setText(Math.ceil(this.cooldownRemaining).toString());
      this.iconText.setFontSize(14);
    } else {
      this.iconText.setText(this.abilityDef.icon);
      this.iconText.setFontSize(18);
    }
  }

  /** Is the special ability currently active? */
  getIsActive(): boolean {
    return this.isActive;
  }

  /** Get effect radius for NPC stun checks (Police) */
  getStunRadius(): number {
    return this.characterClass === 'police' && this.isActive ? 80 : 0;
  }

  /** Get speed multiplier (Rider dash) */
  getDashSpeedMultiplier(): number {
    return this.characterClass === 'rider' && this.isActive ? 2.5 : 1.0;
  }

  /** Get scare radius for NPCs (Driver) */
  getScareRadius(): number {
    return this.characterClass === 'driver' && this.isActive ? 60 : 0;
  }
}
