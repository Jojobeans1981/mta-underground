import Phaser from 'phaser';
import { ensureSceneLoaded, SceneKey } from '@/sceneLoader';
import { MissionManager } from '@/managers/MissionManager';
import { SaveManager } from '@/managers/SaveManager';
import { MissionDefinition } from '@/types/game.types';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_SURFACE } from '@/graphics/colors';

export class MissionSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MissionSelectScene' });
  }

  create(data: { stationName: string; stationId: string }): void {
    const { width, height } = this.cameras.main;
    const missionManager = this.game.registry.get('missionManager') as MissionManager;
    const saveManager = this.game.registry.get('saveManager') as SaveManager;

    const save = saveManager.load();
    if (!save) { this.scene.stop(); return; }

    const playerClass = save.selectedClass;
    const available = missionManager.getAvailableMissions(save.classes[playerClass]);

    // Overlay background
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    // Panel — sized to fit content, max 80% height
    const rowH = 68;
    const headerH = 63;
    const footerH = 70;
    const maxRows = Math.min(available.length, 6);
    const panelH = Math.min(headerH + maxRows * rowH + footerH, height * 0.80);
    const panelW = width * 0.88;

    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, hexToNum(COLOR_UI_SURFACE), 0.95);
    panel.setStrokeStyle(2, hexToNum(COLOR_UI_PRIMARY));

    const panelTop = height / 2 - panelH / 2;
    const panelLeft = width / 2 - panelW / 2;

    // Title
    this.add.text(width / 2, panelTop + 30, `${data.stationName} — Missions`, {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    if (available.length === 0) {
      this.add.text(width / 2, height / 2, 'No missions available.\nComplete missions or level up.', {
        fontSize: '18px', color: '#888888', align: 'center',
      }).setOrigin(0.5);
    } else {
      let y = panelTop + headerH;
      for (let i = 0; i < maxRows; i++) {
        const mission = available[i];
        let stars = '';
        for (let s = 0; s < 5; s++) stars += s < mission.difficulty ? '★' : '☆';

        const rowBg = this.add.rectangle(width / 2, y + rowH / 2 - 2, panelW - 20, rowH - 5, 0x1a1a3a, 0.6);
        rowBg.setInteractive({ useHandCursor: true });

        this.add.text(panelLeft + 20, y + 5, `${stars}  ${mission.title}`, {
          fontSize: '18px', color: '#ffffff',
        });

        this.add.text(panelLeft + 20, y + 30, mission.description, {
          fontSize: '15px', color: '#888888',
        });

        // Time indicator on right
        if (mission.timeLimit) {
          const m = Math.floor(mission.timeLimit / 60);
          const s = mission.timeLimit % 60;
          this.add.text(panelLeft + panelW - 25, y + 15, `${m}:${s.toString().padStart(2, '0')}`, {
            fontSize: '15px', color: '#ff8888',
          }).setOrigin(1, 0);
        }

        rowBg.on('pointerdown', () => {
          this.scene.stop('MissionSelectScene');
          void this.loadAndLaunchScene('MissionBriefScene', { mission });
        });
        rowBg.on('pointerover', () => rowBg.setFillStyle(hexToNum('#2a2a5a'), 0.8));
        rowBg.on('pointerout', () => rowBg.setFillStyle(0x1a1a3a, 0.6));

        y += rowH;
      }
    }

    // Bottom buttons
    const btnY = panelTop + panelH - 35;

    const enterBg = this.add.rectangle(width / 2 - 100, btnY, 163, 43, hexToNum(COLOR_UI_PRIMARY));
    enterBg.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 100, btnY, 'ENTER STATION', {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    enterBg.on('pointerdown', () => {
      this.scene.stop('MissionSelectScene');
      this.game.events.emit('enterStationFromMenu', data.stationId);
    });

    const closeBg = this.add.rectangle(width / 2 + 100, btnY, 125, 43, 0x555555);
    closeBg.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 100, btnY, 'CLOSE', {
      fontSize: '15px', color: '#cccccc', fontStyle: 'bold',
    }).setOrigin(0.5);
    closeBg.on('pointerdown', () => {
      this.scene.stop('MissionSelectScene');
    });
  }

  private async loadAndLaunchScene(key: SceneKey, data?: any): Promise<void> {
    await ensureSceneLoaded(this, key);
    this.scene.launch(key, data);
  }
}
