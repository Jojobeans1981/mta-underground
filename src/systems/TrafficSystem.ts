import Phaser from 'phaser';

interface Vehicle {
  sprite: Phaser.GameObjects.Container;
  vx: number;
  vy: number;
  lane: number;
}

const CAR_COLORS = [0xf44336, 0x2196f3, 0xffeb3b, 0x4caf50, 0xff9800, 0x9c27b0, 0x607d8b, 0xe91e63];
const TAXI_COLOR = 0xffd600;

/**
 * Ambient traffic driving on roads.
 * Cars, taxis, and the occasional bus cruise through the streets.
 * Purely visual + dodge-hazard gameplay.
 */
export class TrafficSystem {
  private scene: Phaser.Scene | null = null;
  private vehicles: Vehicle[] = [];
  private spawnTimer: number = 0;
  private maxVehicles: number = 12;

  // Road grid positions — must match TileRenderer's verticalXs and horizontalYs
  private verticalRoads = [150, 300, 500, 700, 850];
  private horizontalRoads = [150, 250, 350, 450, 550, 650, 750];

  init(scene: Phaser.Scene): void {
    this.scene = scene;
    // Spawn initial batch
    for (let i = 0; i < 6; i++) {
      this.spawnVehicle();
    }
  }

  update(delta: number): void {
    if (!this.scene) return;
    const dt = delta / 1000;

    // Spawn timer
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.vehicles.length < this.maxVehicles) {
      this.spawnTimer = 1.5 + Math.random() * 2;
      this.spawnVehicle();
    }

    // Move vehicles and despawn off-world
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.sprite.x += v.vx * dt;
      v.sprite.y += v.vy * dt;

