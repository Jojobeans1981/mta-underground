import { PlayerSave, CharacterClass, ClassProgress, ItemDefinition, ItemEffect, SkinDefinition } from '@/types/game.types';
import { GameEvents } from '@/types/events.types';
import { SaveManager } from '@/managers/SaveManager';
import { EconomyManager } from '@/managers/EconomyManager';
import { calculateXPRequired, MAX_LEVEL } from '@/config/balance';
import { POLICE_ITEMS } from '@/data/items/police-items';
import { RIDER_ITEMS, RIDER_SKINS } from '@/data/items/rider-items';
import { DRIVER_ITEMS, DRIVER_SKINS } from '@/data/items/driver-items';
import { POLICE_SKINS } from '@/data/skins';
import { POLICE_MISSIONS } from '@/data/missions/police-missions';
import { RIDER_MISSIONS } from '@/data/missions/rider-missions';
import { DRIVER_MISSIONS } from '@/data/missions/driver-missions';
import Phaser from 'phaser';

export class ProgressionManager {
  private currentClass: CharacterClass = 'police';
  private saveManager: SaveManager | null = null;
  private economyManager: EconomyManager | null = null;
  private events: Phaser.Events.EventEmitter | null = null;

  init(
    save: PlayerSave,
    saveManager: SaveManager,
    economyManager: EconomyManager,
    events: Phaser.Events.EventEmitter
  ): void {
    this.currentClass = save.selectedClass;
    this.saveManager = saveManager;
    this.economyManager = economyManager;
    this.events = events;
  }

  private getClassProgress(): ClassProgress | null {
    const save = this.saveManager?.load();
    if (!save) return null;
    return save.classes[this.currentClass];
  }

  private saveClassProgress(progress: ClassProgress): void {
    const save = this.saveManager?.load();
    if (!save) return;
    save.classes[this.currentClass] = progress;
    this.saveManager?.save(save);
  }

  addXP(amount: number, source: string): { leveledUp: boolean; newLevel: number; xpGained: number } {
    const progress = this.getClassProgress();
    if (!progress) return { leveledUp: false, newLevel: 1, xpGained: 0 };

    // Apply XP multiplier from equipped items
    const effects = this.getEquippedEffects();
    let multiplier = 1;
    for (const e of effects) {
      if (e.stat === 'xp_multiplier') multiplier *= e.modifier;
    }
    const actualAmount = Math.floor(amount * multiplier);

    progress.xp += actualAmount;
    let leveledUp = false;
    const startLevel = progress.level;

    // Level up loop
    while (progress.level < MAX_LEVEL && progress.xp >= progress.xpToNextLevel) {
      progress.xp -= progress.xpToNextLevel;
      progress.level++;
      progress.xpToNextLevel = calculateXPRequired(progress.level + 1);
      leveledUp = true;
    }

    // Cap at max level
    if (progress.level >= MAX_LEVEL) {
      progress.level = MAX_LEVEL;
      progress.xp = 0;
      progress.xpToNextLevel = 0;
    }

    // Update stats
    const save = this.saveManager?.load();
    if (save) {
      save.stats.totalXpEarned += actualAmount;
      if (progress.level > save.stats.highestLevel) {
        save.stats.highestLevel = progress.level;
      }
      save.classes[this.currentClass] = progress;
      this.saveManager?.save(save);
    }

    // Emit events
    this.events?.emit(GameEvents.XP_EARNED, { amount: actualAmount, source });

    if (leveledUp) {
      this.events?.emit(GameEvents.LEVEL_UP, { newLevel: progress.level });

      // Check unlocks
      const unlocked = this.checkUnlocks(progress);
      for (const id of unlocked) {
        this.events?.emit(GameEvents.MISSION_UNLOCKED, { id });
      }
    }

    return { leveledUp, newLevel: progress.level, xpGained: actualAmount };
  }

  getLevel(): number {
    return this.getClassProgress()?.level ?? 1;
  }

  getXP(): number {
    return this.getClassProgress()?.xp ?? 0;
  }

  getXPToNextLevel(): number {
    return this.getClassProgress()?.xpToNextLevel ?? 200;
  }

  getXPProgress(): number {
    const toNext = this.getXPToNextLevel();
    if (toNext <= 0) return 1;
    return this.getXP() / toNext;
  }

  isMaxLevel(): boolean {
    return this.getLevel() >= MAX_LEVEL;
  }

