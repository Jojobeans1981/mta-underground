import Phaser from 'phaser';
import { SaveManager } from '@/managers/SaveManager';
import { AudioManager } from '@/managers/AudioManager';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_BACKGROUND, COLOR_UI_SURFACE } from '@/graphics/colors';

/** Animated subway line — draws itself across the screen */
interface SubwayLine {
  graphics: Phaser.GameObjects.Graphics;
  points: { x: number; y: number }[];
  color: number;
  progress: number; // 0-1
  speed: number;
  drawn: boolean;
}

export class MainMenuScene extends Phaser.Scene {
  private subwayLines: SubwayLine[] = [];
  private particleTimer: number = 0;
  private glowPulse: number = 0;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const saveManager = this.game.registry.get('saveManager') as SaveManager;
    const audioManager = this.game.registry.get('audioManager') as AudioManager;

    audioManager?.playMusic('menu_theme');
    this.cameras.main.setBackgroundColor(COLOR_UI_BACKGROUND);

    // === ANIMATED SUBWAY MAP BACKGROUND ===
    this.createSubwayMapBackground(width, height);

    // === FLOATING PARTICLES ===
    this.createAmbientParticles(width, height);

    // === VIGNETTE OVERLAY ===
    this.createVignette(width, height);

    // === ANIMATED TITLE ===
    // "MTA" — each letter drops in with bounce
    const mtaLetters = ['M', 'T', 'A'];
    const mtaTexts: Phaser.GameObjects.Text[] = [];
    const letterSpacing = 60;
    const startX = width / 2 - letterSpacing;

    mtaLetters.forEach((letter, i) => {
      const t = this.add.text(startX + i * letterSpacing, -80, letter, {
        fontSize: '72px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(10);

      this.tweens.add({
        targets: t,
        y: height * 0.16,
        duration: 600,
        delay: i * 150,
        ease: 'Bounce.easeOut',
      });

      mtaTexts.push(t);
    });

    // Title glow pulse
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: () => {
        for (const t of mtaTexts) {
          this.tweens.add({
            targets: t,
            scaleX: { from: 1, to: 1.05 },
            scaleY: { from: 1, to: 1.05 },
            duration: 300,
            yoyo: true,
          });
        }
      },
    });

    // "UNDERGROUND" — slides in from left with typewriter feel
    const underground = this.add.text(-300, height * 0.27, 'UNDERGROUND', {
      fontSize: '30px', color: '#ffffff', fontStyle: 'bold', letterSpacing: 8,
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: underground, x: width / 2,
      duration: 800, delay: 500, ease: 'Power3',
    });

    // Neon glow bar under "UNDERGROUND"
    const neonBar = this.add.rectangle(width / 2, height * 0.33, 0, 2, hexToNum(COLOR_UI_PRIMARY));
    neonBar.setDepth(10);
    this.tweens.add({
      targets: neonBar, displayWidth: 360,
      duration: 600, delay: 1000, ease: 'Power2',
    });

    // Neon glow effect on the bar
    const neonGlow = this.add.rectangle(width / 2, height * 0.33, 360, 8, hexToNum(COLOR_UI_PRIMARY), 0.15);
    neonGlow.setDepth(9);
    this.tweens.add({
      targets: neonGlow,
      alpha: { from: 0.1, to: 0.3 },
      displayWidth: { from: 340, to: 380 },
      duration: 1000, yoyo: true, repeat: -1,
    });

    // Tagline — fades in
    const tagline = this.add.text(width / 2, height * 0.37, 'TRANSIT NEVER SLEEPS', {
      fontSize: '12px', color: COLOR_UI_PRIMARY, fontStyle: 'bold', letterSpacing: 4,
    }).setOrigin(0.5).setAlpha(0).setDepth(10);

    this.tweens.add({
      targets: tagline, alpha: 1, duration: 600, delay: 1300,
    });

    // === TRAIN ANIMATION — silhouette zooms across ===
    this.createTrainAnimation(width, height);

    // === BUTTONS — slide in from right ===
    const buttonW = 280;
    const buttonH = 50;
    const buttonY = height * 0.54;
    const buttonSpacing = 64;

    this.createAnimatedButton(width / 2, buttonY, buttonW, buttonH, 'NEW GAME', 1500, () => {
      saveManager.deleteSave();
      this.screenTransitionOut(() => this.scene.start('CharacterSelectScene'));
    });

    if (saveManager.hasSave()) {
      this.createAnimatedButton(width / 2, buttonY + buttonSpacing, buttonW, buttonH, 'CONTINUE', 1650, () => {
        this.screenTransitionOut(() => this.scene.start('GameScene'));
      });
    }

    const settingsIdx = saveManager.hasSave() ? 2 : 1;
    this.createAnimatedButton(
      width / 2, buttonY + buttonSpacing * settingsIdx,
      buttonW, buttonH, 'SETTINGS', 1500 + settingsIdx * 150, () => {}, true
    );

