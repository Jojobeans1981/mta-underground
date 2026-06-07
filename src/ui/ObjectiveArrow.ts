import Phaser from 'phaser';
import { hexToNum, COLOR_UI_PRIMARY } from '@/graphics/colors';

export class ObjectiveArrow {
  private arrow: Phaser.GameObjects.Container;
  private arrowHead: Phaser.GameObjects.Triangle;
  private distanceText: Phaser.GameObjects.Text;
  private labelText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private targetX: number = 0;
  private targetY: number = 0;
  private active: boolean = false;
  private label: string = '';

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.arrow = scene.add.container(0, 0);
    this.arrow.setScrollFactor(0);
    this.arrow.setDepth(950);
    this.arrow.setVisible(false);

    this.arrowHead = scene.add.triangle(0, 0, 0, -8, 8, 8, -8, 8, hexToNum(COLOR_UI_PRIMARY));
    this.arrowHead.setStrokeStyle(1, 0xffffff);
    this.arrow.add(this.arrowHead);

    this.distanceText = scene.add.text(0, 14, '', {
      fontSize: '8px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.arrow.add(this.distanceText);

    this.labelText = scene.add.text(0, -14, '', {
      fontSize: '7px', color: COLOR_UI_PRIMARY,
    }).setOrigin(0.5);
    this.arrow.add(this.labelText);
  }

  setTarget(worldX: number, worldY: number, label: string = ''): void {
    this.targetX = worldX;
    this.targetY = worldY;
    this.label = label;
    this.active = true;
    this.arrow.setVisible(true);
    this.labelText.setText(label);
  }

  clear(): void {
    this.active = false;
    this.arrow.setVisible(false);
  }

  update(playerWorldX: number, playerWorldY: number): void {
    if (!this.active) return;

    const cam = this.scene.cameras.main;
    const { width, height } = cam;

    const dx = this.targetX - playerWorldX;
    const dy = this.targetY - playerWorldY;
    const dist = Math.hypot(dx, dy);

    this.distanceText.setText(`${Math.round(dist)}m`);

    const screenX = (this.targetX - cam.scrollX) * cam.zoom;
    const screenY = (this.targetY - cam.scrollY) * cam.zoom;
    const margin = 30;

    const onScreen = screenX > margin && screenX < width - margin
      && screenY > margin && screenY < height - margin;

    if (onScreen || dist < 20) {
      this.arrow.setVisible(false);
      return;
    }

    this.arrow.setVisible(true);

    const angle = Math.atan2(dy, dx);
    const edgeMargin = 24;
    const cx = width / 2;
    const cy = height / 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let scale = Infinity;
    if (cosA !== 0) scale = Math.min(scale, Math.abs((cx - edgeMargin) / cosA));
    if (sinA !== 0) scale = Math.min(scale, Math.abs((cy - edgeMargin) / sinA));

    const arrowX = Phaser.Math.Clamp(cx + cosA * scale, edgeMargin, width - edgeMargin);
    const arrowY = Phaser.Math.Clamp(cy + sinA * scale, edgeMargin, height - edgeMargin);

    this.arrow.setPosition(arrowX, arrowY);
    this.arrowHead.setRotation(angle - Math.PI / 2);
  }
}
