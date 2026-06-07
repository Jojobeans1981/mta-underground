import Phaser from 'phaser';
import { District, Station } from '@/types/game.types';
import {
  hexToNum,
  COLOR_ASPHALT,
  COLOR_SIDEWALK,
  COLOR_BUILDING_1,
  COLOR_BUILDING_2,
  COLOR_BUILDING_3,
  COLOR_BUILDING_4,
  COLOR_GRASS,
  COLOR_TREE,
  COLOR_UI_SECONDARY,
  COLOR_UI_PRIMARY,
} from '@/graphics/colors';
import { STATION_ENTRANCE_SIZE } from '@/config/constants';

const BUILDING_COLORS = [COLOR_BUILDING_1, COLOR_BUILDING_2, COLOR_BUILDING_3, COLOR_BUILDING_4];

export class TileRenderer {
  static renderDistrict(scene: Phaser.Scene, district: District): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    const b = district.bounds;

    // 1. Dark ground
    const bg = scene.add.rectangle(b.x + b.width / 2, b.y + b.height / 2, b.width, b.height, 0x111118);
    container.add(bg);

    // 2. Streets with details
    for (const seg of district.streetGrid) {
      const isHorizontal = Math.abs(seg.start.y - seg.end.y) < 1;

      let rx: number, ry: number, rw: number, rh: number;
      if (isHorizontal) {
        const minX = Math.min(seg.start.x, seg.end.x);
        const maxX = Math.max(seg.start.x, seg.end.x);
        rx = (minX + maxX) / 2;
        ry = seg.start.y;
        rw = maxX - minX;
        rh = seg.width;
      } else {
        const minY = Math.min(seg.start.y, seg.end.y);
        const maxY = Math.max(seg.start.y, seg.end.y);
        rx = seg.start.x;
        ry = (minY + maxY) / 2;
        rw = seg.width;
        rh = maxY - minY;
      }

      if (seg.type === 'road') {
        // Asphalt with subtle texture variation
        const road = scene.add.rectangle(rx, ry, rw, rh, 0x2a2a2a);
        container.add(road);

        // Subtle road texture (random dark spots)
        for (let t = 0; t < Math.floor((rw + rh) / 20); t++) {
          const tx = rx + (Math.random() - 0.5) * (isHorizontal ? rw * 0.9 : rw * 0.6);
          const ty = ry + (Math.random() - 0.5) * (isHorizontal ? rh * 0.6 : rh * 0.9);
          const spot = scene.add.rectangle(tx, ty, 2 + Math.random() * 3, 1, 0x222222, 0.3);
          container.add(spot);
        }

        // Center lane marking (dashed yellow line)
        if (isHorizontal) {
          for (let dx = -rw / 2 + 5; dx < rw / 2; dx += 16) {
            const dash = scene.add.rectangle(rx + dx, ry, 8, 1, 0xccaa00, 0.5);
            container.add(dash);
          }
        } else {
          for (let dy = -rh / 2 + 5; dy < rh / 2; dy += 16) {
            const dash = scene.add.rectangle(rx, ry + dy, 1, 8, 0xccaa00, 0.5);
            container.add(dash);
          }
        }

        // Road edge lines (white)
        if (isHorizontal) {
          container.add(scene.add.rectangle(rx, ry - rh / 2 + 0.5, rw, 1, 0xffffff, 0.15));
          container.add(scene.add.rectangle(rx, ry + rh / 2 - 0.5, rw, 1, 0xffffff, 0.15));
        } else {
          container.add(scene.add.rectangle(rx - rw / 2 + 0.5, ry, 1, rh, 0xffffff, 0.15));
          container.add(scene.add.rectangle(rx + rw / 2 - 0.5, ry, 1, rh, 0xffffff, 0.15));
        }
      } else {
        // Sidewalk
        const sw = scene.add.rectangle(rx, ry, rw, rh, hexToNum(COLOR_SIDEWALK));
        container.add(sw);

        // Curb edge
        if (isHorizontal) {
          container.add(scene.add.rectangle(rx, ry - rh / 2, rw, 0.5, 0x666666, 0.4));
        } else {
          container.add(scene.add.rectangle(rx - rw / 2, ry, 0.5, rh, 0x666666, 0.4));
        }
      }
    }

