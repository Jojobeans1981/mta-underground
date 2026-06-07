import Phaser from 'phaser';
import { SaveManager } from '@/managers/SaveManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { ProgressionManager } from '@/managers/ProgressionManager';
import {
  hexToNum,
  COLOR_UI_PRIMARY,
  COLOR_UI_BACKGROUND,
  COLOR_UI_SURFACE,
  COLOR_UI_TEXT_DIM,
} from '@/graphics/colors';

export class CharacterSelectScene extends Phaser.Scene {
  private spotlightGraphics: Phaser.GameObjects.Graphics | null = null;
  private selectedIndex: number = -1;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const saveManager = this.game.registry.get('saveManager') as SaveManager;

    this.cameras.main.setBackgroundColor('#0a0a1e');

    // === ANIMATED GRID BACKGROUND ===
    this.createGridBackground(width, height);

    // === TITLE with glitch effect ===
    const title = this.add.text(width / 2, -40, 'CHOOSE YOUR ROLE', {
      fontSize: '24px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 4,
    }).setOrigin(0.5).setDepth(20);

    // Drop in
    this.tweens.add({
      targets: title, y: 36, duration: 500, ease: 'Back.easeOut',
    });

    // Glitch flicker
    this.time.addEvent({
      delay: 3000 + Math.random() * 2000,
      loop: true,
      callback: () => {
        title.setX(width / 2 + (Math.random() - 0.5) * 4);
        title.setTint(0xff4444);
        this.time.delayedCall(50, () => {
          title.setX(width / 2);
          title.clearTint();
        });
      },
    });

    // Neon underline
    const neonLine = this.add.rectangle(width / 2, 54, 0, 2, hexToNum(COLOR_UI_PRIMARY));
    neonLine.setDepth(20);
    this.tweens.add({
      targets: neonLine, displayWidth: 240, duration: 400, delay: 400, ease: 'Power2',
    });

    // === CARDS ===
    const cardW = 260;
    const cardH = 380;
    const gap = 24;
    const totalW = cardW * 3 + gap * 2;
    const startX = (width - totalW) / 2 + cardW / 2;
    const cardY = 66 + cardH / 2;

    const startGame = (selectedClass: 'police' | 'rider' | 'driver', district: string, defaults: any) => {
      const save = saveManager.createNewSave(selectedClass);
      const cp = save.classes[selectedClass];
      cp.unlocked = true;
      cp.unlockedMissionIds = defaults.missions;
      cp.activeSkinId = defaults.skin;
      cp.ownedSkinIds = [defaults.skin];
      cp.ownedItems = [defaults.item];
      cp.equippedItems = [defaults.item];
      saveManager.save(save);
      const econ = this.game.registry.get('economyManager') as EconomyManager;
      const prog = this.game.registry.get('progressionManager') as ProgressionManager;
      econ.init(save, saveManager, this.game.events);
      prog.init(save, saveManager, econ, this.game.events);

      // Epic transition
      this.screenTransitionOut(() => {
        this.game.registry.set('currentDistrict', district);
        this.scene.start('GameScene');
      });
    };

    // === METRO POLICE ===
    this.createHolographicCard(startX, cardY, cardW, cardH, 0, {
      name: 'METRO POLICE',
      subtitle: 'Manhattan Precinct',
      description: 'Patrol the underground.\nChase fare evaders.\nKeep the peace.',
      stats: 'SPD: ■■■□□  STR: ■■■■□  DEF: ■■■■■',
      spriteKey: 'player_police',
      accentColor: '#1a237e',
      glowColor: 0x3949ab,
      onSelect: () => startGame('police', 'manhattan', {
        missions: ['police_m01', 'police_m02'],
        skin: 'police_skin_default',
        item: 'police_radio_1',
      }),
    });

    // === RIDER ===
    this.createHolographicCard(startX + cardW + gap, cardY, cardW, cardH, 1, {
      name: 'RIDER',
      subtitle: 'Brooklyn Streets',
      description: 'Navigate the subway.\nSurvive the commute.\nFind your way.',
      stats: 'SPD: ■■■■■  STR: ■■□□□  DEF: ■■■□□',
      spriteKey: 'player_rider',
      accentColor: '#607d8b',
      glowColor: 0x78909c,
      onSelect: () => startGame('rider', 'brooklyn', {
        missions: ['rider_m01', 'rider_m02'],
        skin: 'rider_skin_default',
        item: 'rider_headphones_1',
      }),
    });

