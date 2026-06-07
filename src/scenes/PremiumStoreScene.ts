import Phaser from 'phaser';
import { IAPManager, IAPProduct } from '@/managers/IAPManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { AdManager } from '@/managers/AdManager';
import { hexToNum, COLOR_UI_PRIMARY, COLOR_UI_BACKGROUND, COLOR_UI_SURFACE, COLOR_UI_MONEY, COLOR_UI_SUCCESS } from '@/graphics/colors';

export class PremiumStoreScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PremiumStoreScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;
    const iapManager = this.game.registry.get('iapManager') as IAPManager;
    const adManager = this.game.registry.get('adManager') as AdManager;

    this.cameras.main.setBackgroundColor(COLOR_UI_BACKGROUND);

    // Title
    this.add.text(width / 2, 50, 'PREMIUM STORE', {
      fontSize: '40px', color: COLOR_UI_MONEY, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(38, 38, '< BACK', {
      fontSize: '25px', color: COLOR_UI_PRIMARY,
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.stop('PremiumStoreScene'));

    // Products
    const products = iapManager?.getProducts() ?? [];
    let y = 138;

    for (const product of products) {
      this.renderProductCard(product, y, width, iapManager);
      y += 163;
    }

    // Rewarded ad section
    y += 25;
    this.add.rectangle(width / 2, y + 13, width - 50, 2, hexToNum(COLOR_UI_PRIMARY));
    y += 38;

    this.add.text(width / 2, y, 'WATCH AD FOR REWARDS', {
      fontSize: '25px', color: COLOR_UI_PRIMARY, fontStyle: 'bold',
    }).setOrigin(0.5);
    y += 50;

    if (!adManager?.isAdFreeMode()) {
      const adBtn = this.add.rectangle(width / 2, y + 30, 450, 70, hexToNum(COLOR_UI_SUCCESS));
      adBtn.setInteractive({ useHandCursor: true });
      this.add.text(width / 2, y + 30, 'Watch Ad → $100 Free', {
        fontSize: '25px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      adBtn.on('pointerdown', async () => {
        const watched = await adManager?.showRewarded('money', 100);
        if (watched) {
          const econ = this.game.registry.get('economyManager') as EconomyManager;
          econ?.earn(100, 'rewarded_ad');
        }
      });
    } else {
      this.add.text(width / 2, y + 30, 'Ad-Free Mode Active', {
        fontSize: '22px', color: COLOR_UI_SUCCESS,
      }).setOrigin(0.5);
    }
  }

  private renderProductCard(
    product: IAPProduct,
    y: number,
    width: number,
    iapManager: IAPManager
  ): void {
    const purchased = iapManager?.isProductPurchased(product.id);

    // Card
    const card = this.add.rectangle(width / 2, y + 55, width - 50, 125, hexToNum(COLOR_UI_SURFACE), 0.9);
    card.setStrokeStyle(2, purchased ? hexToNum(COLOR_UI_SUCCESS) : 0x444444);

    // Name
    this.add.text(38, y + 25, product.name, {
      fontSize: '25px', color: '#ffffff', fontStyle: 'bold',
    });

    // Description
    this.add.text(38, y + 63, product.description, {
      fontSize: '18px', color: '#aaaaaa',
    });

    // Price / Status
    const btnX = width - 125;
    const btnY = y + 55;

    if (purchased) {
      this.add.text(btnX, btnY, 'OWNED', {
        fontSize: '22px', color: COLOR_UI_SUCCESS, fontStyle: 'bold',
      }).setOrigin(0.5);
    } else {
      const btn = this.add.rectangle(btnX, btnY, 138, 55, hexToNum(COLOR_UI_PRIMARY));
      btn.setInteractive({ useHandCursor: true });
      this.add.text(btnX, btnY, product.price, {
        fontSize: '22px', color: '#ffffff', fontStyle: 'bold',
      }).setOrigin(0.5);

      btn.on('pointerdown', async () => {
        const success = await iapManager?.purchase(product.id);
        if (success) {
          // Apply reward
          this.applyReward(product);
          this.scene.restart(); // Refresh UI
        }
      });
    }
  }

  private applyReward(product: IAPProduct): void {
    const economyManager = this.game.registry.get('economyManager') as EconomyManager;
    const adManager = this.game.registry.get('adManager') as AdManager;

    switch (product.rewardType) {
      case 'money':
        economyManager?.earn(product.rewardValue as number, 'iap_' + product.id);
        break;
      case 'ad_free':
        adManager?.setAdFree(true);
        break;
      case 'xp_boost':
        // Store boost in registry for ProgressionManager to read
        this.game.registry.set('xpBoostMultiplier', product.rewardValue);
        break;
    }
  }
}
