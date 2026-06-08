import Phaser from 'phaser';
import { AudioManager } from '@/managers/AudioManager';
import { SaveManager } from '@/managers/SaveManager';
import { ensureSceneLoaded, SceneKey } from '@/sceneLoader';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_SURFACE, COLOR_UI_BACKGROUND } from '@/graphics/colors';

export class PauseScene extends Phaser.Scene {
  private settingsOpen: boolean = false;
  private settingsContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const audioManager = this.game.registry.get('audioManager') as AudioManager;
    const saveManager = this.game.registry.get('saveManager') as SaveManager;

    // Pause underlying scenes
    this.scene.pause('GameScene');
    if (this.scene.isActive('HUDScene')) {
      this.scene.pause('HUDScene');
    }

    // Overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);

    // Title
    this.add.text(width / 2, height * 0.15, 'PAUSED', {
      fontSize: '60px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Menu buttons
    const btnSpacing = 80;
    let y = height * 0.2;

    // RESUME
    this.createMenuBtn(width / 2, y, 'RESUME', () => this.resumeGame());
    y += btnSpacing;

    // SHOP
    this.createMenuBtn(width / 2, y, 'SHOP', () => {
      this.resumeGame();
      void this.loadAndLaunchScene('ShopScene');
    });
    y += btnSpacing;

    // STATS
    this.createMenuBtn(width / 2, y, 'STATS', () => {
      this.resumeGame();
      void this.loadAndLaunchScene('StatsScene');
    });
    y += btnSpacing;

    // LEADERBOARD
    this.createMenuBtn(width / 2, y, 'LEADERBOARD', () => {
      this.resumeGame();
      void this.loadAndLaunchScene('LeaderboardScene');
    });
    y += btnSpacing;

    // PREMIUM STORE
    this.createMenuBtn(width / 2, y, 'PREMIUM STORE', () => {
      this.resumeGame();
      void this.loadAndLaunchScene('PremiumStoreScene');
    });
    y += btnSpacing;

    // SETTINGS
    this.createMenuBtn(width / 2, y, 'SETTINGS', () => this.toggleSettings());
    y += btnSpacing;

    // MAIN MENU
    this.createMenuBtn(width / 2, y, 'MAIN MENU', () => {
      // Auto-save before leaving
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.stop('PauseScene');
      void this.loadAndStartScene('MainMenuScene');
    }, true);

    // ESC to resume
    if (this.input.keyboard) {
      const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      escKey.on('down', () => this.resumeGame());
    }
  }

  private createMenuBtn(x: number, y: number, label: string, callback: () => void, danger: boolean = false): void {
    const bg = this.add.rectangle(x, y, 420, 58, danger ? 0x882222 : hexToNum(COLOR_UI_SURFACE));
    bg.setStrokeStyle(3, danger ? 0xcc4444 : hexToNum(COLOR_UI_PRIMARY));
    bg.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: '24px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: [bg, text],
        scaleX: 0.95, scaleY: 0.95,
        duration: 50, yoyo: true,
        onComplete: () => callback(),
      });
    });

    bg.on('pointerover', () => bg.setFillStyle(danger ? 0xaa3333 : hexToNum('#3a3a5a')));
    bg.on('pointerout', () => bg.setFillStyle(danger ? 0x882222 : hexToNum(COLOR_UI_SURFACE)));
  }

  private async loadAndLaunchScene(key: SceneKey, data?: any): Promise<void> {
    await ensureSceneLoaded(this, key);
    this.scene.launch(key, data);
  }

  private async loadAndStartScene(key: SceneKey, data?: any): Promise<void> {
    await ensureSceneLoaded(this, key);
    this.scene.start(key, data);
  }

  private toggleSettings(): void {
    if (this.settingsOpen) {
      this.settingsContainer?.destroy();
      this.settingsContainer = null;
      this.settingsOpen = false;
      return;
    }

    this.settingsOpen = true;
    const { width, height } = this.cameras.main;
    const audioManager = this.game.registry.get('audioManager') as AudioManager;
    const saveManager = this.game.registry.get('saveManager') as SaveManager;

    this.settingsContainer = this.add.container(0, 0);

    // Panel
    const panel = this.add.rectangle(width / 2, height * 0.72, 550, 325, hexToNum(COLOR_UI_SURFACE), 0.95);
    panel.setStrokeStyle(5, hexToNum(COLOR_UI_PRIMARY));
    this.settingsContainer.add(panel);

    // Music volume
    const my = height * 0.66;
    this.settingsContainer.add(
      this.add.text(width / 2 - 238, my, 'Music', { fontSize: '22px', color: '#aaaaaa' })
    );
    this.createSlider(width / 2 + 50, my, audioManager.getMusicVolume(), (val) => {
      audioManager.setMusicVolume(val);
      const save = saveManager.load();
      if (save) { save.settings.musicVolume = val; saveManager.save(save); }
    });

    // SFX volume
    const sy = my + 63;
    this.settingsContainer.add(
      this.add.text(width / 2 - 238, sy, 'SFX', { fontSize: '22px', color: '#aaaaaa' })
    );
    this.createSlider(width / 2 + 50, sy, audioManager.getSFXVolume(), (val) => {
      audioManager.setSFXVolume(val);
      const save = saveManager.load();
      if (save) { save.settings.sfxVolume = val; saveManager.save(save); }
    });

    // FPS toggle
    const fy = sy + 63;
    this.settingsContainer.add(
      this.add.text(width / 2 - 238, fy, 'Show FPS', { fontSize: '22px', color: '#aaaaaa' })
    );
    const save = saveManager.load();
    const fpsOn = save?.settings.showFps ?? false;
    const fpsToggle = this.add.text(width / 2 + 125, fy, fpsOn ? 'ON' : 'OFF', {
      fontSize: '22px', color: fpsOn ? '#4caf50' : '#888888', fontStyle: 'bold',
      backgroundColor: '#333344', padding: { x: 15, y: 5 },
    }).setInteractive({ useHandCursor: true });
    fpsToggle.on('pointerdown', () => {
      const s = saveManager.load();
      if (s) {
        s.settings.showFps = !s.settings.showFps;
        saveManager.save(s);
        fpsToggle.setText(s.settings.showFps ? 'ON' : 'OFF');
        fpsToggle.setColor(s.settings.showFps ? '#4caf50' : '#888888');
        this.game.registry.set('showFps', s.settings.showFps);
      }
    });
    this.settingsContainer.add(fpsToggle);
  }

  private createSlider(
    x: number,
    y: number,
    initialValue: number,
    onChange: (val: number) => void
  ): void {
    const sliderWidth = 200;
    const trackY = y + 13;

    // Track
    const track = this.add.rectangle(x + sliderWidth / 2, trackY, sliderWidth, 10, 0x444444);
    this.settingsContainer!.add(track);

    // Fill
    const fill = this.add.rectangle(x, trackY, sliderWidth * initialValue, 10, hexToNum(COLOR_UI_PRIMARY));
    fill.setOrigin(0, 0.5);
    this.settingsContainer!.add(fill);

    // Thumb
    const thumb = this.add.circle(x + sliderWidth * initialValue, trackY, 15, hexToNum(COLOR_UI_PRIMARY));
    thumb.setInteractive({ useHandCursor: true, draggable: true });
    this.settingsContainer!.add(thumb);

    // Value text
    const valText = this.add.text(x + sliderWidth + 25, y, `${Math.round(initialValue * 100)}%`, {
      fontSize: '20px', color: '#ffffff',
    });
    this.settingsContainer!.add(valText);

    // Drag handling
    this.input.on('drag', (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number) => {
      if (gameObject !== thumb) return;
      const clamped = Phaser.Math.Clamp(dragX, x, x + sliderWidth);
      thumb.setX(clamped);
      const val = (clamped - x) / sliderWidth;
      fill.width = val * sliderWidth;
      valText.setText(`${Math.round(val * 100)}%`);
      onChange(val);
    });

    this.input.setDraggable(thumb);
  }

  private resumeGame(): void {
    this.scene.resume('GameScene');
    if (this.scene.isPaused('HUDScene')) {
      this.scene.resume('HUDScene');
    }
    this.scene.stop('PauseScene');
  }
}