    // === MTA DRIVER ===
    this.createHolographicCard(startX + (cardW + gap) * 2, cardY, cardW, cardH, 2, {
      name: 'MTA DRIVER',
      subtitle: 'Queens Depot',
      description: 'Operate buses and trains.\nKeep the city moving.\nStay on schedule.',
      stats: 'SPD: ■■□□□  STR: ■■■□□  DEF: ■■■■■',
      spriteKey: 'player_driver',
      accentColor: '#0d47a1',
      glowColor: 0x1565c0,
      onSelect: () => startGame('driver', 'queens', {
        missions: ['driver_m01', 'driver_m02'],
        skin: 'driver_skin_default',
        item: 'driver_mirror_1',
      }),
    });

    this.cameras.main.fadeIn(300);
  }

  private createGridBackground(width: number, height: number): void {
    const g = this.add.graphics().setDepth(0).setAlpha(0.06);
    g.lineStyle(1, 0x4444ff);

    // Vertical lines
    for (let x = 0; x < width; x += 40) {
      g.moveTo(x, 0);
      g.lineTo(x, height);
    }
    // Horizontal lines
    for (let y = 0; y < height; y += 40) {
      g.moveTo(0, y);
      g.lineTo(width, y);
    }
    g.strokePath();

    // Animated scan line
    const scanLine = this.add.rectangle(width / 2, -2, width, 2, 0x4444ff, 0.08);
    scanLine.setDepth(1);
    this.tweens.add({
      targets: scanLine, y: height + 2,
      duration: 4000, repeat: -1, ease: 'Linear',
    });
  }

  private createHolographicCard(
    x: number, y: number, w: number, h: number, index: number,
    opts: {
      name: string;
      subtitle: string;
      description: string;
      stats: string;
      spriteKey: string;
      accentColor: string;
      glowColor: number;
      onSelect: () => void;
    }
  ): void {
    // Card slides up from below with stagger
    const startY = y + 400;
    const delay = 300 + index * 200;

    // Outer glow
    const glow = this.add.rectangle(x, startY, w + 8, h + 8, opts.glowColor, 0);
    glow.setDepth(4);
    this.tweens.add({
      targets: glow, y, duration: 600, delay, ease: 'Back.easeOut',
    });

    // Card background
    const bg = this.add.rectangle(x, startY, w, h, hexToNum(COLOR_UI_SURFACE), 0.95);
    bg.setStrokeStyle(1, hexToNum(opts.accentColor));
    bg.setDepth(5);
    this.tweens.add({
      targets: bg, y, duration: 600, delay, ease: 'Back.easeOut',
    });

    // Holographic sheen overlay — diagonal moving highlight
    const sheen = this.add.rectangle(x - w, startY, w * 0.3, h, 0xffffff, 0.03);
    sheen.setDepth(6);
    this.tweens.add({ targets: sheen, y, duration: 600, delay, ease: 'Back.easeOut' });
    this.tweens.add({
      targets: sheen,
      x: { from: x - w / 2, to: x + w / 2 },
      duration: 2000, repeat: -1, delay: delay + 1000,
    });

    // Accent bar — top
    const bar = this.add.rectangle(x, startY - h / 2 + 3, w - 2, 6, hexToNum(opts.accentColor));
    bar.setDepth(7);
    this.tweens.add({ targets: bar, y: y - h / 2 + 3, duration: 600, delay, ease: 'Back.easeOut' });

    // Corner accents (tech look)
    const cornerSize = 8;
    const corners = [
      { cx: x - w / 2 + 2, cy: y - h / 2 + 2, aw: cornerSize, ah: 1, bw: 1, bh: cornerSize },
      { cx: x + w / 2 - 2, cy: y - h / 2 + 2, aw: -cornerSize, ah: 1, bw: -1, bh: cornerSize },
      { cx: x - w / 2 + 2, cy: y + h / 2 - 2, aw: cornerSize, ah: -1, bw: 1, bh: -cornerSize },
      { cx: x + w / 2 - 2, cy: y + h / 2 - 2, aw: -cornerSize, ah: -1, bw: -1, bh: -cornerSize },
    ];
    for (const c of corners) {
      const ca = this.add.rectangle(c.cx + c.aw / 2, c.cy, Math.abs(c.aw), 1, hexToNum(opts.accentColor), 0.5);
      const cb = this.add.rectangle(c.cx, c.cy + c.bh / 2, 1, Math.abs(c.bh), hexToNum(opts.accentColor), 0.5);
      ca.setDepth(8); cb.setDepth(8);
      // Fade in
      ca.setAlpha(0); cb.setAlpha(0);
      this.tweens.add({ targets: [ca, cb], alpha: 0.5, duration: 300, delay: delay + 600 });
    }

    // Character sprite — spinning platform effect
    const spriteY = y - h / 2 + 80;
    const sprite = this.add.sprite(x, startY - h / 2 + 80, opts.spriteKey);
    sprite.setScale(5).setDepth(9);
    this.tweens.add({ targets: sprite, y: spriteY, duration: 600, delay, ease: 'Back.easeOut' });

    // Rotating highlight ring under character
    const ring = this.add.ellipse(x, spriteY + 25, 50, 12, hexToNum(opts.accentColor), 0.15);
    ring.setDepth(8);
    this.tweens.add({
      targets: ring,
      scaleX: { from: 0.8, to: 1.2 },
      alpha: { from: 0.1, to: 0.2 },
      duration: 1000, yoyo: true, repeat: -1,
    });

    // Name
    const nameText = this.add.text(x, y - h / 2 + 130, opts.name, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: nameText, alpha: 1, duration: 300, delay: delay + 400 });

    // Subtitle
    const subText = this.add.text(x, y - h / 2 + 150, opts.subtitle, {
      fontSize: '11px', color: opts.accentColor, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: subText, alpha: 1, duration: 300, delay: delay + 500 });

    // Stats bar (new!)
    const statsText = this.add.text(x, y - 10, opts.stats, {
      fontSize: '9px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: statsText, alpha: 1, duration: 300, delay: delay + 600 });

    // Description
    const descText = this.add.text(x, y + 30, opts.description, {
      fontSize: '11px', color: '#aaaaaa', align: 'center', lineSpacing: 4,
    }).setOrigin(0.5).setDepth(10).setAlpha(0);
    this.tweens.add({ targets: descText, alpha: 1, duration: 300, delay: delay + 600 });

    // SELECT button with glow pulse
    const btnY = y + h / 2 - 28;
    const btnGlow = this.add.rectangle(x, btnY, w - 26, 40, hexToNum(COLOR_UI_PRIMARY), 0.2);
    btnGlow.setDepth(9);
    this.tweens.add({
      targets: btnGlow,
      alpha: { from: 0.1, to: 0.3 },
      scaleX: { from: 1, to: 1.05 }, scaleY: { from: 1, to: 1.05 },
      duration: 800, yoyo: true, repeat: -1,
    });

    const btn = this.add.rectangle(x, btnY, w - 30, 36, hexToNum(COLOR_UI_PRIMARY));
    btn.setDepth(10).setInteractive({ useHandCursor: true });

    const btnText = this.add.text(x, btnY, 'SELECT', {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 3,
    }).setOrigin(0.5).setDepth(11);

    btn.on('pointerdown', () => {
      // Flash the card
      bg.setStrokeStyle(2, 0xffffff);
      this.cameras.main.flash(200, 255, 255, 255, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress >= 1) {
          opts.onSelect();
        }
      });
    });
    btn.on('pointerover', () => {
      btn.setFillStyle(hexToNum('#ff8f00'));
      glow.setAlpha(0.15);
      this.tweens.add({
        targets: [bg], scaleX: 1.02, scaleY: 1.01, duration: 150,
      });
    });
    btn.on('pointerout', () => {
      btn.setFillStyle(hexToNum(COLOR_UI_PRIMARY));
      glow.setAlpha(0);
      this.tweens.add({
        targets: [bg], scaleX: 1, scaleY: 1, duration: 150,
      });
    });
  }

  private screenTransitionOut(callback: () => void): void {
    const { width, height } = this.cameras.main;

    // Hexagonal wipe — multiple expanding hexagons
    for (let i = 0; i < 8; i++) {
      const hx = Math.random() * width;
      const hy = Math.random() * height;
      const hex = this.add.circle(hx, hy, 5, 0x0a0a1e);
      hex.setDepth(100);
      this.tweens.add({
        targets: hex,
        scaleX: 80, scaleY: 80,
        duration: 400 + i * 50,
        delay: i * 40,
        ease: 'Power3',
      });
    }

    this.time.delayedCall(700, callback);
  }
}