      // Out of bounds = destroy
      if (v.sprite.x < -30 || v.sprite.x > 1030 || v.sprite.y < -30 || v.sprite.y > 1030) {
        v.sprite.destroy();
        this.vehicles.splice(i, 1);
      }
    }
  }

  private spawnVehicle(): void {
    if (!this.scene) return;

    const isHorizontal = Math.random() > 0.5;
    const isTaxi = Math.random() < 0.25;
    const isBus = !isTaxi && Math.random() < 0.1;

    let x: number, y: number, vx: number, vy: number;
    const speed = 30 + Math.random() * 40;

    if (isHorizontal) {
      const roadY = this.horizontalRoads[Math.floor(Math.random() * this.horizontalRoads.length)];
      const goRight = Math.random() > 0.5;
      const lane = goRight ? -4 : 4; // Offset from center
      x = goRight ? -20 : 1020;
      y = roadY + lane;
      vx = goRight ? speed : -speed;
      vy = 0;
    } else {
      const roadX = this.verticalRoads[Math.floor(Math.random() * this.verticalRoads.length)];
      const goDown = Math.random() > 0.5;
      const lane = goDown ? -4 : 4;
      x = roadX + lane;
      y = goDown ? -20 : 1020;
      vx = 0;
      vy = goDown ? speed : -speed;
    }

    const container = this.scene.add.container(x, y);
    container.setDepth(80);

    // Projected headlight cone in the travel direction (bloom makes it glow)
    this.addHeadlightCone(container, vx, vy);

    let carW: number, carH: number, color: number;

    if (isBus) {
      // MTA Bus — long, blue+white
      if (isHorizontal) { carW = 18; carH = 6; } else { carW = 6; carH = 18; }
      color = 0x1565c0;

      const body = this.scene.add.rectangle(0, 0, carW, carH, color);
      body.setStrokeStyle(0.5, 0x0d47a1);
      container.add(body);

      // White stripe
      if (isHorizontal) {
        container.add(this.scene.add.rectangle(0, -1, carW - 2, 1, 0xffffff, 0.5));
      } else {
        container.add(this.scene.add.rectangle(-1, 0, 1, carH - 2, 0xffffff, 0.5));
      }

      // Windows
      const winCount = 4;
      for (let w = 0; w < winCount; w++) {
        if (isHorizontal) {
          const wx = -carW / 2 + 2 + w * (carW - 4) / winCount;
          container.add(this.scene.add.rectangle(wx + 1, 0, 2, 2, 0x90caf9, 0.6));
        } else {
          const wy = -carH / 2 + 2 + w * (carH - 4) / winCount;
          container.add(this.scene.add.rectangle(0, wy + 1, 2, 2, 0x90caf9, 0.6));
        }
      }
    } else {
      // Car or taxi
      if (isHorizontal) { carW = 10; carH = 5; } else { carW = 5; carH = 10; }
      color = isTaxi ? TAXI_COLOR : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];

      const body = this.scene.add.rectangle(0, 0, carW, carH, color);
      body.setStrokeStyle(0.3, Phaser.Display.Color.IntegerToColor(color).darken(30).color);
      container.add(body);

      // Windshield
      if (isHorizontal) {
        const windshieldX = vx > 0 ? carW / 2 - 2 : -carW / 2 + 2;
        container.add(this.scene.add.rectangle(windshieldX, 0, 2, carH - 2, 0x90caf9, 0.5));
      } else {
        const windshieldY = vy > 0 ? carH / 2 - 2 : -carH / 2 + 2;
        container.add(this.scene.add.rectangle(0, windshieldY, carW - 2, 2, 0x90caf9, 0.5));
      }

      // Taxi light on top
      if (isTaxi) {
        container.add(this.scene.add.circle(0, 0, 1, 0xffffff, 0.7));
      }

      // Tail lights
      const tlColor = 0xff0000;
      if (isHorizontal) {
        const rearX = vx > 0 ? -carW / 2 : carW / 2;
        container.add(this.scene.add.circle(rearX, -1, 0.7, tlColor, 0.8));
        container.add(this.scene.add.circle(rearX, 1, 0.7, tlColor, 0.8));
      } else {
        const rearY = vy > 0 ? -carH / 2 : carH / 2;
        container.add(this.scene.add.circle(-1, rearY, 0.7, tlColor, 0.8));
        container.add(this.scene.add.circle(1, rearY, 0.7, tlColor, 0.8));
      }

      // Headlights
      const hlColor = 0xfff9c4;
      if (isHorizontal) {
        const frontX = vx > 0 ? carW / 2 : -carW / 2;
        container.add(this.scene.add.circle(frontX, -1, 0.7, hlColor, 0.9));
        container.add(this.scene.add.circle(frontX, 1, 0.7, hlColor, 0.9));
      } else {
        const frontY = vy > 0 ? carH / 2 : -carH / 2;
        container.add(this.scene.add.circle(-1, frontY, 0.7, hlColor, 0.9));
        container.add(this.scene.add.circle(1, frontY, 0.7, hlColor, 0.9));
      }
    }

    this.vehicles.push({ sprite: container, vx, vy, lane: 0 });
  }

  /**
   * Draw a soft headlight cone projecting from the front of a vehicle in its
   * direction of travel. Two stacked translucent triangles (wide + soft outer,
   * narrow + brighter inner) plus a hot lamp core, so bloom reads it as a glow.
   */
  private addHeadlightCone(container: Phaser.GameObjects.Container, vx: number, vy: number): void {
    if (!this.scene) return;
    const horizontal = Math.abs(vx) >= Math.abs(vy);
    const front = 4;   // distance from car center to the lamps
    const len = 18;    // how far the beam reaches
    const halfW = 6;   // half-width of the beam at its far end

    // Apex (at the lamps) and the two far corners, oriented by travel direction
    let ax: number, ay: number, b1x: number, b1y: number, b2x: number, b2y: number;
    if (horizontal) {
      const d = vx >= 0 ? 1 : -1;
      ax = d * front; ay = 0;
      b1x = d * (front + len); b1y = -halfW;
      b2x = d * (front + len); b2y = halfW;
    } else {
      const d = vy >= 0 ? 1 : -1;
      ax = 0; ay = d * front;
      b1x = -halfW; b1y = d * (front + len);
      b2x = halfW;  b2y = d * (front + len);
    }

    const g = this.scene.add.graphics();
    // Wide soft outer cone
    g.fillStyle(0xfff3c0, 0.10);
    g.fillTriangle(ax, ay, b1x, b1y, b2x, b2y);
    // Narrower, brighter inner cone (60% width/length)
    g.fillStyle(0xfff7d6, 0.14);
    g.fillTriangle(ax, ay, ax + (b1x - ax) * 0.62, ay + (b1y - ay) * 0.62, ax + (b2x - ax) * 0.62, ay + (b2y - ay) * 0.62);
    // Hot lamp core at the apex
    g.fillStyle(0xffffff, 0.85);
    g.fillCircle(ax, ay, 1);
    container.add(g);
  }

  /** Check if player is near a vehicle (for near-miss detection) */
  checkNearMiss(playerX: number, playerY: number): boolean {
    for (const v of this.vehicles) {
      const dist = Math.hypot(v.sprite.x - playerX, v.sprite.y - playerY);
      if (dist < 8 && dist > 4) {
        return true; // Near miss!
      }
    }
    return false;
  }

  clearAll(): void {
    for (const v of this.vehicles) {
      v.sprite.destroy();
    }
    this.vehicles.length = 0;
  }
}
