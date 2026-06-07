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

const STATION_WIDTH = 150;
const STATION_HEIGHT = 110;

export class StationRenderer {
  static renderStation(
    scene: Phaser.Scene,
    station: Station
  ): { container: Phaser.GameObjects.Container; platformY: number; exitY: number; exitX: number } {
    const container = scene.add.container(0, 0);
    const cx = scene.cameras.main.width / 2;
    const cy = scene.cameras.main.height / 2;
    const left = cx - STATION_WIDTH / 2;
    const top = cy - STATION_HEIGHT / 2;

    // Floor
    const floor = scene.add.rectangle(cx, cy, STATION_WIDTH, STATION_HEIGHT, hexToNum(COLOR_STATION_FLOOR));
    container.add(floor);

    // Walls (top and bottom)
    const wallTop = scene.add.rectangle(cx, top + 3, STATION_WIDTH, 5, hexToNum(COLOR_STATION_WALL));
    const wallBottom = scene.add.rectangle(cx, top + STATION_HEIGHT - 3, STATION_WIDTH, 5, hexToNum(COLOR_STATION_WALL));
    container.add(wallTop);
    container.add(wallBottom);

    // Left and right walls
    const wallLeft = scene.add.rectangle(left + 3, cy, 5, STATION_HEIGHT, hexToNum(COLOR_STATION_WALL));
    const wallRight = scene.add.rectangle(left + STATION_WIDTH - 3, cy, 5, STATION_HEIGHT, hexToNum(COLOR_STATION_WALL));
    container.add(wallLeft);
    container.add(wallRight);

    // Platform (center)
    const platformY = cy - 5;
    const platform = scene.add.rectangle(cx, platformY, station.platforms[0].width + 20, 12, hexToNum(COLOR_STATION_PLATFORM));
    container.add(platform);

    // Yellow warning line along platform edge
    const warningLine = scene.add.rectangle(cx, platformY + 7, station.platforms[0].width + 20, 1, 0xffff00);
    container.add(warningLine);

    // Tracks (below platform)
    const trackY = platformY + 15;
    const track1 = scene.add.rectangle(cx, trackY, STATION_WIDTH - 20, 2, hexToNum(COLOR_TRACK));
    const rail1a = scene.add.rectangle(cx, trackY - 2, STATION_WIDTH - 20, 1, hexToNum(COLOR_TRACK_RAIL));
    const rail1b = scene.add.rectangle(cx, trackY + 2, STATION_WIDTH - 20, 1, hexToNum(COLOR_TRACK_RAIL));
    container.add(track1);
    container.add(rail1a);
    container.add(rail1b);

    // Turnstiles (near entrance/bottom area)
    const turnstileY = top + STATION_HEIGHT - 20;
    for (let i = 0; i < 3; i++) {
      const tx = cx - 15 + i * 15;
      const turnstile = scene.add.rectangle(tx, turnstileY, 5, 3, hexToNum(COLOR_TURNSTILE));
      container.add(turnstile);
    }

    // Station sign (top, colored by first subway line)
    const lineColor = station.lineIds[0] === 'line_red' ? '#FF4444'
      : station.lineIds[0] === 'line_blue' ? '#4444FF'
      : station.lineIds[0] === 'line_green' ? '#44FF44'
      : '#FFFF44';
    const signBg = scene.add.rectangle(cx, top + 13, 120, 20, hexToNum(lineColor));
    const signText = scene.add.text(cx, top + 13, station.name, {
      fontSize: '4px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(signBg);
    container.add(signText);

    // Exit signs
    const exitX = cx;
    const exitY = top + STATION_HEIGHT - 9;
    const exitBg = scene.add.rectangle(exitX, exitY, 30, 12, hexToNum(COLOR_UI_SUCCESS));
    const exitText = scene.add.text(exitX, exitY, 'EXIT', {
      fontSize: '3px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(exitBg);
    container.add(exitText);

    return { container, platformY, exitY, exitX };
  }

  static renderTrainArrival(
    scene: Phaser.Scene,
    lineColor: string
  ): Phaser.GameObjects.Rectangle {
    const cy = scene.cameras.main.height / 2;
    const trackY = cy - 5 + 15; // platform + offset to tracks

    const train = scene.add.rectangle(
      -50,
      trackY,
      60,
      8,
      hexToNum(lineColor)
    );
    train.setDepth(50);

    scene.tweens.add({
      targets: train,
      x: scene.cameras.main.width / 2,
      duration: 1500,
      ease: 'Power2',
    });

    return train;
  }

  static renderTrainDeparture(scene: Phaser.Scene, train: Phaser.GameObjects.Rectangle): void {
    scene.tweens.add({
      targets: train,
      x: scene.cameras.main.width + 50,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        train.destroy();
      },
    });
  }
}
