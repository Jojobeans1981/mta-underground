import Phaser from 'phaser';

/**
 * Kill-feed / action-feed in the top-right corner.
 * Shows a scrolling log of recent actions:
 * "Caught Fare Evader +$100"
 * "Near Miss! +$25"
 * "Power-Up: Turbo Boost!"
 * "Achievement: Beat Cop"
 */

interface FeedEntry {
  text: Phaser.GameObjects.Text;
  timer: number;
}

export class ActionFeed {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private entries: FeedEntry[] = [];
  private maxEntries: number = 5;
  private entryHeight: number = 16;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width } = scene.cameras.main;

    this.container = scene.add.container(width - 10, 45);
    this.container.setScrollFactor(0).setDepth(993);
  }

  /** Add an action to the feed */
  push(message: string, color: string = '#ffffff', icon: string = ''): void {
    const display = icon ? `${icon} ${message}` : message;

    // Create text
    const text = this.scene.add.text(0, 0, display, {
      fontSize: '10px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'right',
    }).setOrigin(1, 0);

    // Slide in from right
    text.setAlpha(0).setX(30);
    this.scene.tweens.add({
      targets: text, alpha: 1, x: 0,
      duration: 200, ease: 'Power2',
    });

    this.container.add(text);
    this.entries.push({ text, timer: 4 }); // 4 seconds display

    // Remove oldest if over max
    while (this.entries.length > this.maxEntries) {
      const old = this.entries.shift();
      if (old) {
        old.text.destroy();
      }
    }

    // Re-position all entries
    this.layoutEntries();
  }

  update(delta: number): void {
    const dt = delta / 1000;

    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];
      entry.timer -= dt;

      // Fade out in last second
      if (entry.timer < 1) {
        entry.text.setAlpha(entry.timer);
      }

      if (entry.timer <= 0) {
        entry.text.destroy();
        this.entries.splice(i, 1);
        this.layoutEntries();
      }
    }
  }

  private layoutEntries(): void {
    for (let i = 0; i < this.entries.length; i++) {
      const targetY = i * this.entryHeight;
      this.scene.tweens.add({
        targets: this.entries[i].text,
        y: targetY,
        duration: 150,
        ease: 'Power2',
      });
    }
  }

  // Convenience methods
  caught(reward: number): void {
    this.push(`Caught Evader +$${reward}`, '#ff6f00', '🚨');
  }

  nearMiss(): void {
    this.push('Near Miss! +$25', '#00e5ff', '🚗');
  }

  powerUp(name: string): void {
    this.push(`Power-Up: ${name}`, '#d500f9', '⚡');
  }

  achievement(name: string): void {
    this.push(`Achievement: ${name}`, '#ffd700', '🏆');
  }

  missionStart(title: string): void {
    this.push(`Mission: ${title}`, '#ff6f00', '📋');
  }

  missionComplete(): void {
    this.push('Mission Complete!', '#4caf50', '✅');
  }

  missionFailed(): void {
    this.push('Mission Failed', '#f44336', '❌');
  }

  eventCollected(title: string, reward: number): void {
    this.push(`${title} +$${reward}`, '#4caf50', '💚');
  }

  levelUp(level: number): void {
    this.push(`Level Up! Now Level ${level}`, '#ffd700', '⭐');
  }

  abilityUsed(name: string): void {
    this.push(`${name} Activated!`, '#00e5ff', '💥');
  }
}
