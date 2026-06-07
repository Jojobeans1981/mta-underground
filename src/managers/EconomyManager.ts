import { PlayerSave } from '@/types/game.types';
import { GameEvents } from '@/types/events.types';
import { SaveManager } from '@/managers/SaveManager';
import Phaser from 'phaser';

export class EconomyManager {
  private wallet: number = 0;
  private saveManager: SaveManager | null = null;
  private events: Phaser.Events.EventEmitter | null = null;

  init(save: PlayerSave, saveManager: SaveManager, events: Phaser.Events.EventEmitter): void {
    this.wallet = save.wallet;
    this.saveManager = saveManager;
    this.events = events;
  }

  getBalance(): number {
    return this.wallet;
  }

  earn(amount: number, source: string): boolean {
    if (amount <= 0) return false;

    this.wallet += amount;

    // Persist
    if (this.saveManager) {
      const save = this.saveManager.load();
      if (save) {
        save.wallet = this.wallet;
        save.stats.totalMoneyEarned += amount;
        this.saveManager.save(save);
      }
    }

    this.events?.emit(GameEvents.MONEY_EARNED, {
      amount,
      source,
      newBalance: this.wallet,
    });

    return true;
  }

  spend(amount: number, itemId: string): boolean {
    if (amount <= 0) return false;
    if (this.wallet < amount) return false;

    this.wallet -= amount;

    // Persist
    if (this.saveManager) {
      const save = this.saveManager.load();
      if (save) {
        save.wallet = this.wallet;
        save.stats.totalMoneySpent += amount;
        this.saveManager.save(save);
      }
    }

    this.events?.emit(GameEvents.MONEY_SPENT, {
      amount,
      itemId,
      newBalance: this.wallet,
    });

    return true;
  }

  canAfford(amount: number): boolean {
    return this.wallet >= amount;
  }

  /** Reload wallet from save (e.g. after continue) */
  reload(): void {
    if (this.saveManager) {
      const save = this.saveManager.load();
      if (save) {
        this.wallet = save.wallet;
      }
    }
  }
}
