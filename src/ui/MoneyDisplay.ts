import Phaser from 'phaser';
import { hexToNum, COLOR_UI_MONEY, COLOR_UI_SUCCESS, COLOR_UI_DANGER } from '@/graphics/colors';
import { MINIMAP_SIZE, HUD_PADDING } from '@/config/constants';

export class MoneyDisplay {
  private container: Phaser.GameObjects.Container;
  private balanceText: Phaser.GameObjects.Text;
  private changeText: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;
  private displayedBalance: number = 0;
  private targetBalance: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const x = scene.cameras.main.width - MINIMAP_SIZE - HUD_PADDING;
    const y = HUD_PADDING + MINIMAP_SIZE + 20;

    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(999);

    // Coin icon
    const coin = scene.add.circle(15, 15, 13, hexToNum(COLOR_UI_MONEY));
    this.container.add(coin);

    // Balance text
    this.balanceText = scene.add.text(40, 0, '$0', {
      fontSize: '25px',
      color: COLOR_UI_MONEY,
      fontStyle: 'bold',
    });
    this.container.add(this.balanceText);

    // Change popup text (floats up)
    this.changeText = scene.add.text(40, -25, '', {
      fontSize: '22px',
      color: COLOR_UI_SUCCESS,
      fontStyle: 'bold',
    });
    this.changeText.setAlpha(0);
    this.container.add(this.changeText);
  }

  setBalance(amount: number): void {
    this.targetBalance = amount;
    this.displayedBalance = amount;
    this.balanceText.setText('$' + amount);
  }

  animateChange(delta: number, isEarn: boolean): void {
    this.changeText.setText((isEarn ? '+$' : '-$') + Math.abs(delta));
    this.changeText.setColor(isEarn ? COLOR_UI_SUCCESS : COLOR_UI_DANGER);
    this.changeText.setAlpha(1);
    this.changeText.setY(-25);

    this.scene.tweens.add({
      targets: this.changeText,
      y: -63,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
    });
  }

  updateBalance(newBalance: number): void {
    const diff = newBalance - this.displayedBalance;
    if (diff === 0) return;

    this.animateChange(Math.abs(diff), diff > 0);
    this.targetBalance = newBalance;

    // Count animation
    this.scene.tweens.addCounter({
      from: this.displayedBalance,
      to: newBalance,
      duration: 500,
      onUpdate: (tween) => {
        const val = Math.floor(tween.getValue() ?? 0);
        this.balanceText.setText('$' + val);
      },
      onComplete: () => {
        this.displayedBalance = newBalance;
        this.balanceText.setText('$' + newBalance);
      },
    });
  }

  destroy(): void {
    this.changeText.destroy();
    this.balanceText.destroy();
    this.container.destroy();
  }
}
