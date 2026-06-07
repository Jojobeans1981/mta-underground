import Phaser from 'phaser';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_DANGER } from '@/graphics/colors';

interface Waypoint {
  id: string;
  worldX: number;
  worldY: number;
  label: string;
  color: number;
  container: Phaser.GameObjects.Container;
}

/**
 * Renders pulsing diamond markers on the world map at mission objective locations.
 * Players can see exactly where they need to go.
 */
export class WaypointMarker {
  private scene: Phaser.Scene;
  private waypoints: Map<string, Waypoint> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Add a waypoint marker at a world position */
  addWaypoint(id: string, worldX: number, worldY: number, label: string, color?: number): void {
    // Remove existing with same id
    this.removeWaypoint(id);

    const markerColor = color ?? hexToNum(COLOR_UI_PRIMARY);
    const container = this.scene.add.container(worldX, worldY);
    container.setDepth(85);

    // Outer pulsing ring
    const outerRing = this.scene.add.circle(0, 0, 14, markerColor, 0.15);
    container.add(outerRing);
    this.scene.tweens.add({
      targets: outerRing,
      scaleX: { from: 0.6, to: 1.4 },
      scaleY: { from: 0.6, to: 1.4 },
      alpha: { from: 0.3, to: 0 },
      duration: 1200,
      repeat: -1,
    });

    // Inner solid diamond
    const diamond = this.scene.add.graphics();
    diamond.fillStyle(markerColor, 0.8);
    diamond.fillTriangle(0, -5, 4, 0, -4, 0);
    diamond.fillTriangle(0, 5, 4, 0, -4, 0);
    // Outline
    diamond.lineStyle(1, 0xffffff, 0.6);
    diamond.strokeTriangle(0, -5, 4, 0, -4, 0);
    diamond.strokeTriangle(0, 5, 4, 0, -4, 0);
    container.add(diamond);

    // Bounce animation on the diamond
    this.scene.tweens.add({
      targets: diamond,
      y: { from: -2, to: 2 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Label text above marker
    if (label) {
      // Render at 8x for crisp text under camera zoom, scale down
      const text = this.scene.add.text(0, -12, label, {
        fontSize: '24px',
        color: '#ffffff',
        fontStyle: 'bold',
        backgroundColor: '#000000aa',
        padding: { x: 16, y: 8 },
      }).setOrigin(0.5, 1).setScale(0.125);
      container.add(text);
    }

    // Vertical beam of light (subtle)
    const beam = this.scene.add.rectangle(0, -20, 1, 30, markerColor, 0.15);
    container.add(beam);
    this.scene.tweens.add({
      targets: beam,
      alpha: { from: 0.05, to: 0.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    this.waypoints.set(id, { id, worldX, worldY, label, color: markerColor, container });
  }

  /** Remove a specific waypoint */
  removeWaypoint(id: string): void {
    const wp = this.waypoints.get(id);
    if (wp) {
      wp.container.destroy();
      this.waypoints.delete(id);
    }
  }

  /** Remove all waypoints */
  clearAll(): void {
    for (const wp of this.waypoints.values()) {
      wp.container.destroy();
    }
    this.waypoints.clear();
  }

  /** Mark a waypoint as completed (flash and remove) */
  completeWaypoint(id: string): void {
    const wp = this.waypoints.get(id);
    if (wp) {
      // Flash effect
      const flash = this.scene.add.circle(wp.worldX, wp.worldY, 20, wp.color, 0.6);
      flash.setDepth(86);
      this.scene.tweens.add({
        targets: flash,
        scaleX: 2, scaleY: 2, alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });
      this.removeWaypoint(id);
    }
  }

  getWaypointCount(): number {
    return this.waypoints.size;
  }
}
