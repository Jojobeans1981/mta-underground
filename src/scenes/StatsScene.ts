import Phaser from 'phaser';
import { SaveManager } from '@/managers/SaveManager';
import { ProgressionManager } from '@/managers/ProgressionManager';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_BACKGROUND, COLOR_UI_SURFACE, COLOR_UI_XP, COLOR_UI_MONEY } from '@/graphics/colors';

export class StatsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StatsScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const saveManager = this.game.registry.get('saveManager') as SaveManager;
    const progressionManager = this.game.registry.get('progressionManager') as ProgressionManager;

    this.cameras.main.setBackgroundColor(COLOR_UI_BACKGROUND);

    const save = saveManager.load();
    if (!save) {
      this.add.text(width / 2, height / 2, 'No save data', { fontSize: '35px', color: '#888888' }).setOrigin(0.5);
      return;
    }

    const classProgress = save.classes[save.selectedClass];

    // Title
    this.add.text(width / 2, 50, 'OFFICER STATS', {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(38, 38, '< BACK', {
      fontSize: '25px', color: COLOR_UI_PRIMARY,
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.stop('StatsScene'));

    // Character badge
    const badge = this.add.rectangle(width / 2, 138, 75, 75, hexToNum('#1a237e'));
    this.add.text(width / 2, 138, save.selectedClass.toUpperCase().charAt(0), {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Level display
    this.add.text(width / 2, 200, `Level ${classProgress.level}`, {
      fontSize: '35px', color: COLOR_UI_XP, fontStyle: 'bold',
    }).setOrigin(0.5);

    // XP bar
    const barW = 400;
    const barX = width / 2 - barW / 2;
    const barY = 238;
    this.add.rectangle(width / 2, barY + 8, barW, 15, hexToNum(COLOR_UI_SURFACE));
    const progress = classProgress.xpToNextLevel > 0
      ? classProgress.xp / classProgress.xpToNextLevel
      : 1;
    this.add.rectangle(barX + (progress * barW) / 2, barY + 8, progress * barW, 15, hexToNum(COLOR_UI_XP)).setOrigin(0, 0.5);
    this.add.text(width / 2, barY + 30, `${classProgress.xp} / ${classProgress.xpToNextLevel} XP`, {
      fontSize: '18px', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Stats list
    const stats = save.stats;
    const statLines = [
      { label: 'Total Play Time', value: this.formatTime(stats.totalPlayTime) },
      { label: 'Missions Completed', value: `${stats.totalMissionsCompleted}` },
      { label: 'Missions Failed', value: `${stats.missionsFailedCount}` },
      { label: 'Total Money Earned', value: `$${stats.totalMoneyEarned}` },
      { label: 'Total Money Spent', value: `$${stats.totalMoneySpent}` },
      { label: 'Current Balance', value: `$${save.wallet}` },
      { label: 'Total XP Earned', value: `${stats.totalXpEarned}` },
      { label: 'NPCs Caught', value: `${stats.npcsCaught}` },
      { label: 'Street Cred', value: `${stats.streetCred ?? 0}` },
      { label: 'Tags Placed', value: `${stats.tagsPlaced ?? 0}` },
      { label: 'Completion', value: `${classProgress.completedMissionIds.length}/10 missions` },
    ];

    let y = 313;
    for (const stat of statLines) {
      this.add.text(75, y, stat.label, { fontSize: '22px', color: '#aaaaaa' });
      this.add.text(width - 75, y, stat.value, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0);
      // Divider line
      this.add.rectangle(width / 2, y + 40, width - 100, 2, 0x333333);
      y += 55;
    }
  }

  private formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
