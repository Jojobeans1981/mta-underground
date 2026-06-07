import Phaser from 'phaser';

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog';

export class WeatherSystem {
  private currentWeather: WeatherType = 'clear';
  private scene: Phaser.Scene;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private fogOverlay: Phaser.GameObjects.Rectangle | null = null;
  private changeTimer: number = 50; // Seconds until next weather change
  private fogTween: Phaser.Tweens.Tween | null = null;
  private particleContainer: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init(): void {
    this.setWeather('clear');
  }

  setWeather(weather: WeatherType): void {
    // Clean up previous
    this.cleanup();
    this.currentWeather = weather;

    switch (weather) {
      case 'rain':
        this.startRain();
        break;
      case 'snow':
        this.startSnow();
        break;
      case 'fog':
        this.startFog();
        break;
      case 'clear':
        // Nothing to render
        break;
    }
  }

  update(delta: number): void {
    const dt = delta / 1000;

    // Weather change timer
    this.changeTimer -= dt;
    if (this.changeTimer <= 0) {
      this.changeTimer = 40 + Math.random() * 30; // 40-70 seconds
      this.randomizeWeather();
    }

    // Fog breathing effect
    if (this.currentWeather === 'fog' && this.fogOverlay) {
      // Handled by tween
    }
  }

  getWeather(): WeatherType {
    return this.currentWeather;
  }

  private randomizeWeather(): void {
    const roll = Math.random();
    if (roll < 0.60) {
      this.setWeather('clear');
    } else if (roll < 0.80) {
      this.setWeather('rain');
    } else if (roll < 0.90) {
      this.setWeather('snow');
    } else {
      this.setWeather('fog');
    }
  }

  private startRain(): void {
    // Use simple animated rectangles since particle system API varies
    this.particleContainer = this.scene.add.container(0, 0);
    this.particleContainer.setDepth(850);

    const cam = this.scene.cameras.main;
    const drops: Phaser.GameObjects.Rectangle[] = [];

    for (let i = 0; i < 80; i++) {
      const drop = this.scene.add.rectangle(
        Math.random() * cam.width,
        Math.random() * cam.height,
        1, 5,
        0x6688aa,
        0.4
      );
      drop.setScrollFactor(0);
      this.particleContainer.add(drop);
      drops.push(drop);
    }

    // Animate drops
    const updateDrops = () => {
      for (const drop of drops) {
        drop.y += 4;
        drop.x += 0.5; // Slight wind
        if (drop.y > cam.height) {
          drop.y = -5;
          drop.x = Math.random() * cam.width;
        }
      }
    };

    this.scene.events.on('update', updateDrops);
    // Store cleanup reference
    (this.particleContainer as any).__cleanupFn = () => {
      this.scene.events.off('update', updateDrops);
    };
  }

  private startSnow(): void {
    this.particleContainer = this.scene.add.container(0, 0);
    this.particleContainer.setDepth(850);

    const cam = this.scene.cameras.main;
    const flakes: { obj: Phaser.GameObjects.Arc; phase: number; speed: number }[] = [];

    for (let i = 0; i < 40; i++) {
      const flake = this.scene.add.circle(
        Math.random() * cam.width,
        Math.random() * cam.height,
        1.5,
        0xffffff,
        0.6
      );
      flake.setScrollFactor(0);
      this.particleContainer.add(flake);
      flakes.push({
        obj: flake,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.8,
      });
    }

    let elapsed = 0;
    const updateSnow = (_t: number, delta: number) => {
      elapsed += delta / 1000;
      for (const f of flakes) {
        f.obj.y += f.speed;
        f.obj.x += Math.sin(elapsed * 0.5 + f.phase) * 0.3;
        if (f.obj.y > cam.height) {
          f.obj.y = -3;
          f.obj.x = Math.random() * cam.width;
        }
      }
    };

    this.scene.events.on('update', updateSnow);
    (this.particleContainer as any).__cleanupFn = () => {
      this.scene.events.off('update', updateSnow);
    };
  }

  private startFog(): void {
    const cam = this.scene.cameras.main;
    this.fogOverlay = this.scene.add.rectangle(
      cam.width / 2,
      cam.height / 2,
      cam.width,
      cam.height,
      0xcccccc,
      0.12
    );
    this.fogOverlay.setScrollFactor(0);
    this.fogOverlay.setDepth(850);

    // Breathing effect
    this.fogTween = this.scene.tweens.add({
      targets: this.fogOverlay,
      alpha: { from: 0.08, to: 0.18 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private cleanup(): void {
    if (this.particleContainer) {
      const cleanupFn = (this.particleContainer as any).__cleanupFn;
      if (cleanupFn) cleanupFn();
      this.particleContainer.destroy();
      this.particleContainer = null;
    }

    if (this.fogTween) {
      this.fogTween.stop();
      this.fogTween = null;
    }

    if (this.fogOverlay) {
      this.fogOverlay.destroy();
      this.fogOverlay = null;
    }
  }

  hide(): void {
    this.cleanup();
  }

  show(): void {
    this.setWeather(this.currentWeather);
  }
}
