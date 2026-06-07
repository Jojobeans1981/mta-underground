import Phaser from 'phaser';
import { ProgressionManager } from '@/managers/ProgressionManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { ItemDefinition, SkinDefinition } from '@/types/game.types';
import {
  hexToNum,
  COLOR_UI_PRIMARY,
  COLOR_UI_BACKGROUND,
  COLOR_UI_SURFACE,
  COLOR_UI_SUCCESS,
  COLOR_UI_DANGER,
  COLOR_UI_MONEY,
  COLOR_UI_TEXT_DIM,
} from '@/graphics/colors';

const RARITY_COLORS: Record<string, string> = {
  common: '#ffffff',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
};

export class ShopScene extends Phaser.Scene {
  private progressionManager: ProgressionManager | null = null;
  private economyManager: EconomyManager | null = null;
  private currentTab: 'equipment' | 'skins' = 'equipment';
  private contentContainer: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'ShopScene' });
  }

  create(): void {
    this.progressionManager = this.game.registry.get('progressionManager') as ProgressionManager;
    this.economyManager = this.game.registry.get('economyManager') as EconomyManager;

    const { width, height } = this.cameras.main;
    this.cameras.main.setBackgroundColor(COLOR_UI_BACKGROUND);

    // Title
    this.add.text(width / 2, 50, 'TRANSIT SUPPLY', {
      fontSize: '40px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    // Balance display
    this.add.text(width / 2, 100, `Balance: $${this.economyManager?.getBalance() ?? 0}`, {
      fontSize: '25px', color: COLOR_UI_MONEY, fontStyle: 'bold',
    }).setOrigin(0.5);

    // Back button
    const backBtn = this.add.text(38, 38, '< BACK', {
      fontSize: '25px', color: COLOR_UI_PRIMARY,
    }).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.stop('ShopScene'));

    // Tabs
    const eqTab = this.add.text(width * 0.3, 145, 'EQUIPMENT', {
      fontSize: '25px', color: '#ffffff', fontStyle: 'bold',
      backgroundColor: COLOR_UI_PRIMARY, padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const skinTab = this.add.text(width * 0.7, 145, 'SKINS', {
      fontSize: '25px', color: COLOR_UI_TEXT_DIM,
      backgroundColor: COLOR_UI_SURFACE, padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    eqTab.on('pointerdown', () => {
      this.currentTab = 'equipment';
      eqTab.setColor('#ffffff').setBackgroundColor(COLOR_UI_PRIMARY);
      skinTab.setColor(COLOR_UI_TEXT_DIM).setBackgroundColor(COLOR_UI_SURFACE);
      this.renderContent();
    });

    skinTab.on('pointerdown', () => {
      this.currentTab = 'skins';
      skinTab.setColor('#ffffff').setBackgroundColor(COLOR_UI_PRIMARY);
      eqTab.setColor(COLOR_UI_TEXT_DIM).setBackgroundColor(COLOR_UI_SURFACE);
      this.renderContent();
    });

    this.renderContent();
  }

  private renderContent(): void {
    this.contentContainer?.destroy();
    this.contentContainer = this.add.container(0, 188);

    if (this.currentTab === 'equipment') {
      this.renderEquipmentTab();
    } else {
      this.renderSkinsTab();
    }
  }

  private renderEquipmentTab(): void {
    if (!this.progressionManager || !this.contentContainer) return;

    const items = this.progressionManager.getAllItems();
    const owned = this.progressionManager.getOwnedItems();
    const equipped = this.progressionManager.getEquippedItems();
    const level = this.progressionManager.getLevel();
    const width = this.cameras.main.width;

    let y = 25;
    for (const item of items) {
      this.renderItemCard(item, owned, equipped, level, y, width);
      y += 170;
    }
  }

  private renderItemCard(
    item: ItemDefinition,
    owned: string[],
    equipped: string[],
    level: number,
    y: number,
    width: number
  ): void {
    if (!this.contentContainer) return;

    const isOwned = owned.includes(item.id);
    const isEquipped = equipped.includes(item.id);
    const isLevelLocked = level < item.levelRequired;

    // Card background
    const card = this.add.rectangle(width / 2, y + 70, width - 50, 150, hexToNum(COLOR_UI_SURFACE), 0.9);
    card.setStrokeStyle(2, isEquipped ? hexToNum(COLOR_UI_SUCCESS) : 0x444444);
    this.contentContainer.add(card);

    // Icon
    const iconColor = hexToNum(item.icon.primaryColor);
    const icon = this.add.rectangle(63, y + 70, 50, 50, iconColor);
    this.contentContainer.add(icon);

    // Name + rarity
    const rarityColor = RARITY_COLORS[item.rarity] ?? '#ffffff';
    this.contentContainer.add(
      this.add.text(113, y + 25, item.name, { fontSize: '25px', color: rarityColor, fontStyle: 'bold' })
    );

    // Description
    this.contentContainer.add(
      this.add.text(113, y + 58, item.description, { fontSize: '18px', color: '#aaaaaa' })
    );

    // Effects
    const effectStr = item.effects.map((e) => {
      if (e.stat === 'speed') return `+${Math.round((e.modifier - 1) * 100)}% speed`;
      if (e.stat === 'stamina') return `+${Math.round((e.modifier - 1) * 100)}% stamina`;
      if (e.stat === 'detection_range') return `Range: ${e.modifier}px`;
      if (e.stat === 'xp_multiplier') return `+${Math.round((e.modifier - 1) * 100)}% XP`;
      return `${e.stat}: ${e.modifier}`;
    }).join(', ');
    this.contentContainer.add(
      this.add.text(113, y + 85, effectStr, { fontSize: '18px', color: COLOR_UI_PRIMARY })
    );

    // Button area (right side)
    const btnX = width - 138;
    const btnY = y + 70;

    if (isEquipped) {
      this.contentContainer.add(
        this.add.text(btnX, btnY, 'EQUIPPED', { fontSize: '20px', color: COLOR_UI_SUCCESS, fontStyle: 'bold' }).setOrigin(0.5)
      );
    } else if (isOwned) {
      const equipBtn = this.add.rectangle(btnX, btnY, 125, 50, hexToNum('#1565c0'));
      equipBtn.setInteractive({ useHandCursor: true });
      this.contentContainer.add(equipBtn);
      this.contentContainer.add(
        this.add.text(btnX, btnY, 'EQUIP', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5)
      );
      equipBtn.on('pointerdown', () => {
        this.progressionManager?.equipItem(item.id);
        this.renderContent();
      });
    } else if (isLevelLocked) {
      this.contentContainer.add(
        this.add.text(btnX, btnY, `LVL ${item.levelRequired}`, { fontSize: '20px', color: COLOR_UI_DANGER, fontStyle: 'bold' }).setOrigin(0.5)
      );
    } else {
      // Buyable
      const canAfford = this.economyManager?.canAfford(item.price) ?? false;
      const buyBtn = this.add.rectangle(btnX, btnY, 125, 50, canAfford ? hexToNum(COLOR_UI_PRIMARY) : 0x555555);
      buyBtn.setInteractive({ useHandCursor: true });
      this.contentContainer.add(buyBtn);
      this.contentContainer.add(
        this.add.text(btnX, btnY, `$${item.price}`, {
          fontSize: '20px', color: canAfford ? '#ffffff' : '#888888', fontStyle: 'bold',
        }).setOrigin(0.5)
      );

      if (canAfford) {
        buyBtn.on('pointerdown', () => {
          if (this.progressionManager?.purchaseItem(item.id)) {
            this.renderContent();
          }
        });
      }
    }
  }

  private renderSkinsTab(): void {
    if (!this.progressionManager || !this.contentContainer) return;

    const skins = this.progressionManager.getAllSkins();
    const ownedSkins = this.progressionManager.getOwnedSkins();
    const activeSkin = this.progressionManager.getActiveSkin();
    const level = this.progressionManager.getLevel();
    const width = this.cameras.main.width;

    let y = 25;
    for (const skin of skins) {
      this.renderSkinCard(skin, ownedSkins, activeSkin, level, y, width);
      y += 170;
    }
  }

  private renderSkinCard(
    skin: SkinDefinition,
    ownedSkins: string[],
    activeSkin: string,
    level: number,
    y: number,
    width: number
  ): void {
    if (!this.contentContainer) return;

    const isOwned = ownedSkins.includes(skin.id);
    const isActive = activeSkin === skin.id;
    const isLevelLocked = level < skin.levelRequired;

    // Card background
    const card = this.add.rectangle(width / 2, y + 70, width - 50, 150, hexToNum(COLOR_UI_SURFACE), 0.9);
    card.setStrokeStyle(2, isActive ? hexToNum(COLOR_UI_SUCCESS) : 0x444444);
    this.contentContainer.add(card);

    // Character preview (larger colored rect)
    const bodyColor = hexToNum(skin.spriteConfig.primaryColor);
    const headColor = hexToNum(skin.spriteConfig.secondaryColor);
    const body = this.add.rectangle(63, y + 80, 40, 55, bodyColor);
    const head = this.add.rectangle(63, y + 40, 25, 25, headColor);
    this.contentContainer.add(body);
    this.contentContainer.add(head);

    if (!isOwned && !isActive) {
      body.setAlpha(0.5);
      head.setAlpha(0.5);
    }

    // Name
    this.contentContainer.add(
      this.add.text(113, y + 45, skin.name, { fontSize: '25px', color: isOwned ? '#ffffff' : '#888888', fontStyle: 'bold' })
    );

    // Button
    const btnX = width - 138;
    const btnY = y + 70;

    if (isActive) {
      this.contentContainer.add(
        this.add.text(btnX, btnY, 'ACTIVE', { fontSize: '20px', color: COLOR_UI_SUCCESS, fontStyle: 'bold' }).setOrigin(0.5)
      );
    } else if (isOwned) {
      const equipBtn = this.add.rectangle(btnX, btnY, 125, 50, hexToNum('#1565c0'));
      equipBtn.setInteractive({ useHandCursor: true });
      this.contentContainer.add(equipBtn);
      this.contentContainer.add(
        this.add.text(btnX, btnY, 'EQUIP', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5)
      );
      equipBtn.on('pointerdown', () => {
        this.progressionManager?.equipSkin(skin.id);
        this.renderContent();
      });
    } else if (isLevelLocked) {
      this.contentContainer.add(
        this.add.text(btnX, btnY, `LVL ${skin.levelRequired}`, { fontSize: '20px', color: COLOR_UI_DANGER, fontStyle: 'bold' }).setOrigin(0.5)
      );
    } else {
      const canAfford = this.economyManager?.canAfford(skin.price) ?? false;
      const buyBtn = this.add.rectangle(btnX, btnY, 125, 50, canAfford ? hexToNum(COLOR_UI_PRIMARY) : 0x555555);
      buyBtn.setInteractive({ useHandCursor: true });
      this.contentContainer.add(buyBtn);
      this.contentContainer.add(
        this.add.text(btnX, btnY, `$${skin.price}`, {
          fontSize: '20px', color: canAfford ? '#ffffff' : '#888888', fontStyle: 'bold',
        }).setOrigin(0.5)
      );
      if (canAfford) {
        buyBtn.on('pointerdown', () => {
          if (this.progressionManager?.purchaseSkin(skin.id)) {
            this.renderContent();
          }
        });
      }
    }
  }
}
