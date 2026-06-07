import { GameEvents } from '@/types/events.types';
import Phaser from 'phaser';

export class MetroCardSystem {
  private balance: number = 2.90; // Starting with one ride
  private farePerRide: number = 2.90;
  private events: Phaser.Events.EventEmitter | null = null;

  init(events: Phaser.Events.EventEmitter): void {
    this.events = events;
  }

  getBalance(): number {
    return this.balance;
  }

  canAffordRide(): boolean {
    return this.balance >= this.farePerRide;
  }

  swipe(): boolean {
    if (this.balance < this.farePerRide) return false;
    this.balance -= this.farePerRide;
    this.balance = Math.round(this.balance * 100) / 100;
    return true;
  }

  addFunds(amount: number): void {
    this.balance += amount;
    this.balance = Math.round(this.balance * 100) / 100;
  }

  getFare(): number {
    return this.farePerRide;
  }

  /** Called when rider evades fare — free ride but risky */
  evadeFare(): void {
    // No balance deducted — tracked for missions
  }
}
