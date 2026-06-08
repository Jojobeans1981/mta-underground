import Phaser from 'phaser';
import { NPCType } from '@/types/game.types';
import { hexToNum, COLOR_UI_SURFACE, COLOR_UI_TEXT, COLOR_UI_PRIMARY } from '@/graphics/colors';

const NPC_TYPE_LABELS: Record<NPCType, string> = {
  civilian: 'Commuter',
  fare_evader: 'Suspect',
  suspicious_person: 'Unknown Individual',
  lost_tourist: 'Tourist',
  vendor: 'Vendor',
  musician: 'Musician',
  commuter: 'Commuter',
};

export class DialogueSystem {
  private container: Phaser.GameObjects.Container;
  private nameText: Phaser.GameObjects.Text;
  private dialogueText: Phaser.GameObjects.Text;
  private isShowing: boolean = false;
  private displayTimer: number = 0;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    this.container = scene.add.container(0, height - 80);
    this.container.setScrollFactor(0);
    this.container.setDepth(998);

    // Background
    const bg = scene.add.rectangle(
      width / 2,
      0,
      width - 20,
      60,
      hexToNum(COLOR_UI_SURFACE),
      0.9
    );
    bg.setStrokeStyle(1, hexToNum(COLOR_UI_PRIMARY));
    this.container.add(bg);

    // NPC name
    this.nameText = scene.add.text(20, -18, '', {
      fontSize: '11px',
      color: COLOR_UI_PRIMARY,
      fontStyle: 'bold',
    });
    this.container.add(this.nameText);

    // Dialogue text
    this.dialogueText = scene.add.text(20, 0, '', {
      fontSize: '10px',
      color: COLOR_UI_TEXT,
      wordWrap: { width: width - 60 },
    });
    this.container.add(this.dialogueText);

    // Start hidden
    this.container.setVisible(false);
    this.container.setAlpha(0);
  }

  show(npcType: NPCType, line: string): void {
    if (this.isShowing) return;
    const label = NPC_TYPE_LABELS[npcType] ?? 'Unknown';
    this.present(label, line);
  }

  /** Show dialogue for a Living-City agent with a custom name + mood tag. */
  showAgent(name: string, line: string, moodLabel?: string): void {
    if (this.isShowing) return;
    const header = moodLabel ? `${name}  ·  ${moodLabel}` : name;
    this.present(header, line);
  }

  private present(header: string, line: string): void {
    this.nameText.setText(header);
    this.dialogueText.setText('"' + line + '"');

    this.container.setVisible(true);
    this.isShowing = true;
    this.displayTimer = 3.0;

    // Fade in
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });
  }

  hide(): void {
    if (!this.isShowing) return;

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.container.setVisible(false);
        this.isShowing = false;
      },
    });
  }

  update(delta: number): void {
    if (!this.isShowing) return;

    this.displayTimer -= delta / 1000;
    if (this.displayTimer <= 0) {
      this.hide();
    }
  }

  isVisible(): boolean {
    return this.isShowing;
  }
}
