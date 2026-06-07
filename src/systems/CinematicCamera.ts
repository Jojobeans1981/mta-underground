import Phaser from 'phaser';

/**
 * Cinematic camera system for dramatic moments.
 *
 * - Mission intro: camera pans from station to player with letterbox bars
 * - Catch cam: quick zoom to catch location, freeze, then resume
 * - District intro: sweeping pan across the district
 */
export class CinematicCamera {
  private scene: Phaser.Scene;
  private topBar: Phaser.GameObjects.Rectangle | null = null;
  private bottomBar: Phaser.GameObjects.Rectangle | null = null;
  private isPlaying: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Letterbox bars slide in for cinematic widescreen look */
  showLetterbox(onComplete?: () => void): void {
    const { width, height } = this.scene.cameras.main;
    const barHeight = height * 0.08;

    this.topBar = this.scene.add.rectangle(width / 2, -barHeight / 2, width, barHeight, 0x000000);
    this.topBar.setScrollFactor(0).setDepth(980);

    this.bottomBar = this.scene.add.rectangle(width / 2, height + barHeight / 2, width, barHeight, 0x000000);
    this.bottomBar.setScrollFactor(0).setDepth(980);

    this.scene.tweens.add({
      targets: this.topBar, y: barHeight / 2,
      duration: 400, ease: 'Power2',
    });
    this.scene.tweens.add({
      targets: this.bottomBar, y: height - barHeight / 2,
      duration: 400, ease: 'Power2',
      onComplete: () => onComplete?.(),
    });
  }

  hideLetterbox(onComplete?: () => void): void {
    const { height } = this.scene.cameras.main;

    if (this.topBar) {
      this.scene.tweens.add({
        targets: this.topBar, y: -50,
        duration: 300, ease: 'Power2',
        onComplete: () => { this.topBar?.destroy(); this.topBar = null; },
      });
    }
    if (this.bottomBar) {
      this.scene.tweens.add({
        targets: this.bottomBar, y: height + 50,
        duration: 300, ease: 'Power2',
        onComplete: () => {
          this.bottomBar?.destroy(); this.bottomBar = null;
          onComplete?.();
        },
      });
    }
  }

  /**
   * Mission intro: camera pans from a target position to the player.
   * Shows mission title during the pan.
   */
  missionIntro(
    targetX: number, targetY: number,
    playerX: number, playerY: number,
    missionTitle: string,
    callback: () => void
  ): void {
    if (this.isPlaying) { callback(); return; }
    this.isPlaying = true;

    const cam = this.scene.cameras.main;
    const originalZoom = cam.zoom;

    // Stop following player temporarily
    cam.stopFollow();

    // Start letterbox
    this.showLetterbox();

    // Pan to target location first
    cam.pan(targetX, targetY, 600, 'Power2', false, (_cam, progress) => {
      if (progress < 1) return;

      // Show mission title
      const { width, height } = cam;
      const titleText = this.scene.add.text(width / 2, height * 0.4, missionTitle, {
        fontSize: '24px', color: '#ff6f00', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 4,
      }).setOrigin(0.5).setScrollFactor(0).setDepth(985);
      titleText.setAlpha(0);
      this.scene.tweens.add({
        targets: titleText, alpha: 1, duration: 300,
      });

      // Hold for a moment, then pan to player
      this.scene.time.delayedCall(1200, () => {
        this.scene.tweens.add({
          targets: titleText, alpha: 0, y: height * 0.35,
          duration: 300, onComplete: () => titleText.destroy(),
        });

        cam.pan(playerX, playerY, 800, 'Power2', false, (_cam2, prog2) => {
          if (prog2 < 1) return;

          // Resume follow
          const player = (this.scene as any).player;
          if (player) {
            cam.startFollow(player, true, 0.1, 0.1);
          }

          this.hideLetterbox(() => {
            this.isPlaying = false;
            callback();
          });
        });
      });
    });
  }

  /**
   * Catch cam — quick zoom to catch point, brief freeze, zoom back out
   */
  catchCam(targetX: number, targetY: number): void {
    const cam = this.scene.cameras.main;
    const originalZoom = cam.zoom;

    // Quick zoom in
    this.scene.tweens.add({
      targets: cam,
      zoom: originalZoom * 1.6,
      duration: 150,
      ease: 'Power3',
      onComplete: () => {
        // Hold for a beat
        this.scene.time.delayedCall(200, () => {
          // Zoom back
          this.scene.tweens.add({
            targets: cam,
            zoom: originalZoom,
            duration: 300,
            ease: 'Power2',
          });
        });
      },
    });
  }

  /**
   * Screen wipe transition for entering/exiting areas
   */
  screenWipe(direction: 'left' | 'right', callback: () => void): void {
    const { width, height } = this.scene.cameras.main;
    const startX = direction === 'left' ? width + 10 : -width - 10;

    const wipe = this.scene.add.rectangle(startX, height / 2, width + 20, height + 20, 0x1a1a2e);
    wipe.setScrollFactor(0).setDepth(990);

    this.scene.tweens.add({
      targets: wipe,
      x: width / 2,
      duration: 400,
      ease: 'Power3',
      onComplete: () => {
        callback();
        this.scene.tweens.add({
          targets: wipe,
          x: direction === 'left' ? -width - 10 : width + width + 10,
          duration: 400,
          ease: 'Power3',
          onComplete: () => wipe.destroy(),
        });
      },
    });
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