    // 2b. Crosswalks at major intersections
    const horizontalYs = [150, 250, 350, 450, 550, 650, 750];
    const verticalXs = [150, 300, 500, 700, 850];
    for (const hY of horizontalYs) {
      for (const vX of verticalXs) {
        for (let i = -3; i <= 3; i++) {
          container.add(scene.add.rectangle(vX + i * 4, hY - 22, 2, 6, 0xffffff, 0.3));
          container.add(scene.add.rectangle(vX + i * 4, hY + 22, 2, 6, 0xffffff, 0.3));
          container.add(scene.add.rectangle(vX - 22, hY + i * 4, 6, 2, 0xffffff, 0.3));
          container.add(scene.add.rectangle(vX + 22, hY + i * 4, 6, 2, 0xffffff, 0.3));
        }
      }
    }

    // 3. Buildings with windows, rooftop details, and AC units
    for (let i = 0; i < verticalXs.length - 1; i++) {
      for (let j = 0; j < horizontalYs.length - 1; j++) {
        const left = verticalXs[i] + 30;
        const right = verticalXs[i + 1] - 30;
        const top = horizontalYs[j] + 30;
        const bottom = horizontalYs[j + 1] - 30;
        if (right <= left || bottom <= top) continue;

        const cx = (left + right) / 2;
        const cy = (top + bottom) / 2;
        const bw = right - left;
        const bh = bottom - top;

        let skip = false;
        for (const lm of district.landmarks) {
          const lx = lm.position.x - lm.size.width / 2;
          const rx2 = lm.position.x + lm.size.width / 2;
          const ty = lm.position.y - lm.size.height / 2;
          const by = lm.position.y + lm.size.height / 2;
          if (cx > lx && cx < rx2 && cy > ty && cy < by) { skip = true; break; }
        }
        if (skip) continue;

        const colorIdx = (i + j) % BUILDING_COLORS.length;
        const bColor = hexToNum(BUILDING_COLORS[colorIdx]);
        const darkEdge = Phaser.Display.Color.IntegerToColor(bColor).darken(20).color;
        const roofColor = Phaser.Display.Color.IntegerToColor(bColor).darken(30).color;

        // Building body
        const building = scene.add.rectangle(cx, cy, bw, bh, bColor);
        container.add(building);

        // 3D depth edges
        container.add(scene.add.rectangle(cx - bw / 2 + 0.5, cy, 1, bh, darkEdge));
        container.add(scene.add.rectangle(cx + bw / 2 - 0.5, cy, 1, bh, darkEdge));

        // Roof line with accent
        container.add(scene.add.rectangle(cx, cy - bh / 2 + 1, bw, 2, roofColor));

        // Rooftop details (AC units, water towers)
        if ((i + j) % 3 === 0 && bw > 30) {
          // Water tower
          container.add(scene.add.rectangle(cx + bw * 0.25, cy - bh / 2 + 4, 5, 6, 0x5d4037, 0.6));
          container.add(scene.add.rectangle(cx + bw * 0.25, cy - bh / 2 + 2, 6, 2, 0x8d6e63, 0.5));
        }
        if ((i + j) % 2 === 0 && bw > 25) {
          // AC unit
          container.add(scene.add.rectangle(cx - bw * 0.3, cy - bh / 2 + 3, 4, 3, 0x78909c, 0.5));
        }

        // Windows
        const winW = 3;
        const winH = 4;
        const colCount = Math.floor((bw - 6) / 8);
        const rowCount = Math.floor((bh - 8) / 8);

        for (let wr = 0; wr < rowCount; wr++) {
          for (let wc = 0; wc < colCount; wc++) {
            const wx = cx - bw / 2 + 5 + wc * 8;
            const wy = cy - bh / 2 + 6 + wr * 8;
            const lit = ((wr * 7 + wc * 13 + i * 3 + j * 5) % 5) < 3;
            const winCol = lit ? 0xfff9c4 : 0x333344;
            const winAlpha = lit ? 0.6 : 0.3;
            container.add(scene.add.rectangle(wx, wy, winW, winH, winCol, winAlpha));
          }
        }

        // Awning on ground floor (some buildings)
        if ((i + j * 2) % 4 === 0 && bh > 30) {
          const awningColor = [0xe53935, 0x43a047, 0x1e88e5, 0xff8f00][Math.abs(i * 3 + j) % 4];
          container.add(scene.add.rectangle(cx, cy + bh / 2 - 3, bw * 0.6, 3, awningColor, 0.5));
        }
      }
    }

