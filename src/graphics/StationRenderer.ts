import Phaser from 'phaser';
import { Station } from '@/types/game.types';
import {
  hexToNum,
  COLOR_STATION_WALL,
  COLOR_STATION_FLOOR,
  COLOR_STATION_PLATFORM,
  COLOR_TRACK,
  COLOR_TRACK_RAIL,
  COLOR_TURNSTILE,
  COLOR_UI_SUCCESS,
} from '@/graphics/colors';

interface StationMetrics {
  cx: number; cy: number;
  W: number; H: number;
  left: number; top: number;
  platformY: number; trackY: number; turnstileY: number; exitY: number;
}

export class StationRenderer {
  /** Station fills most of the screen so it reads clearly at zoom 1. */
  private static metrics(scene: Phaser.Scene): StationMetrics {
    const cw = scene.cameras.main.width;
    const ch = scene.cameras.main.height;
    const cx = cw / 2;
    const cy = ch / 2;
    const W = Math.min(cw - 80, 920);
    const H = Math.min(ch - 140, 640);
    const left = cx - W / 2;
    const top = cy - H / 2;
    const platformY = cy - H * 0.06;
    const trackY = platformY + 48;
    const turnstileY = top + H - 66;
    const exitY = top + H - 30;
    return { cx, cy, W, H, left, top, platformY, trackY, turnstileY, exitY };
  }

  static renderStation(
    scene: Phaser.Scene,
    station: Station,
    signColor: string = '#FFD400'
  ): {
    container: Phaser.GameObjects.Container;
    platformY: number; exitY: number; exitX: number;
    bounds: { x: number; y: number; width: number; height: number };
    playerSpawn: { x: number; y: number };
  } {
    const container = scene.add.container(0, 0);
    const m = this.metrics(scene);
    const { cx, cy, W, H, left, top, platformY, trackY, turnstileY, exitY } = m;

    // Floor
    container.add(scene.add.rectangle(cx, cy, W, H, hexToNum(COLOR_STATION_FLOOR)));

    // Subtle floor tiling for depth
    for (let gx = left + 40; gx < left + W; gx += 60) {
      container.add(scene.add.rectangle(gx, cy, 1, H, 0x000000, 0.12));
    }

    // Walls (thick, readable)
    const wall = hexToNum(COLOR_STATION_WALL);
    container.add(scene.add.rectangle(cx, top + 7, W, 14, wall));            // top
    container.add(scene.add.rectangle(cx, top + H - 7, W, 14, wall));        // bottom
    container.add(scene.add.rectangle(left + 7, cy, 14, H, wall));           // left
    container.add(scene.add.rectangle(left + W - 7, cy, 14, H, wall));       // right

    // Platform
    const platformW = W * 0.66;
    container.add(scene.add.rectangle(cx, platformY, platformW, 44, hexToNum(COLOR_STATION_PLATFORM)));
    // Yellow warning strip along the platform edge
    container.add(scene.add.rectangle(cx, platformY + 24, platformW, 4, 0xffd400));
    // Tactile dotted warning line
    for (let dx = -platformW / 2 + 12; dx < platformW / 2; dx += 18) {
      container.add(scene.add.rectangle(cx + dx, platformY + 24, 6, 4, 0xc8a400));
    }

    // Tracks below the platform
    container.add(scene.add.rectangle(cx, trackY, platformW + 30, 12, hexToNum(COLOR_TRACK)));
    container.add(scene.add.rectangle(cx, trackY - 5, platformW + 30, 2, hexToNum(COLOR_TRACK_RAIL)));
    container.add(scene.add.rectangle(cx, trackY + 5, platformW + 30, 2, hexToNum(COLOR_TRACK_RAIL)));
    // Track ties
    for (let dx = -(platformW + 30) / 2 + 10; dx < (platformW + 30) / 2; dx += 22) {
      container.add(scene.add.rectangle(cx + dx, trackY, 3, 14, 0x222222, 0.6));
    }

    // Turnstiles near the bottom
    const turn = hexToNum(COLOR_TURNSTILE);
    for (let i = -1; i <= 1; i++) {
      const tx = cx + i * 70;
      container.add(scene.add.rectangle(tx, turnstileY, 30, 18, turn));
      container.add(scene.add.rectangle(tx, turnstileY, 26, 4, 0x333333));   // arm slot
    }

    // Station sign (top) colored by the serving subway line (passed in)
    const lineColor = signColor;
    const signW = Math.min(W * 0.6, 560);
    container.add(scene.add.rectangle(cx, top + 34, signW, 50, 0x0b0b14));
    container.add(scene.add.rectangle(cx, top + 34, signW, 50, hexToNum(lineColor), 0.18));
    container.add(scene.add.rectangle(cx - signW / 2 + 4, top + 34, 8, 50, hexToNum(lineColor)));
    container.add(scene.add.rectangle(cx + signW / 2 - 4, top + 34, 8, 50, hexToNum(lineColor)));
    container.add(scene.add.text(cx, top + 34, station.name, {
      fontSize: '30px', color: '#ffffff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5));

    // Directional platform label
    container.add(scene.add.text(cx, platformY - 34, '⟵  TRAINS  ⟶', {
      fontSize: '16px', color: '#ffd400', fontStyle: 'bold',
    }).setOrigin(0.5));

    // EXIT sign (bottom)
    const exitX = cx;
    container.add(scene.add.rectangle(exitX, exitY, 110, 40, hexToNum(COLOR_UI_SUCCESS)));
    container.add(scene.add.text(exitX, exitY, 'EXIT', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5));

    return {
      container,
      platformY,
      exitY,
      exitX,
      bounds: { x: left + 14, y: top + 14, width: W - 28, height: H - 28 },
      playerSpawn: { x: cx, y: turnstileY - 4 },
    };
  }

  static renderTrainArrival(
    scene: Phaser.Scene,
    lineColor: string
  ): Phaser.GameObjects.Rectangle {
    const m = this.metrics(scene);
    const train = scene.add.rectangle(
      m.left - 60,
      m.trackY,
      m.W * 0.7,
      24,
      hexToNum(lineColor)
    );
    train.setDepth(50);
    // Windows on the train
    const win = scene.add.rectangle(m.left - 60, m.trackY - 4, m.W * 0.66, 6, 0xfff9c4, 0.5);
    win.setDepth(51);
    scene.tweens.add({ targets: [train, win], x: m.cx, duration: 1500, ease: 'Power2' });

    return train;
  }

  static renderTrainDeparture(scene: Phaser.Scene, train: Phaser.GameObjects.Rectangle): void {
    scene.tweens.add({
      targets: train,
      x: scene.cameras.main.width + 60,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => train.destroy(),
    });
  }
}
