import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { InputManager } from '@/managers/InputManager';
import { MapManager } from '@/managers/MapManager';
import { StationRenderer } from '@/graphics/StationRenderer';
import { Station } from '@/types/game.types';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_SURFACE } from '@/graphics/colors';
import { Civilian } from '@/entities/Civilian';
import { NPC } from '@/entities/NPC';
import { DialogueSystem } from '@/systems/DialogueSystem';
import { AudioManager } from '@/managers/AudioManager';

export class StationScene extends Phaser.Scene {
  private player: Player | null = null;
  private inputManager: InputManager | null = null;
  private mapManager: MapManager | null = null;
  private currentStation: Station | null = null;
  private exitZone: Phaser.GameObjects.Rectangle | null = null;
  private platformZone: Phaser.GameObjects.Rectangle | null = null;
  private destinationMenu: Phaser.GameObjects.Container | null = null;
  private menuOpen: boolean = false;
  private platformY: number = 0;
  private exitY: number = 0;
  private exitX: number = 0;
  private promptText: Phaser.GameObjects.Text | null = null;
  private stationNPCs: NPC[] = [];
  private dialogueSystem: DialogueSystem | null = null;
  private audioManager: AudioManager | null = null;
  private ambientLoop: { stop: () => void } | null = null;

  constructor() {
    super({ key: 'StationScene' });
  }

  create(data: { stationId: string }): void {
    this.menuOpen = false;

    this.mapManager = this.game.registry.get('mapManager') as MapManager;
    this.inputManager = this.game.registry.get('inputManager') as InputManager;

    this.currentStation = this.mapManager.getStation(data.stationId);
    if (!this.currentStation) return;

    // Render station
    const result = StationRenderer.renderStation(this, this.currentStation);
    this.platformY = result.platformY;
    this.exitY = result.exitY;
    this.exitX = result.exitX;

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Create player at entrance (bottom center)
    this.player = new Player(this, width / 2, height * 0.82, 'police');
    this.player.setDepth(100);

    // Setup input
    this.inputManager.setup(this);

    // Exit zone (bottom area)
    this.exitZone = this.add.rectangle(
      this.exitX,
      this.exitY,
      40,
      20
    ).setVisible(false);
    this.physics.add.existing(this.exitZone, true);

    // Platform zone
    this.platformZone = this.add.rectangle(
      width / 2,
      this.platformY,
      80,
      30
    ).setVisible(false);
    this.physics.add.existing(this.platformZone, true);

    // Prompt text
    this.promptText = this.add.text(0, 0, '', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(200).setVisible(false);

    // Physics bounds for station interior
    this.physics.world.setBounds(
      width / 2 - 140,
      height / 2 - 100,
      280,
      200
    );

    // Spawn station NPCs (3-5 civilians)
    this.stationNPCs = [];
    const npcCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < npcCount; i++) {
      // Scatter on platform and near turnstiles
      const nx = width / 2 - 60 + Math.random() * 120;
      const ny = this.platformY - 20 + Math.random() * 40;
      const civ = new Civilian(this, nx, ny, i % 4);
      civ.setDepth(50);
      this.stationNPCs.push(civ);
    }

    // Dialogue system
    this.dialogueSystem = new DialogueSystem(this);

    // Audio
    this.audioManager = this.game.registry.get('audioManager') as AudioManager;
    this.audioManager?.crossfadeMusic('station_theme');
    this.ambientLoop = this.audioManager?.playSFXLoop('ambient_crowd') ?? null;

    // Fade in
    this.cameras.main.fadeIn(300);
  }