    // 4. Landmarks with better rendering
    for (const lm of district.landmarks) {
      const lmColor = hexToNum(lm.spriteConfig.primaryColor);

      if (lm.id.includes('park') || lm.id.includes('green') || lm.id.includes('garden')) {
        const park = scene.add.rectangle(lm.position.x, lm.position.y, lm.size.width, lm.size.height, hexToNum(COLOR_GRASS));
        park.setStrokeStyle(1, 0x1b4d2e);
        container.add(park);

        // Walking path
        container.add(scene.add.rectangle(
          lm.position.x, lm.position.y,
          lm.size.width * 0.6, 3, 0x8d6e63, 0.5
        ));
        // Cross path
        container.add(scene.add.rectangle(
          lm.position.x, lm.position.y,
          3, lm.size.height * 0.5, 0x8d6e63, 0.4
        ));

        // Trees
        const treeCount = Math.floor(lm.size.width / 12);
        for (let t = 0; t < treeCount; t++) {
          const tx = lm.position.x - lm.size.width / 2 + 8 + t * 12;
          const ty = lm.position.y + (t % 2 === 0 ? -10 : 10);
          // Shadow
          container.add(scene.add.ellipse(tx + 1, ty + 3, 7, 3, 0x000000, 0.1));
          // Tree layers
          container.add(scene.add.circle(tx, ty, 4, hexToNum(COLOR_TREE), 0.8));
          container.add(scene.add.circle(tx, ty - 1, 3, 0x388e3c, 0.6));
          container.add(scene.add.circle(tx - 1, ty - 1, 2, 0x43a047, 0.4));
        }

        // Park benches
        if (lm.size.width > 30) {
          container.add(scene.add.rectangle(lm.position.x - 8, lm.position.y + 4, 6, 2, 0x5d4037, 0.6));
          container.add(scene.add.rectangle(lm.position.x + 8, lm.position.y - 4, 6, 2, 0x5d4037, 0.6));
        }
      } else if (lm.spriteConfig.shape === 'circle') {
        const circle = scene.add.circle(lm.position.x, lm.position.y, lm.size.width / 2, lmColor);
        circle.setStrokeStyle(1, Phaser.Display.Color.IntegerToColor(lmColor).darken(20).color);
        container.add(circle);
      } else {
        const lmRect = scene.add.rectangle(lm.position.x, lm.position.y, lm.size.width, lm.size.height, lmColor);
        lmRect.setStrokeStyle(1, Phaser.Display.Color.IntegerToColor(lmColor).darken(20).color);
        container.add(lmRect);
      }

      // Name label (render at 8x for crisp text, scale down)
      const label = scene.add.text(lm.position.x, lm.position.y + lm.size.height / 2 + 5, lm.name, {
        fontSize: '24px', color: '#999999', align: 'center',
      }).setOrigin(0.5).setScale(0.125);
      container.add(label);
    }