  checkUnlocks(progress: ClassProgress): string[] {
    const newUnlocks: string[] = [];

    // Check missions
    const allMissions = [...POLICE_MISSIONS, ...RIDER_MISSIONS, ...DRIVER_MISSIONS];
    for (const m of allMissions) {
      if (m.classRequired !== this.currentClass) continue;
      if (progress.unlockedMissionIds.includes(m.id)) continue;
      if (progress.completedMissionIds.includes(m.id)) continue;

      let unlocked = false;
      if (m.unlockCondition.type === 'always') unlocked = true;
      if (m.unlockCondition.type === 'level' && progress.level >= (m.unlockCondition.value as number)) unlocked = true;
      if (m.unlockCondition.type === 'mission_complete' && progress.completedMissionIds.includes(m.unlockCondition.value as string)) unlocked = true;

      // Also check level requirement
      if (unlocked && progress.level >= m.levelRequired) {
        progress.unlockedMissionIds.push(m.id);
        newUnlocks.push(m.id);
      }
    }

    this.saveClassProgress(progress);
    return newUnlocks;
  }

  // === Items ===

  private getClassItems(): ItemDefinition[] {
    switch (this.currentClass) {
      case 'police': return POLICE_ITEMS;
      case 'rider': return RIDER_ITEMS;
      case 'driver': return DRIVER_ITEMS;
      default: return POLICE_ITEMS;
    }
  }

  private getClassSkins(): SkinDefinition[] {
    switch (this.currentClass) {
      case 'police': return POLICE_SKINS;
      case 'rider': return RIDER_SKINS;
      case 'driver': return DRIVER_SKINS;
      default: return POLICE_SKINS;
    }
  }

  getAllItems(): ItemDefinition[] {
    return this.getClassItems();
  }

  equipItem(itemId: string): boolean {
    const progress = this.getClassProgress();
    if (!progress) return false;
    if (!progress.ownedItems.includes(itemId)) return false;

    // Find item definition to check type
    const itemDef = this.getClassItems().find((i) => i.id === itemId);
    if (!itemDef) return false;

    // Remove any same-type equipped item
    const equipped = progress.equippedItems.filter((eid) => {
      const eDef = this.getClassItems().find((i) => i.id === eid);
      return eDef?.type !== itemDef.type;
    });

    equipped.push(itemId);
    progress.equippedItems = equipped;
    this.saveClassProgress(progress);

    this.events?.emit(GameEvents.ITEM_EQUIPPED, { itemId });
    return true;
  }

  unequipItem(itemId: string): boolean {
    const progress = this.getClassProgress();
    if (!progress) return false;

    const idx = progress.equippedItems.indexOf(itemId);
    if (idx === -1) return false;

    progress.equippedItems.splice(idx, 1);
    this.saveClassProgress(progress);
    return true;
  }

  getEquippedEffects(): ItemEffect[] {
    const progress = this.getClassProgress();
    if (!progress) return [];

    const effects: ItemEffect[] = [];
    for (const itemId of progress.equippedItems) {
      const def = this.getClassItems().find((i) => i.id === itemId);
      if (def) {
        effects.push(...def.effects);
      }
    }
    return effects;
  }

  purchaseItem(itemId: string): boolean {
    const progress = this.getClassProgress();
    if (!progress || !this.economyManager) return false;

    const itemDef = this.getClassItems().find((i) => i.id === itemId);
    if (!itemDef) return false;
    if (progress.level < itemDef.levelRequired) return false;
    if (progress.ownedItems.includes(itemId)) return false;

    if (!this.economyManager.spend(itemDef.price, itemId)) return false;

    progress.ownedItems.push(itemId);
    this.saveClassProgress(progress);

    this.events?.emit(GameEvents.ITEM_PURCHASED, { itemId, name: itemDef.name });
    return true;
  }

  getOwnedItems(): string[] {
    return this.getClassProgress()?.ownedItems ?? [];
  }

  getEquippedItems(): string[] {
    return this.getClassProgress()?.equippedItems ?? [];
  }

  // === Skins ===

  getAllSkins(): SkinDefinition[] {
    return this.getClassSkins();
  }

  purchaseSkin(skinId: string): boolean {
    const progress = this.getClassProgress();
    if (!progress || !this.economyManager) return false;

    const skinDef = this.getClassSkins().find((s) => s.id === skinId);
    if (!skinDef) return false;
    if (progress.level < skinDef.levelRequired) return false;
    if (progress.ownedSkinIds.includes(skinId)) return false;

    if (!this.economyManager.spend(skinDef.price, skinId)) return false;

    progress.ownedSkinIds.push(skinId);
    this.saveClassProgress(progress);

    this.events?.emit(GameEvents.ITEM_PURCHASED, { itemId: skinId, name: skinDef.name });
    return true;
  }

  equipSkin(skinId: string): boolean {
    const progress = this.getClassProgress();
    if (!progress) return false;
    if (!progress.ownedSkinIds.includes(skinId)) return false;

    progress.activeSkinId = skinId;
    this.saveClassProgress(progress);
    return true;
  }

  getOwnedSkins(): string[] {
    return this.getClassProgress()?.ownedSkinIds ?? [];
  }

  getActiveSkin(): string {
    return this.getClassProgress()?.activeSkinId ?? '';
  }
}
