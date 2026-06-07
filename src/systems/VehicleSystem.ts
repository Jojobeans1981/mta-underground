import Phaser from 'phaser';

export interface BusRoute {
  id: string;
  name: string;
  stops: Array<{ id: string; name: string; position: { x: number; y: number } }>;
}

export class VehicleSystem {
  private scene: Phaser.Scene;
  private isActive: boolean = false;
  private currentRoute: BusRoute | null = null;
  private currentStopIndex: number = 0;
  private passengerCount: number = 0;
  private maxPassengers: number = 40;
  private satisfaction: number = 100; // 0-100
  private onTimeBonus: boolean = true;
  private vehicle: Phaser.GameObjects.Container | null = null;
  private stopMarker: Phaser.GameObjects.Container | null = null;
  private stopReached: boolean = false;
  private dwellTimer: number = 0; // Time stopped at a stop

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  startRoute(route: BusRoute, vehicleX: number, vehicleY: number): void {
    this.currentRoute = route;
    this.currentStopIndex = 0;
    this.passengerCount = 5; // Start with some passengers
    this.satisfaction = 100;
    this.onTimeBonus = true;
    this.isActive = true;
    this.stopReached = false;

    // Create vehicle visual (player becomes the bus)
    this.vehicle = this.scene.add.container(vehicleX, vehicleY);
    this.vehicle.setDepth(95);
    const busBody = this.scene.add.rectangle(0, 0, 24, 12, 0x0d47a1);
    const busFront = this.scene.add.rectangle(10, 0, 4, 12, 0xff6f00);
    this.vehicle.add([busBody, busFront]);

    this.renderStopMarker();
  }

  update(playerX: number, playerY: number, delta: number): { stopReached: boolean; routeComplete: boolean } {
    if (!this.isActive || !this.currentRoute) return { stopReached: false, routeComplete: false };

    const dt = delta / 1000;

    // Move vehicle visual to player position
    if (this.vehicle) {
      this.vehicle.setPosition(playerX, playerY);
    }

    // Satisfaction decays slowly
    this.satisfaction = Math.max(0, this.satisfaction - 0.5 * dt);

    // Check if player reached current stop
    const currentStop = this.currentRoute.stops[this.currentStopIndex];
    if (!currentStop) return { stopReached: false, routeComplete: true };

    const dist = Math.hypot(playerX - currentStop.position.x, playerY - currentStop.position.y);

    if (dist < 30 && !this.stopReached) {
      this.stopReached = true;
      this.dwellTimer = 3; // Stop for 3 seconds

      // Passengers on/off
      const off = Math.floor(Math.random() * 5);
      const on = Math.floor(Math.random() * 8);
      this.passengerCount = Math.min(this.maxPassengers, Math.max(0, this.passengerCount - off + on));

      // Satisfaction boost for reaching stop
      this.satisfaction = Math.min(100, this.satisfaction + 10);

      return { stopReached: true, routeComplete: false };
    }

    // Dwell timer at stop
    if (this.stopReached) {
      this.dwellTimer -= dt;
      if (this.dwellTimer <= 0) {
        this.stopReached = false;
        this.currentStopIndex++;

        if (this.currentStopIndex >= this.currentRoute.stops.length) {
          // Route complete
          return { stopReached: false, routeComplete: true };
        }

        this.renderStopMarker();
      }
    }

    return { stopReached: false, routeComplete: false };
  }

  private renderStopMarker(): void {
    this.stopMarker?.destroy();

    if (!this.currentRoute) return;
    const stop = this.currentRoute.stops[this.currentStopIndex];
    if (!stop) return;

    this.stopMarker = this.scene.add.container(stop.position.x, stop.position.y);
    this.stopMarker.setDepth(80);

    const marker = this.scene.add.circle(0, 0, 10, 0x0d47a1, 0.5);
    // Render at 8x for crisp world-space text
    const label = this.scene.add.text(0, -16, stop.name, {
      fontSize: '56px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScale(0.125);

    this.stopMarker.add([marker, label]);

    this.scene.tweens.add({
      targets: marker,
      scaleX: { from: 0.8, to: 1.3 },
      scaleY: { from: 0.8, to: 1.3 },
      alpha: { from: 0.6, to: 0.2 },
      duration: 800, yoyo: true, repeat: -1,
    });
  }

  getSatisfaction(): number {
    return this.satisfaction;
  }

  getPassengerCount(): number {
    return this.passengerCount;
  }

  getCurrentStopName(): string {
    if (!this.currentRoute) return '';
    const stop = this.currentRoute.stops[this.currentStopIndex];
    return stop?.name ?? 'End of Route';
  }

  getProgress(): { current: number; total: number } {
    if (!this.currentRoute) return { current: 0, total: 0 };
    return { current: this.currentStopIndex, total: this.currentRoute.stops.length };
  }

  getIsActive(): boolean {
    return this.isActive;
  }

  stop(): void {
    this.isActive = false;
    this.vehicle?.destroy();
    this.vehicle = null;
    this.stopMarker?.destroy();
    this.stopMarker = null;
    this.currentRoute = null;
  }
}