    // === BOTTOM INFO BAR ===
    this.add.text(width / 2, height - 40, '🚇 NEW YORK CITY 🗽', {
      fontSize: '10px', color: '#444466', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(width / 2, height - 22, 'v0.2.0  •  FREE TO PLAY', {
      fontSize: '9px', color: '#333355',
    }).setOrigin(0.5).setDepth(10);

    this.cameras.main.fadeIn(300);
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // Animate subway lines drawing themselves
    for (const line of this.subwayLines) {
      if (line.drawn) continue;
      line.progress += line.speed * dt;
      if (line.progress >= 1) {
        line.progress = 1;
        line.drawn = true;
      }
      this.drawSubwayLine(line);
    }

    // Floating particle spawn
    this.particleTimer -= dt;
    if (this.particleTimer <= 0) {
      this.particleTimer = 0.3 + Math.random() * 0.5;
      this.spawnFloatingDot();
    }
  }

  // === SUBWAY MAP BACKGROUND ===

  private createSubwayMapBackground(width: number, height: number): void {
    const lineConfigs = [
      { color: 0xff4444, points: this.generateLinePoints(width, height, 0.2, 0.3) },
      { color: 0x4444ff, points: this.generateLinePoints(width, height, 0.5, 0.6) },
      { color: 0x44ff44, points: this.generateLinePoints(width, height, 0.7, 0.8) },
      { color: 0xffff44, points: this.generateLinePoints(width, height, 0.35, 0.45) },
      { color: 0xff8800, points: this.generateLinePoints(width, height, 0.6, 0.15) },
      { color: 0xff44ff, points: this.generateLinePoints(width, height, 0.85, 0.5) },
    ];

    for (const config of lineConfigs) {
      const graphics = this.add.graphics().setDepth(1).setAlpha(0.12);
      this.subwayLines.push({
        graphics,
        points: config.points,
        color: config.color,
        progress: 0,
        speed: 0.3 + Math.random() * 0.4,
        drawn: false,
      });
    }

    // Station dots at intersections
    for (const config of lineConfigs) {
      for (const p of config.points) {
        if (Math.random() < 0.3) {
          const dot = this.add.circle(p.x, p.y, 3, config.color, 0.08);
          dot.setDepth(2);
          this.tweens.add({
            targets: dot,
            alpha: { from: 0.05, to: 0.15 },
            scaleX: { from: 0.8, to: 1.3 },
            scaleY: { from: 0.8, to: 1.3 },
            duration: 1500 + Math.random() * 1000,
            yoyo: true, repeat: -1,
          });
        }
      }
    }
  }

  private generateLinePoints(
    width: number, height: number,
    startXFrac: number, startYFrac: number
  ): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    let x = width * startXFrac;
    let y = height * startYFrac;
    points.push({ x, y });

    const segments = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < segments; i++) {
      const horizontal = Math.random() > 0.5;
      if (horizontal) {
        x += (Math.random() - 0.5) * width * 0.4;
      } else {
        y += (Math.random() - 0.5) * height * 0.4;
      }
      x = Phaser.Math.Clamp(x, 20, width - 20);
      y = Phaser.Math.Clamp(y, 20, height - 20);
      points.push({ x, y });
    }
    return points;
  }

  private drawSubwayLine(line: SubwayLine): void {
    line.graphics.clear();
    line.graphics.lineStyle(2, line.color, 1);

    const totalPoints = line.points.length;
    const drawUpTo = Math.floor(line.progress * (totalPoints - 1));
    const frac = (line.progress * (totalPoints - 1)) - drawUpTo;

    line.graphics.beginPath();
    line.graphics.moveTo(line.points[0].x, line.points[0].y);

    for (let i = 1; i <= drawUpTo; i++) {
      line.graphics.lineTo(line.points[i].x, line.points[i].y);
    }

    // Partial segment
    if (drawUpTo < totalPoints - 1) {
      const p1 = line.points[drawUpTo];
      const p2 = line.points[drawUpTo + 1];
      const ix = p1.x + (p2.x - p1.x) * frac;
      const iy = p1.y + (p2.y - p1.y) * frac;
      line.graphics.lineTo(ix, iy);
    }

    line.graphics.strokePath();
  }

  // === AMBIENT PARTICLES ===

  private createAmbientParticles(width: number, height: number): void {
    // Initial batch
    for (let i = 0; i < 20; i++) {
      this.createStaticDot(width, height);
    }
  }

  private createStaticDot(width: number, height: number): void {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const dot = this.add.circle(x, y, 1, 0xffffff, 0.05 + Math.random() * 0.08);
    dot.setDepth(3);
    this.tweens.add({
      targets: dot,
      alpha: { from: dot.alpha, to: 0 },
      y: y - 30 - Math.random() * 50,
      duration: 4000 + Math.random() * 3000,
      onComplete: () => dot.destroy(),
    });
  }

  private spawnFloatingDot(): void {
    const { width, height } = this.cameras.main;
    const x = Math.random() * width;
    const dot = this.add.circle(x, height + 5, 1, 0xffffff, 0.06);
    dot.setDepth(3);
    this.tweens.add({
      targets: dot,
      y: -5,
      alpha: 0,
      duration: 5000 + Math.random() * 3000,
      onComplete: () => dot.destroy(),
    });
  }

  // === TRAIN ANIMATION ===

  private createTrainAnimation(width: number, height: number): void {
    const trainY = height * 0.82;

    // Create repeating train
    this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => {
        const trainContainer = this.add.container(-250, trainY).setDepth(5);

        // Cars
        for (let c = 0; c < 5; c++) {
          const car = this.add.rectangle(c * 42, 0, 40, 10, 0x607d8b, 0.15);
          car.setStrokeStyle(0.5, 0x90a4ae, 0.1);
          trainContainer.add(car);

          // Windows
          for (let w = 0; w < 6; w++) {
            const win = this.add.rectangle(
              c * 42 - 15 + w * 6, -1, 3, 3, 0xfff9c4, 0.08
            );
            trainContainer.add(win);
          }
        }

        // Headlight
        const headlight = this.add.circle(4 * 42 + 22, 0, 3, 0xfff9c4, 0.15);
        trainContainer.add(headlight);

        this.tweens.add({
          targets: trainContainer,
          x: width + 250,
          duration: 3000,
          ease: 'Linear',
          onComplete: () => trainContainer.destroy(),
        });
      },
    });

    // Track line
    this.add.rectangle(width / 2, trainY + 8, width, 1, 0x333355, 0.3).setDepth(4);
    this.add.rectangle(width / 2, trainY - 8, width, 1, 0x333355, 0.3).setDepth(4);
  }

  // === VIGNETTE ===

  private createVignette(width: number, height: number): void {
    const g = this.add.graphics().setDepth(8);
    const steps = 10;
    for (let i = 0; i < steps; i++) {
      const alpha = (i / steps) * 0.4;
      const shrink = i * (Math.min(width, height) / (steps * 2.5));
      g.fillStyle(0x000000, alpha);
      g.fillRect(0, 0, width, shrink);
      g.fillRect(0, height - shrink, width, shrink);
      g.fillRect(0, 0, shrink, height);
      g.fillRect(width - shrink, 0, shrink, height);
    }
  }

  // === BUTTONS ===

  private createAnimatedButton(
    x: number, y: number, w: number, h: number,
    label: string, delay: number, callback: () => void, dimmed: boolean = false
  ): void {
    // Slide in from right
    const startX = x + 400;

    const bg = this.add.rectangle(startX, y, w, h,
      hexToNum(dimmed ? COLOR_UI_SURFACE : COLOR_UI_PRIMARY), dimmed ? 0.5 : 1);
    bg.setStrokeStyle(1, dimmed ? 0x444444 : 0xffffff);
    bg.setDepth(10);

    // Subtle gradient overlay
    if (!dimmed) {
      const gradient = this.add.rectangle(startX, y - h * 0.2, w, h * 0.4, 0xffffff, 0.08);
      gradient.setDepth(11);
      this.tweens.add({
        targets: gradient, x, duration: 500, delay, ease: 'Back.easeOut',
      });
    }

    const text = this.add.text(startX, y, label, {
      fontSize: '18px', color: dimmed ? '#666666' : '#ffffff',
      fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5).setDepth(12);

    // Slide in animation
    this.tweens.add({
      targets: bg, x, duration: 500, delay, ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: text, x, duration: 500, delay: delay + 30, ease: 'Back.easeOut',
    });

    if (!dimmed) {
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        this.tweens.add({
          targets: [bg, text], scaleX: 0.95, scaleY: 0.95,
          duration: 60, yoyo: true, onComplete: () => callback(),
        });
      });
      bg.on('pointerover', () => {
        bg.setFillStyle(hexToNum('#ff8f00'));
        this.tweens.add({
          targets: bg, scaleX: 1.03, scaleY: 1.03,
          duration: 100, ease: 'Power2',
        });
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(hexToNum(COLOR_UI_PRIMARY));
        this.tweens.add({
          targets: bg, scaleX: 1, scaleY: 1,
          duration: 100, ease: 'Power2',
        });
      });
    }
  }

  // === SCREEN TRANSITION ===

  private screenTransitionOut(callback: () => void): void {
    const { width, height } = this.cameras.main;

    // Horizontal wipe with subway-door effect
    const left = this.add.rectangle(0, height / 2, 0, height, 0x111118);
    left.setOrigin(0, 0.5).setDepth(100);
    const right = this.add.rectangle(width, height / 2, 0, height, 0x111118);
    right.setOrigin(1, 0.5).setDepth(100);

    this.tweens.add({
      targets: left, displayWidth: width / 2 + 5,
      duration: 500, ease: 'Power3',
    });
    this.tweens.add({
      targets: right, displayWidth: width / 2 + 5,
      duration: 500, ease: 'Power3',
      onComplete: () => callback(),
    });
  }
}
