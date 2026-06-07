import Phaser from 'phaser';
import { GameEvents } from '@/types/events.types';

export interface IAPProduct {
  id: string;
  name: string;
  description: string;
  price: string; // Display price (e.g. "$0.99")
  type: 'consumable' | 'non_consumable' | 'subscription';
  rewardType: 'money' | 'xp_boost' | 'skin' | 'ad_free' | 'mission_pack';
  rewardValue: number | string;
}

export const IAP_PRODUCTS: IAPProduct[] = [
  {
    id: 'iap_money_500', name: 'Cash Drop', description: 'Get $500 in-game cash',
    price: '$0.99', type: 'consumable', rewardType: 'money', rewardValue: 500,
  },
  {
    id: 'iap_money_2000', name: 'Big Stack', description: 'Get $2,000 in-game cash',
    price: '$2.99', type: 'consumable', rewardType: 'money', rewardValue: 2000,
  },
  {
    id: 'iap_money_5000', name: 'Jackpot', description: 'Get $5,000 in-game cash',
    price: '$4.99', type: 'consumable', rewardType: 'money', rewardValue: 5000,
  },
  {
    id: 'iap_xp_boost', name: 'XP Boost (24h)', description: '2x XP for 24 hours',
    price: '$1.99', type: 'consumable', rewardType: 'xp_boost', rewardValue: 2,
  },
  {
    id: 'iap_ad_free', name: 'Ad Free', description: 'Remove all ads permanently',
    price: '$3.99', type: 'non_consumable', rewardType: 'ad_free', rewardValue: 1,
  },
  {
    id: 'iap_premium_card', name: 'Premium MetroCard', description: '1.5x XP permanently',
    price: '$4.99', type: 'non_consumable', rewardType: 'xp_boost', rewardValue: 1.5,
  },
];

export class IAPManager {
  private events: Phaser.Events.EventEmitter | null = null;
  private purchasedNonConsumables: Set<string> = new Set();
  private isNativePlatform: boolean = false;

  init(events: Phaser.Events.EventEmitter): void {
    this.events = events;

    // Check if running in Capacitor (native)
    this.isNativePlatform = !!(window as any).Capacitor;

    // Load purchased non-consumables from localStorage
    try {
      const raw = localStorage.getItem('mta_iap_purchases');
      if (raw) {
        const ids = JSON.parse(raw) as string[];
        ids.forEach((id) => this.purchasedNonConsumables.add(id));
      }
    } catch {
      // Ignore
    }
  }

  getProducts(): IAPProduct[] {
    return IAP_PRODUCTS.map((p) => ({
      ...p,
      // Mark non-consumables as purchased if already bought
    }));
  }

  isProductPurchased(productId: string): boolean {
    return this.purchasedNonConsumables.has(productId);
  }

  isAdFree(): boolean {
    return this.purchasedNonConsumables.has('iap_ad_free');
  }

  /**
   * Initiate a purchase. In web mode, this is simulated.
   * In Capacitor/native mode, this would call the native IAP plugin.
   * Returns true if purchase completed.
   */
  async purchase(productId: string): Promise<boolean> {
    const product = IAP_PRODUCTS.find((p) => p.id === productId);
    if (!product) return false;

    if (this.isNativePlatform) {
      // TODO: Integrate with @capacitor-community/in-app-purchases
      // For now, simulate
      return this.simulatePurchase(product);
    } else {
      // Web: simulate purchase (in production, integrate Stripe or similar)
      return this.simulatePurchase(product);
    }
  }

  private simulatePurchase(product: IAPProduct): boolean {
    // In development/web, auto-succeed purchases
    if (product.type === 'non_consumable') {
      this.purchasedNonConsumables.add(product.id);
      this.savePurchases();
    }

    this.events?.emit('iap.purchased', {
      productId: product.id,
      rewardType: product.rewardType,
      rewardValue: product.rewardValue,
    });

    return true;
  }

  private savePurchases(): void {
    localStorage.setItem(
      'mta_iap_purchases',
      JSON.stringify(Array.from(this.purchasedNonConsumables))
    );
  }

  restorePurchases(): string[] {
    return Array.from(this.purchasedNonConsumables);
  }
}