  update(_time: number, delta: number): void {
    if (!this.player || !this.inputManager) return;

    this.inputManager.update();

    if (this.menuOpen) {
      this.inputManager.resetActionFlag();
      return;
    }

    const dir = this.inputManager.getDirection();
    const sprint = this.inputManager.isSprintHeld();
    this.player.update(dir, sprint, delta);

    // Update station NPCs
    for (const npc of this.stationNPCs) {
      npc.update(delta);
    }

    // Update dialogue
    this.dialogueSystem?.update(delta);

    const px = this.player.x;
    const py = this.player.y;

    // NPC interaction
    if (this.inputManager.isActionPressed() && this.dialogueSystem && !this.dialogueSystem.isVisible()) {
      // Check for nearby interactable NPC
      for (const npc of this.stationNPCs) {
        if (npc.interactable && Math.hypot(npc.x - px, npc.y - py) < 30) {
          this.dialogueSystem.show(npc.npcType, npc.getDialogue());
          this.inputManager.resetActionFlag();
          return;
        }
      }
    }

    // Check proximity to exit
    const distToExit = Math.hypot(px - this.exitX, py - this.exitY);
    if (distToExit < 25) {
      this.promptText?.setVisible(true);
      this.promptText?.setPosition(px, py - 15);
      this.promptText?.setText('Press ! to exit');

      if (this.inputManager.isActionPressed()) {
        this.exitStation();
      }
    }
    // Check proximity to platform
    else if (this.platformZone) {
      const distToPlatform = Math.hypot(
        px - this.cameras.main.width / 2,
        py - this.platformY
      );
      if (distToPlatform < 30) {
        this.promptText?.setVisible(true);
        this.promptText?.setPosition(px, py - 15);
        this.promptText?.setText('Press ! for trains');

        if (this.inputManager.isActionPressed()) {
          this.showDestinationMenu();
        }
      } else {
        this.promptText?.setVisible(false);
      }
    } else {
      this.promptText?.setVisible(false);
    }

    this.inputManager.resetActionFlag();
  }

  private showDestinationMenu(): void {
    if (!this.currentStation || !this.mapManager) return;

    this.menuOpen = true;
    const connected = this.mapManager.getConnectedStations(this.currentStation.id);

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Menu container
    this.destinationMenu = this.add.container(width / 2, height / 2).setDepth(500);

    // Background — compact
    const rowH = 55;
    const bgH = 63 + connected.length * rowH + 50;
    const bg = this.add.rectangle(0, 0, 375, bgH, hexToNum(COLOR_UI_SURFACE), 0.95);
    bg.setStrokeStyle(2, hexToNum(COLOR_UI_PRIMARY));
    this.destinationMenu.add(bg);

    // Title
    const title = this.add.text(0, -bgH / 2 + 25, 'SELECT DESTINATION', {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.destinationMenu.add(title);

    // Station buttons
    connected.forEach((station, idx) => {
      const y = -bgH / 2 + 63 + idx * rowH;

      const lines = this.mapManager!.getLinesBetweenStations(this.currentStation!.id, station.id);
      const lineColor = lines.length > 0 ? hexToNum(lines[0].color) : 0xffffff;

      const dot = this.add.circle(-150, y, 8, lineColor);
      this.destinationMenu!.add(dot);

      const btn = this.add.text(0, y, station.name, {
        fontSize: '18px', color: '#ffffff',
        backgroundColor: '#333355', padding: { x: 18, y: 10 },
      })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btn.on('pointerdown', () => {
        this.travelToStation(station.id, lines.length > 0 ? lines[0].color : '#ffffff');
      });

      btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#555577' }));
      btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#333355' }));

      this.destinationMenu!.add(btn);
    });

    // Cancel button
    const cancelY = bgH / 2 - 22;
    const cancel = this.add.text(0, cancelY, 'CANCEL', {
      fontSize: '15px',
      color: '#aaaaaa',
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    cancel.on('pointerdown', () => {
      this.hideDestinationMenu();
    });

    this.destinationMenu.add(cancel);
  }

  private hideDestinationMenu(): void {
    this.destinationMenu?.destroy();
    this.destinationMenu = null;
    this.menuOpen = false;
  }

  private travelToStation(destinationId: string, lineColor: string): void {
    this.hideDestinationMenu();

    // Train arrival with audio
    this.audioManager?.playSFX('train_arrive');
    this.cameras.main.shake(300, 0.003); // Subtle rumble
    const train = StationRenderer.renderTrainArrival(this, lineColor);

    // After train arrives, play doors and fade out
    this.time.delayedCall(1500, () => {
      this.audioManager?.playSFX('train_doors');
    });
    this.time.delayedCall(1800, () => {
      this.cameras.main.fadeOut(500);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        train.destroy();
        this.scene.restart({ stationId: destinationId });
      });
    });
  }

  private exitStation(): void {
    if (!this.currentStation) return;

    // Clean up
    for (const npc of this.stationNPCs) {
      npc.destroy();
    }
    this.stationNPCs = [];
    this.ambientLoop?.stop();
    this.ambientLoop = null;

    this.cameras.main.fadeOut(300);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const stationId = this.currentStation!.id;
      this.scene.stop('StationScene');
      this.game.events.emit('exitStation', stationId);
    });
  }
}
