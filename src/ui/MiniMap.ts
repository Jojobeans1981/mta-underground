import Phaser from 'phaser';
import { MINIMAP_SIZE, WORLD_WIDTH, WORLD_HEIGHT, HUD_PADDING } from '@/config/constants';
import { hexToNum, COLOR_UI_PRIMARY } from '@/graphics/colors';
import { District, SubwayLine } from '@/types/game.types';

export class MiniMap {
  private container: Phaser.GameObjects.Container;
  private playerDot: Phaser.GameObjects.Container;
  private sweepGraphics: Phaser.GameObjects.Graphics;
  private sweepAngle: number = 0;
  private scene: Phaser.Scene;
  private borderGlow: Phaser.GameObjects.Rectangle;
  private npcBlips: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene, district: District, subwayLines?: SubwayLine[]) {
    this.scene = scene;
    const x = scene.cameras.main.width - MINIMAP_SIZE - HUD_PADDING;
    const y = HUD_PADDING;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(999);

    // Background
    const bg = scene.add.rectangle(
      MINIMAP_SIZE / 2, MINIMAP_SIZE / 2,
      MINIMAP_SIZE, MINIMAP_SIZE,
      0x0a0a1e, 0.85
    );
    bg.setStrokeStyle(1, 0x333366);
    this.container.add(bg);

    // Grid lines
    const grid = scene.add.graphics();
    grid.lineStyle(0.5, 0x222244, 0.3);
    for (let gx = 0; gx < MINIMAP_SIZE; gx += MINIMAP_SIZE / 5) {
      grid.moveTo(gx, 0);
      grid.lineTo(gx, MINIMAP_SIZE);
    }
    for (let gy = 0; gy < MINIMAP_SIZE; gy += MINIMAP_SIZE / 5) {
      grid.moveTo(0, gy);
      grid.lineTo(MINIMAP_SIZE, gy);
    }
    grid.strokePath();
    this.container.add(grid);

    // Draw roads
    for (const seg of district.streetGrid) {
      if (seg.type !== 'road') continue;
      const sx = (seg.start.x / WORLD_WIDTH) * MINIMAP_SIZE;
      const sy = (seg.start.y / WORLD_HEIGHT) * MINIMAP_SIZE;
      const ex = (seg.end.x / WORLD_WIDTH) * MINIMAP_SIZE;
      const ey = (seg.end.y / WORLD_HEIGHT) * MINIMAP_SIZE;
      const line = scene.add.line(0, 0, sx, sy, ex, ey, 0x444466, 0.5);
      line.setOrigin(0, 0).setLineWidth(0.5);
      this.container.add(line);
    }

    // === SUBWAY ROUTE LINES ===
    if (subwayLines && subwayLines.length > 0) {
      const routeGfx = scene.add.graphics();
      for (const line of subwayLines) {
        const color = hexToNum(line.color);
        routeGfx.lineStyle(1.5, color, 0.5);

        for (let i = 0; i < line.stationIds.length - 1; i++) {
          const fromStation = district.stations.find(s => s.id === line.stationIds[i]);
          const toStation = district.stations.find(s => s.id === line.stationIds[i + 1]);
          if (!fromStation || !toStation) continue;

          const fx = (fromStation.position.x / WORLD_WIDTH) * MINIMAP_SIZE;
          const fy = (fromStation.position.y / WORLD_HEIGHT) * MINIMAP_SIZE;
          const tx = (toStation.position.x / WORLD_WIDTH) * MINIMAP_SIZE;
          const ty = (toStation.position.y / WORLD_HEIGHT) * MINIMAP_SIZE;

          routeGfx.moveTo(fx, fy);
          routeGfx.lineTo(tx, ty);
        }
      }
      routeGfx.strokePath();
      this.container.add(routeGfx);
    }

    // Station dots with glow + NAME LABELS
    for (const station of district.stations) {
      const stX = (station.position.x / WORLD_WIDTH) * MINIMAP_SIZE;
      const stY = (station.position.y / WORLD_HEIGHT) * MINIMAP_SIZE;

      // Glow
      const glow = scene.add.circle(stX, stY, 4, hexToNum(COLOR_UI_PRIMARY), 0.15);
      scene.tweens.add({
        targets: glow,
        alpha: { from: 0.1, to: 0.25 },
        scaleX: { from: 0.8, to: 1.3 }, scaleY: { from: 0.8, to: 1.3 },
        duration: 1200, yoyo: true, repeat: -1,
      });
      this.container.add(glow);

      // Dot
      const dot = scene.add.rectangle(stX, stY, 3, 3, hexToNum(COLOR_UI_PRIMARY));
      this.container.add(dot);

      // Station name label — short name, positioned to avoid overlap
      const shortName = this.shortenName(station.name);
      const nameLabel = scene.add.text(stX, stY + 5, shortName, {
        fontSize: '5px',
        color: '#aaaacc',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5, 0);
      this.container.add(nameLabel);
    }

    // Radar sweep
    this.sweepGraphics = scene.add.graphics();
    this.container.add(this.sweepGraphics);

    // Player dot — directional triangle with pulsing ring
    this.playerDot = scene.add.container(0, 0);

    // Pulsing ring
    const ring = scene.add.circle(0, 0, 5, 0x00e5ff, 0);
    ring.setStrokeStyle(0.5, 0x00e5ff, 0.3);
    scene.tweens.add({
      targets: ring,
      scaleX: { from: 0.5, to: 2 }, scaleY: { from: 0.5, to: 2 },
      alpha: { from: 0.4, to: 0 },
      duration: 1500, repeat: -1,
    });
    this.playerDot.add(ring);

    // Player triangle
    const triangle = scene.add.triangle(0, 0, 0, -3, -2, 2, 2, 2, 0x00e5ff);
    this.playerDot.add(triangle);

    // Inner dot
    const innerDot = scene.add.circle(0, 0, 1, 0xffffff, 0.9);
    this.playerDot.add(innerDot);

    this.container.add(this.playerDot);

    // Border glow pulse
    this.borderGlow = scene.add.rectangle(
      MINIMAP_SIZE / 2, MINIMAP_SIZE / 2,
      MINIMAP_SIZE + 2, MINIMAP_SIZE + 2
    );
    this.borderGlow.setStrokeStyle(1, hexToNum(COLOR_UI_PRIMARY), 0.3);
    this.borderGlow.setFillStyle(0x000000, 0);
    this.container.add(this.borderGlow);

    scene.tweens.add({
      targets: this.borderGlow,
      alpha: { from: 0.5, to: 1 },
      duration: 2000, yoyo: true, repeat: -1,
    });

    // Hint label
    const mapLabel = scene.add.text(MINIMAP_SIZE / 2, MINIMAP_SIZE + 4, 'TAB — FULL MAP', {
      fontSize: '5px', color: '#444466', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(mapLabel);
  }

  /** Shorten station names so they fit on the minimap */
  private shortenName(name: string): string {
    // Take the primary part before an en-dash cross-street, trim generic words
    let s = name.split('–')[0].trim()
      .replace(' Station', '')
      .replace(' Terminal', '')
      .replace('Avenue', 'Av');
    if (s.length > 13) s = s.slice(0, 12) + '…';
    return s;
  }

  update(playerX: number, playerY: number): void {
    const mx = (playerX / WORLD_WIDTH) * MINIMAP_SIZE;
    const my = (playerY / WORLD_HEIGHT) * MINIMAP_SIZE;
    this.playerDot.setPosition(mx, my);

    // Radar sweep rotation
    this.sweepAngle += 0.02;
    if (this.sweepAngle > Math.PI * 2) this.sweepAngle -= Math.PI * 2;

    this.sweepGraphics.clear();
    this.sweepGraphics.fillStyle(0x00e5ff, 0.05);
    this.sweepGraphics.slice(
      mx, my, MINIMAP_SIZE * 0.4,
      this.sweepAngle - 0.5, this.sweepAngle, false
    );
    this.sweepGraphics.fillPath();

    // Sweep line
    this.sweepGraphics.lineStyle(0.5, 0x00e5ff, 0.2);
    const lineLen = MINIMAP_SIZE * 0.4;
    this.sweepGraphics.moveTo(mx, my);
    this.sweepGraphics.lineTo(
      mx + Math.cos(this.sweepAngle) * lineLen,
      my + Math.sin(this.sweepAngle) * lineLen
    );
    this.sweepGraphics.strokePath();
  }

  /** Update NPC blips on minimap */
  updateNPCPositions(npcs: { x: number; y: number; type: string }[]): void {
    for (const blip of this.npcBlips) {
      blip.destroy();
    }
    this.npcBlips = [];

    for (const npc of npcs) {
      const bx = (npc.x / WORLD_WIDTH) * MINIMAP_SIZE;
      const by = (npc.y / WORLD_HEIGHT) * MINIMAP_SIZE;
      const color = npc.type === 'fare_evader' ? 0xff4444 :
                    npc.type === 'suspicious' ? 0xffff00 : 0x888888;
      const blip = this.scene.add.circle(bx, by, 1.5, color, 0.6);
      this.container.add(blip);
      this.npcBlips.push(blip);
    }
  }

  show(): void { this.container.setVisible(true); }
  hide(): void { this.container.setVisible(false); }
  getContainer(): Phaser.GameObjects.Container { return this.container; }

  destroy(): void {
    this.sweepGraphics.destroy();
    for (const blip of this.npcBlips) blip.destroy();
    this.container.destroy();
  }
}
