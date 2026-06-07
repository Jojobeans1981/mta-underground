import Phaser from 'phaser';
import { MissionDefinition } from '@/types/game.types';
import { MissionManager } from '@/managers/MissionManager';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_SURFACE, COLOR_UI_BACKGROUND, COLOR_UI_MONEY, COLOR_UI_XP } from '@/graphics/colors';

export class MissionBriefScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MissionBriefScene' });
  }

  create(data: { mission: MissionDefinition }): void {
    const { width, height } = this.cameras.main;
    const mission = data.mission;
    const missionManager = this.game.registry.get('missionManager') as MissionManager;

    // Semi-transparent overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);

    // Panel — size to fit, max 90% height
    const panelW = width * 0.88;
    const panelH = height * 0.88;
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, hexToNum(COLOR_UI_SURFACE), 0.95);
    panel.setStrokeStyle(2, hexToNum(COLOR_UI_PRIMARY));

    const left = width / 2 - panelW / 2 + 30;
    const panelTop = height / 2 - panelH / 2;
    let y = panelTop + 30;

    // Title
    this.add.text(width / 2, y, mission.title, {
      fontSize: '30px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 38;

    // Difficulty stars
    let stars = '';
    for (let i = 0; i < 5; i++) stars += i < mission.difficulty ? '★' : '☆';
    this.add.text(width / 2, y, stars, {
      fontSize: '22px', color: COLOR_UI_PRIMARY,
    }).setOrigin(0.5);
    y += 35;

    // Briefing text — compact
    const briefText = this.add.text(width / 2, y, mission.briefing, {
      fontSize: '18px', color: '#cccccc',
      wordWrap: { width: panelW - 60 },
      lineSpacing: 3, align: 'center',
    }).setOrigin(0.5, 0);
    y += briefText.height + 18;

    // Objectives header
    this.add.text(left, y, 'OBJECTIVES:', {
      fontSize: '18px', color: COLOR_UI_PRIMARY, fontStyle: 'bold',
    });
    y += 25;

    for (const obj of mission.objectives) {
      const prefix = obj.optional ? '(bonus) ' : '• ';
      this.add.text(left + 10, y, prefix + obj.description, {
        fontSize: '15px', color: obj.optional ? '#aaaaaa' : '#dddddd',
      });
      y += 22;
    }

    y += 13;

    // Rewards — inline
    this.add.text(left, y, 'REWARDS:', {
      fontSize: '18px', color: COLOR_UI_PRIMARY, fontStyle: 'bold',
    });
    this.add.text(left + 125, y, `$${mission.rewards.money}`, {
      fontSize: '18px', color: COLOR_UI_MONEY, fontStyle: 'bold',
    });
    this.add.text(left + 225, y, `XP: ${mission.rewards.xp}`, {
      fontSize: '18px', color: COLOR_UI_XP, fontStyle: 'bold',
    });
    y += 28;

    // Time limit
    if (mission.timeLimit !== null) {
      const mins = Math.floor(mission.timeLimit / 60);
      const secs = mission.timeLimit % 60;
      this.add.text(left, y, `TIME LIMIT: ${mins}:${secs.toString().padStart(2, '0')}`, {
        fontSize: '18px', color: '#ff4444', fontStyle: 'bold',
      });
    }

    // Buttons — always at bottom of panel
    const btnY = panelTop + panelH - 40;

    const acceptBg = this.add.rectangle(width / 2 - 100, btnY, 163, 50, hexToNum(COLOR_UI_PRIMARY));
    acceptBg.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 - 100, btnY, 'ACCEPT', {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    acceptBg.on('pointerdown', () => {
      missionManager.startMission(mission.id);
      this.scene.stop('MissionBriefScene');
    });
    acceptBg.on('pointerover', () => acceptBg.setFillStyle(hexToNum('#ff8f00')));
    acceptBg.on('pointerout', () => acceptBg.setFillStyle(hexToNum(COLOR_UI_PRIMARY)));

    const backBg = this.add.rectangle(width / 2 + 100, btnY, 163, 50, 0x555555);
    backBg.setInteractive({ useHandCursor: true });
    this.add.text(width / 2 + 100, btnY, 'BACK', {
      fontSize: '20px', color: '#cccccc', fontStyle: 'bold',
    }).setOrigin(0.5);

    backBg.on('pointerdown', () => {
      this.scene.stop('MissionBriefScene');
    });
  }
}
