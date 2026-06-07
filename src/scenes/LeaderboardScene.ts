import Phaser from 'phaser';
import { LeaderboardSystem, LeaderboardEntry } from '@/systems/LeaderboardSystem';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_BACKGROUND, COLOR_UI_SURFACE, COLOR_UI_MONEY } from '@/graphics/colors';

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const leaderboard = this.game.registry.get('leaderboard') as LeaderboardSystem;

    this.cameras.main.setBackgroundColor(COLOR_UI_BACKGROUND);

    // Title
    this.add.text(width / 2, 50, 'LEADERBOARD', {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(38, 38, '< BACK', {
      fontSize: '25px', color: COLOR_UI_PRIMARY,
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.stop('LeaderboardScene'));

    // Column headers
    const headerY = 120;
    this.add.text(50, headerY, 'RANK', { fontSize: '20px', color: COLOR_UI_PRIMARY, fontStyle: 'bold' });
    this.add.text(138, headerY, 'NAME', { fontSize: '20px', color: COLOR_UI_PRIMARY, fontStyle: 'bold' });
    this.add.text(375, headerY, 'CLASS', { fontSize: '20px', color: COLOR_UI_PRIMARY, fontStyle: 'bold' });
    this.add.text(525, headerY, 'LVL', { fontSize: '20px', color: COLOR_UI_PRIMARY, fontStyle: 'bold' });
    this.add.text(613, headerY, 'MISSIONS', { fontSize: '20px', color: COLOR_UI_PRIMARY, fontStyle: 'bold' });
    this.add.text(775, headerY, 'SCORE', { fontSize: '20px', color: COLOR_UI_PRIMARY, fontStyle: 'bold' });

    // Divider
    this.add.rectangle(width / 2, headerY + 30, width - 50, 2, 0x444444);

    // Entries
    const entries = leaderboard?.getTopEntries(15) ?? [];
    let y = headerY + 55;

    if (entries.length === 0) {
      this.add.text(width / 2, height / 2, 'No scores yet.\nComplete missions to get on the board!', {
        fontSize: '25px', color: '#888888', align: 'center',
      }).setOrigin(0.5);
    } else {
      entries.forEach((entry, idx) => {
        const rank = idx + 1;
        const rankColor = rank <= 3 ? COLOR_UI_MONEY : '#ffffff';

        this.add.text(70, y, `${rank}`, { fontSize: '22px', color: rankColor, fontStyle: rank <= 3 ? 'bold' : 'normal' }).setOrigin(0.5, 0);
        this.add.text(138, y, entry.playerName, { fontSize: '20px', color: '#dddddd' });
        this.add.text(375, y, entry.characterClass.toUpperCase(), { fontSize: '20px', color: '#aaaaaa' });
        this.add.text(545, y, `${entry.level}`, { fontSize: '20px', color: '#dddddd' }).setOrigin(0.5, 0);
        this.add.text(670, y, `${entry.missionsCompleted}`, { fontSize: '20px', color: '#dddddd' }).setOrigin(0.5, 0);
        this.add.text(813, y, `${entry.score}`, { fontSize: '22px', color: COLOR_UI_MONEY, fontStyle: 'bold' }).setOrigin(0.5, 0);

        // Row divider
        this.add.rectangle(width / 2, y + 35, width - 50, 2, 0x2a2a3a);

        y += 50;
      });
    }
  }
}
