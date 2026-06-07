import Phaser from 'phaser';
import {
  hexToNum,
  COLOR_POLICE_UNIFORM,
  COLOR_POLICE_CAP,
  COLOR_CIVILIAN_1,
  COLOR_CIVILIAN_2,
  COLOR_CIVILIAN_3,
  COLOR_CIVILIAN_4,
  COLOR_FARE_EVADER,
  COLOR_BUILDING_1,
  COLOR_BUILDING_2,
  COLOR_BUILDING_3,
  COLOR_BUILDING_4,
  COLOR_TREE,
  COLOR_UI_SECONDARY,
  COLOR_UI_PRIMARY,
} from '@/graphics/colors';
import {
  PLAYER_SIZE,
  NPC_SIZE,
  JOYSTICK_RADIUS,
  JOYSTICK_THUMB_RADIUS,
  ACTION_BUTTON_SIZE,
  STATION_ENTRANCE_SIZE,
} from '@/config/constants';

// Render characters at 4x resolution for crisp display when camera zooms in.
// Game entities scale them down to world-size (PLAYER_SIZE / SPRITE_RES).
export const SPRITE_RES = 48; // Pixels per character texture
export const NPC_SPRITE_RES = 40;

export class SpriteFactory {
  static generateAllTextures(scene: Phaser.Scene): void {
    // Characters at high resolution
    SpriteFactory.createPersonSprite(scene, 'player_police', SPRITE_RES,
      hexToNum(COLOR_POLICE_UNIFORM), hexToNum(COLOR_POLICE_CAP), 0xffc107, true);
    SpriteFactory.createPersonSprite(scene, 'player_rider', SPRITE_RES,
      hexToNum('#546e7a'), hexToNum('#37474f'), 0, false);
    SpriteFactory.createPersonSprite(scene, 'player_driver', SPRITE_RES,
      hexToNum('#0d47a1'), hexToNum('#ff6f00'), 0, false);

    // Civilian NPCs at high resolution
    SpriteFactory.createPersonSprite(scene, 'npc_civilian_1', NPC_SPRITE_RES,
      hexToNum(COLOR_CIVILIAN_1), hexToNum('#4e342e'), 0, false);
    SpriteFactory.createPersonSprite(scene, 'npc_civilian_2', NPC_SPRITE_RES,
      hexToNum(COLOR_CIVILIAN_2), hexToNum('#37474f'), 0, false);
    SpriteFactory.createPersonSprite(scene, 'npc_civilian_3', NPC_SPRITE_RES,
      hexToNum(COLOR_CIVILIAN_3), hexToNum('#bf360c'), 0, false);
    SpriteFactory.createPersonSprite(scene, 'npc_civilian_4', NPC_SPRITE_RES,
      hexToNum(COLOR_CIVILIAN_4), hexToNum('#6a1b9a'), 0, false);

    // Mission NPCs
    SpriteFactory.createPersonSprite(scene, 'npc_fare_evader', NPC_SPRITE_RES,
      hexToNum(COLOR_FARE_EVADER), hexToNum('#b71c1c'), 0, false);
    SpriteFactory.createPersonSprite(scene, 'npc_suspicious', NPC_SPRITE_RES,
      hexToNum('#37474f'), hexToNum('#263238'), 0, false);

    // Station entrance — stairs look
    SpriteFactory.createStationEntrance(scene);

    // Buildings — with window patterns
    SpriteFactory.createBuildingTexture(scene, 'building_1', 24, 24, hexToNum(COLOR_BUILDING_1));
    SpriteFactory.createBuildingTexture(scene, 'building_2', 24, 24, hexToNum(COLOR_BUILDING_2));
    SpriteFactory.createBuildingTexture(scene, 'building_3', 24, 24, hexToNum(COLOR_BUILDING_3));
    SpriteFactory.createBuildingTexture(scene, 'building_4', 24, 24, hexToNum(COLOR_BUILDING_4));

    // Tree — layered circles for canopy look
    SpriteFactory.createTreeTexture(scene);

    // UI
    SpriteFactory.createCircleTexture(scene, 'joystick_base', JOYSTICK_RADIUS, 0xffffff);
    SpriteFactory.createCircleTexture(scene, 'joystick_thumb', JOYSTICK_THUMB_RADIUS, 0xffffff);
    SpriteFactory.createCircleTexture(scene, 'action_button', Math.floor(ACTION_BUTTON_SIZE / 2), hexToNum(COLOR_UI_PRIMARY));
    SpriteFactory.createRectTexture(scene, 'minimap_player', 4, 4, 0xffffff);
    SpriteFactory.createRectTexture(scene, 'minimap_station', 4, 4, hexToNum(COLOR_UI_SECONDARY));
  }

