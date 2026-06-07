import Phaser from 'phaser';
import { MissionDefinition } from '@/types/game.types';
import { hexToNum, COLOR_UI_SURFACE, COLOR_UI_PRIMARY, COLOR_UI_DANGER } from '@/graphics/colors';
import { HUD_PADDING } from '@/config/constants';

export class MissionTracker {
  private container: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private objectiveTexts: Phaser.GameObjects.Text[] = [];
  private timerText: Phaser.GameObjects.Text;
  private background: Phaser.GameObjects.Rectangle;
  private scene: Phaser.Scene;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.container = scene.add.container(HUD_PADDING, 75);
    this.container.setScrollFactor(0);
    this.container.setDepth(997);

    // Background
    this.background = scene.add.rectangle(175, 75, 375, 150, hexToNum(COLOR_UI_SURFACE), 0.8);
    this.container.add(this.background);

    // Title
    this.titleText = scene.add.text(25, 20, '', {
      fontSize: '22px',
      color: COLOR_UI_PRIMARY,
      fontStyle: 'bold',
    });
    this.container.add(this.titleText);

    // Timer
    this.timerText = scene.add.text(325, 20, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.container.add(this.timerText);

    this.container.setVisible(false);
  }

  setMission(mission: MissionDefinition): void {
    // Clear old objectives
    for (const t of this.objectiveTexts) {
      t.destroy();
    }
    this.objectiveTexts = [];

    this.titleText.setText(mission.title);

    let y = 55;
    for (const obj of mission.objectives) {
      const prefix = obj.optional ? '  (bonus) ' : '  [ ] ';
      const t = this.scene.add.text(25, y, prefix + obj.description + ` (0/${obj.count})`, {
        fontSize: '18px',
        color: obj.optional ? '#aaaaaa' : '#dddddd',
      });
      this.objectiveTexts.push(t);
      this.container.add(t);
      y += 30;
    }

    // Resize background
    const bgHeight = 50 + mission.objectives.length * 30 + 13;
    this.background.setSize(375, bgHeight);
    this.background.setPosition(175, bgHeight / 2 + 8);

    if (mission.timeLimit !== null) {
      this.updateTimer(mission.timeLimit);
    } else {
      this.timerText.setText('');
    }

    this.container.setVisible(true);
    this.isVisible = true;
  }

  updateObjective(objectiveIndex: number, current: number, target: number, completed: boolean): void {
    if (objectiveIndex < 0 || objectiveIndex >= this.objectiveTexts.length) return;

    const text = this.objectiveTexts[objectiveIndex];
    const rawText = text.text;

    // Extract description between prefix and count
    if (completed) {
      text.setText(rawText.replace('[ ]', '[X]'));
      text.setColor('#4caf50');
    } else {
      // Update count
      const countMatch = rawText.match(/\(\d+\/\d+\)/);
      if (countMatch) {
        text.setText(rawText.replace(countMatch[0], `(${current}/${target})`));
      }
    }
  }

  updateTimer(seconds: number): void {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    this.timerText.setText(timeStr);

    // Turn red when under 30 seconds
    if (seconds < 30) {
      this.timerText.setColor(COLOR_UI_DANGER);
    } else {
      this.timerText.setColor('#ffffff');
    }
  }

  clear(): void {
    for (const t of this.objectiveTexts) {
      t.destroy();
    }
    this.objectiveTexts = [];
    this.titleText.setText('');
    this.timerText.setText('');
    this.container.setVisible(false);
    this.isVisible = false;
  }

  getVisible(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    for (const obj of this.objectiveTexts) {
      obj.destroy();
    }
    this.objectiveTexts = [];
    this.titleText.destroy();
    this.timerText.destroy();
    this.background.destroy();
    this.container.destroy();
  }
}
