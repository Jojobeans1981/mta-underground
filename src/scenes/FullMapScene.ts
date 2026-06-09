import Phaser from 'phaser';
import { MapManager } from '@/managers/MapManager';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_SURFACE } from '@/graphics/colors';
import { WORLD_WIDTH, WORLD_HEIGHT } from '@/config/constants';
import { Station, SubwayLine } from '@/types/game.types';

/**
 * Full-screen transit map overlay.
 * TAB key opens/closes it. Shows all stations, subway routes,
 * landmarks, and current player position.
 */
export class FullMapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FullMapScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const mapManager = this.game.registry.get('mapManager') as MapManager;
    const district = mapManager.currentDistrict;
    if (!district) { this.scene.stop(); return; }

    const subwayLines = mapManager.subwayLines;

    // Darken background
    const dimBg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85);
    dimBg.setInteractive(); // Block clicks through

    // Map container — center it
    const padding = 40;
    const mapW = width - padding * 2;
    const mapH = height - padding * 2 - 30; // room for title + legend
    const mapX = padding;
    const mapY = padding + 25;

    // Map background
    const mapBg = this.add.rectangle(
      mapX + mapW / 2, mapY + mapH / 2,
      mapW, mapH,
      0x0d0d24, 0.95
    );
    mapBg.setStrokeStyle(1, hexToNum(COLOR_UI_PRIMARY), 0.4);

    // Title
    const title = this.add.text(width / 2, 18, `TRANSIT MAP — ${district.name.toUpperCase()}`, {
      fontSize: '24px',
      color: COLOR_UI_PRIMARY,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Helper: world coords to map coords
    const toMapX = (wx: number) => mapX + (wx / WORLD_WIDTH) * mapW;
    const toMapY = (wy: number) => mapY + (wy / WORLD_HEIGHT) * mapH;

    // Draw grid
    const gridGfx = this.add.graphics();
    gridGfx.lineStyle(0.5, 0x222244, 0.2);
    for (let i = 0; i <= 10; i++) {
      const gx = mapX + (mapW * i) / 10;
      gridGfx.moveTo(gx, mapY);
      gridGfx.lineTo(gx, mapY + mapH);
      const gy = mapY + (mapH * i) / 10;
      gridGfx.moveTo(mapX, gy);
      gridGfx.lineTo(mapX + mapW, gy);
    }
    gridGfx.strokePath();

    // Draw roads (dim)
    const roadGfx = this.add.graphics();
    roadGfx.lineStyle(1, 0x333355, 0.3);
    for (const seg of district.streetGrid) {
      if (seg.type !== 'road') continue;
      roadGfx.moveTo(toMapX(seg.start.x), toMapY(seg.start.y));
      roadGfx.lineTo(toMapX(seg.end.x), toMapY(seg.end.y));
    }
    roadGfx.strokePath();

    // Draw landmarks
    for (const lm of district.landmarks) {
      const lx = toMapX(lm.position.x);
      const ly = toMapY(lm.position.y);
      const lw = (lm.size.width / WORLD_WIDTH) * mapW;
      const lh = (lm.size.height / WORLD_HEIGHT) * mapH;
      const lmRect = this.add.rectangle(lx, ly, Math.max(lw, 8), Math.max(lh, 8), 0x334455, 0.3);
      lmRect.setStrokeStyle(0.5, 0x556677, 0.3);
      const lmLabel = this.add.text(lx, ly + Math.max(lh, 8) / 2 + 3, lm.name, {
        fontSize: '12px', color: '#7a8aa0', align: 'center',
      }).setOrigin(0.5, 0);
    }

    // === SUBWAY ROUTE LINES ===
    const routeGfx = this.add.graphics();
    for (const line of subwayLines) {
      const color = hexToNum(line.color);
      routeGfx.lineStyle(3, color, 0.6);

      for (let i = 0; i < line.stationIds.length - 1; i++) {
        const from = district.stations.find(s => s.id === line.stationIds[i]);
        const to = district.stations.find(s => s.id === line.stationIds[i + 1]);
        if (!from || !to) continue;

        routeGfx.moveTo(toMapX(from.position.x), toMapY(from.position.y));
        routeGfx.lineTo(toMapX(to.position.x), toMapY(to.position.y));
      }
    }
    routeGfx.strokePath();

    // === STATION MARKERS + LABELS ===
    for (const station of district.stations) {
      const sx = toMapX(station.position.x);
      const sy = toMapY(station.position.y);

      // Outer glow
      const glow = this.add.circle(sx, sy, 10, hexToNum(COLOR_UI_PRIMARY), 0.1);
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.05, to: 0.15 },
        scaleX: { from: 0.8, to: 1.3 }, scaleY: { from: 0.8, to: 1.3 },
        duration: 1200, yoyo: true, repeat: -1,
      });

      // Station dot
      const dot = this.add.circle(sx, sy, 5, hexToNum(COLOR_UI_PRIMARY), 0.8);
      dot.setStrokeStyle(1.5, 0xffffff, 0.6);

      // Line "bullets" — colored circles with the real line label, like the real map
      const stationLines = subwayLines.filter(l => l.stationIds.includes(station.id));
      for (let li = 0; li < stationLines.length; li++) {
        const lineColor = hexToNum(stationLines[li].color);
        const bx = sx + 12 + li * 20;
        const bullet = this.add.circle(bx, sy - 2, 8, lineColor, 1);
        bullet.setStrokeStyle(1, 0xffffff, 0.5);
        this.add.text(bx, sy - 2, stationLines[li].name, {
          fontSize: '9px', color: '#ffffff', fontStyle: 'bold',
        }).setOrigin(0.5);
      }

      // Station name
      const nameLabel = this.add.text(sx, sy + 12, station.name, {
        fontSize: '17px',
        color: '#eef0ff',
        fontStyle: 'bold',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5, 0);

      // Connections count
      if (station.connections.length > 0) {
        this.add.text(sx, sy + 32, `${station.connections.length} connection${station.connections.length > 1 ? 's' : ''}`, {
          fontSize: '11px', color: '#8888aa',
        }).setOrigin(0.5, 0);
      }
    }

    // === PLAYER POSITION ===
    const playerPos = this.game.registry.get('playerPos') as { x: number; y: number } | undefined;
    if (playerPos) {
      const px = toMapX(playerPos.x);
      const py = toMapY(playerPos.y);

      // Pulsing ring
      const ring = this.add.circle(px, py, 10, 0x00e5ff, 0);
      ring.setStrokeStyle(1, 0x00e5ff, 0.4);
      this.tweens.add({
        targets: ring,
        scaleX: { from: 0.5, to: 2 }, scaleY: { from: 0.5, to: 2 },
        alpha: { from: 0.5, to: 0 },
        duration: 1200, repeat: -1,
      });

      // Player marker
      const playerMarker = this.add.circle(px, py, 4, 0x00e5ff, 0.9);
      playerMarker.setStrokeStyle(1.5, 0xffffff, 0.8);

      // "YOU" label
      this.add.text(px, py - 12, 'YOU', {
        fontSize: '13px', color: '#00e5ff', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 1);
    }

    // === LEGEND ===
    const legendY = height - 22;
    let legendX = padding;
    for (const line of subwayLines) {
      const bullet = this.add.circle(legendX + 7, legendY, 9, hexToNum(line.color), 1);
      bullet.setStrokeStyle(1, 0xffffff, 0.5);
      this.add.text(legendX + 7, legendY, line.name.split('·')[0], {
        fontSize: '10px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);
      const label = this.add.text(legendX + 20, legendY, `${line.name} Train`, {
        fontSize: '13px', color: '#aab',
      }).setOrigin(0, 0.5);
      legendX += label.width + 36;
    }

    // Close hint
    this.add.text(width - padding, legendY, 'Press TAB or ESC to close', {
      fontSize: '12px', color: '#667',
    }).setOrigin(1, 0.5);

    // === CLOSE HANDLERS ===
    if (this.input.keyboard) {
      const tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
      tabKey.on('down', () => this.closeMap());

      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => this.closeMap());
    }

    // Fade in
    this.cameras.main.fadeIn(200);
  }

  private closeMap(): void {
    this.cameras.main.fadeOut(150);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
    });
  }
}