  /**
   * Top-down person sprite. Head is the most prominent feature (viewed from above).
   * Proportions: big round head, shoulders/torso below, feet barely visible.
   */
  static createPersonSprite(
    scene: Phaser.Scene, key: string, size: number,
    bodyColor: number, headColor: number,
    accentColor: number, hasBadge: boolean
  ): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    const s = size;
    const cx = s / 2;
    const cy = s / 2;

    // Drop shadow (ellipse at feet)
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + s * 0.38, s * 0.5, s * 0.15);

    // Feet (tiny, barely visible below body)
    g.fillStyle(0x222222);
    g.fillCircle(cx - s * 0.08, cy + s * 0.33, s * 0.06);
    g.fillCircle(cx + s * 0.08, cy + s * 0.33, s * 0.06);

    // Body/torso (oval, viewed from above — shoulders wider than waist)
    g.fillStyle(bodyColor);
    g.fillEllipse(cx, cy + s * 0.1, s * 0.42, s * 0.3);

    // Shoulder highlights
    const lighter = Phaser.Display.Color.IntegerToColor(bodyColor).lighten(15).color;
    g.fillStyle(lighter, 0.4);
    g.fillEllipse(cx, cy + s * 0.05, s * 0.36, s * 0.18);

    // Arms (small circles on sides of body)
    const armColor = Phaser.Display.Color.IntegerToColor(bodyColor).darken(12).color;
    g.fillStyle(armColor);
    g.fillCircle(cx - s * 0.24, cy + s * 0.12, s * 0.07);
    g.fillCircle(cx + s * 0.24, cy + s * 0.12, s * 0.07);

    // Hands (skin colored dots)
    g.fillStyle(0xdeb887);
    g.fillCircle(cx - s * 0.26, cy + s * 0.18, s * 0.04);
    g.fillCircle(cx + s * 0.26, cy + s * 0.18, s * 0.04);

    // Head (large circle — dominant feature in top-down view)
    g.fillStyle(0xdeb887); // Skin tone
    g.fillCircle(cx, cy - s * 0.12, s * 0.22);

    // Hair/hat (sits on top of head)
    g.fillStyle(headColor);
    g.fillEllipse(cx, cy - s * 0.18, s * 0.38, s * 0.2);

    // Hair detail — slightly darker front edge
    const hairDark = Phaser.Display.Color.IntegerToColor(headColor).darken(20).color;
    g.fillStyle(hairDark, 0.5);
    g.fillEllipse(cx, cy - s * 0.1, s * 0.32, s * 0.08);

    // Badge (police only — small gold diamond on chest)
    if (hasBadge && accentColor) {
      g.fillStyle(accentColor);
      const bx = cx;
      const by = cy + s * 0.04;
      const bs = s * 0.04;
      g.fillTriangle(bx, by - bs, bx + bs, by, bx - bs, by);
      g.fillTriangle(bx, by + bs, bx + bs, by, bx - bs, by);
    }

    g.generateTexture(key, s, s);
    g.destroy();
  }

  /**
   * Building tile with windows
   */
  static createBuildingTexture(
    scene: Phaser.Scene, key: string, w: number, h: number, color: number
  ): void {
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Building body
    g.fillStyle(color);
    g.fillRect(0, 0, w, h);

    // Darker edge (depth)
    const dark = Phaser.Display.Color.IntegerToColor(color).darken(20).color;
    g.fillStyle(dark);
    g.fillRect(0, 0, 1, h);
    g.fillRect(w - 1, 0, 1, h);
    g.fillRect(0, 0, w, 1);

    // Roof accent
    const roof = Phaser.Display.Color.IntegerToColor(color).darken(30).color;
    g.fillStyle(roof);
    g.fillRect(0, 0, w, 2);

    // Windows — grid of lighter rectangles
    const winColor = Phaser.Display.Color.IntegerToColor(color).lighten(25).color;
    const winW = 3;
    const winH = 3;
    const cols = 4;
    const rows = 4;
    const gapX = (w - cols * winW) / (cols + 1);
    const gapY = (h - rows * winH - 4) / (rows + 1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = gapX + c * (winW + gapX);
        const wy = 4 + gapY + r * (winH + gapY);
        // Randomly lit windows (some yellow, some dark)
        const lit = (r + c * 3 + Math.floor(wx)) % 3 !== 0;
        g.fillStyle(lit ? 0xfff9c4 : winColor, lit ? 0.7 : 0.4);
        g.fillRect(wx, wy, winW, winH);
      }
    }

    g.generateTexture(key, w, h);
    g.destroy();
  }

  /**
   * Station entrance that looks like subway stairs
   */
  static createStationEntrance(scene: Phaser.Scene): void {
    const s = STATION_ENTRANCE_SIZE;
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Dark stairwell
    g.fillStyle(0x1a1a2e);
    g.fillRect(0, 0, s, s);

    // Railing sides
    g.fillStyle(hexToNum(COLOR_UI_SECONDARY));
    g.fillRect(0, 0, 2, s);
    g.fillRect(s - 2, 0, 2, s);

    // Step lines
    g.fillStyle(0x444466);
    for (let i = 0; i < 5; i++) {
      const y = 3 + i * (s / 5);
      g.fillRect(2, y, s - 4, 1);
    }

    // Top bar (entrance canopy)
    g.fillStyle(hexToNum(COLOR_UI_PRIMARY));
    g.fillRect(0, 0, s, 3);

    // Globe light
    g.fillStyle(0x4caf50);
    g.fillCircle(s / 2, 1.5, 2);

    g.generateTexture('station_entrance', s, s);
    g.destroy();
  }

  /**
   * Tree with layered canopy
   */
  static createTreeTexture(scene: Phaser.Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 });

    // Trunk
    g.fillStyle(0x5d4037);
    g.fillRect(3, 5, 2, 4);

    // Canopy layers (darker underneath, lighter on top)
    g.fillStyle(hexToNum(COLOR_TREE), 0.9);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0x2e7d32, 0.8);
    g.fillCircle(4, 3, 3);
    g.fillStyle(0x388e3c, 0.6);
    g.fillCircle(4, 2.5, 2);

    g.generateTexture('tree', 8, 10);
    g.destroy();
  }

  static createRectTexture(
    scene: Phaser.Scene, key: string, width: number, height: number,
    fillColor: number, borderColor?: number
  ): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    if (borderColor !== undefined) {
      g.fillStyle(borderColor);
      g.fillRect(0, 0, width, height);
      g.fillStyle(fillColor);
      g.fillRect(2, 2, width - 4, height - 4);
    } else {
      g.fillStyle(fillColor);
      g.fillRect(0, 0, width, height);
    }
    g.generateTexture(key, width, height);
    g.destroy();
  }

  static createCircleTexture(
    scene: Phaser.Scene, key: string, radius: number, fillColor: number
  ): void {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(fillColor, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }
}