    // 5. Streetlights along avenues — with animated glow
    for (const vX of verticalXs) {
      for (let y = 100; y < 900; y += 50) {
        // Pole
        container.add(scene.add.rectangle(vX + 22, y, 1, 5, 0x888888, 0.4));
        // Light fixture
        container.add(scene.add.rectangle(vX + 22, y - 3, 3, 1, 0x888888, 0.3));

        // Light glow (animated)
        const glow = scene.add.circle(vX + 22, y - 2, 3, 0xfff9c4, 0.12);
        container.add(glow);
        scene.tweens.add({
          targets: glow,
          alpha: { from: 0.08, to: 0.18 },
          scaleX: { from: 0.8, to: 1.2 }, scaleY: { from: 0.8, to: 1.2 },
          duration: 2000 + Math.random() * 1000,
          yoyo: true, repeat: -1,
        });

        // Ground light pool
        container.add(scene.add.ellipse(vX + 22, y + 4, 10, 5, 0xfff9c4, 0.04));
      }
    }

    // 5b. Trash cans and fire hydrants along sidewalks
    for (let y = 180; y < 780; y += 100) {
      for (const vX of verticalXs) {
        if (Math.random() < 0.4) {
          // Fire hydrant
          container.add(scene.add.rectangle(vX - 18, y, 2, 3, 0xf44336, 0.6));
          container.add(scene.add.rectangle(vX - 18, y - 1, 3, 1, 0xf44336, 0.5));
        }
        if (Math.random() < 0.3) {
          // Trash can
          container.add(scene.add.rectangle(vX + 18, y + 25, 3, 4, 0x424242, 0.5));
          container.add(scene.add.rectangle(vX + 18, y + 23, 4, 1, 0x616161, 0.4));
        }
      }
    }

    // 6. Station entrances with enhanced glow
    for (const station of district.stations) {
      for (const entrance of station.entrances) {
        // Subtle ground glow under station
        const groundGlow = scene.add.circle(entrance.x, entrance.y, 15, hexToNum(COLOR_UI_PRIMARY), 0.05);
        container.add(groundGlow);
        scene.tweens.add({
          targets: groundGlow,
          alpha: { from: 0.03, to: 0.08 },
          scaleX: { from: 0.9, to: 1.1 }, scaleY: { from: 0.9, to: 1.1 },
          duration: 1500, yoyo: true, repeat: -1,
        });

        const ent = scene.add.image(entrance.x, entrance.y, 'station_entrance');
        container.add(ent);
      }

      // Station name
      // Station name (render at 8x for crisp text, scale down)
      const nameLabel = scene.add.text(
        station.position.x,
        station.entrances[0].y + STATION_ENTRANCE_SIZE / 2 + 4,
        station.name,
        { fontSize: '24px', color: '#ffffff', align: 'center', fontStyle: 'bold' }
      ).setOrigin(0.5).setScale(0.125);
      container.add(nameLabel);
    }

    return container;
  }

  static renderStationMarkers(scene: Phaser.Scene, stations: Station[]): Phaser.GameObjects.Container {
    const container = scene.add.container(0, 0);
    for (const station of stations) {
      // Outer pulse ring
      const ring = scene.add.circle(station.position.x, station.position.y, 8, hexToNum(COLOR_UI_PRIMARY), 0);
      ring.setStrokeStyle(0.5, hexToNum(COLOR_UI_PRIMARY), 0.3);
      scene.tweens.add({
        targets: ring,
        scaleX: { from: 0.5, to: 1.5 }, scaleY: { from: 0.5, to: 1.5 },
        alpha: { from: 0.3, to: 0 },
        duration: 1500, repeat: -1,
      });
      container.add(ring);

      // Core marker
      const marker = scene.add.circle(station.position.x, station.position.y, 5, hexToNum(COLOR_UI_PRIMARY), 0.4);
      scene.tweens.add({
        targets: marker,
        alpha: { from: 0.3, to: 0.6 },
        scaleX: { from: 0.9, to: 1.1 }, scaleY: { from: 0.9, to: 1.1 },
        duration: 800, yoyo: true, repeat: -1,
      });
      container.add(marker);

      // Inner bright dot
      const dot = scene.add.circle(station.position.x, station.position.y, 2, 0xffffff, 0.5);
      container.add(dot);
    }
    return container;
  }
}
