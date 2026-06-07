import Phaser from 'phaser';

export type AdType = 'banner' | 'interstitial' | 'rewarded';

export class AdManager {
  private events: Phaser.Events.EventEmitter | null = null;
  private adFree: boolean = false;
  private isNativePlatform: boolean = false;
  private interstitialCooldown: number = 0; // Seconds until next interstitial allowed
  private bannerVisible: boolean = false;

  init(events: Phaser.Events.EventEmitter): void {
    this.events = events;
    this.isNativePlatform = !!(window as any).Capacitor;
  }

  setAdFree(adFree: boolean): void {
    this.adFree = adFree;
    if (adFree) {
      this.hideBanner();
    }
  }

  isAdFreeMode(): boolean {
    return this.adFree;
  }

  update(delta: number): void {
    if (this.interstitialCooldown > 0) {
      this.interstitialCooldown -= delta / 1000;
    }
  }

  /** Show a banner ad at the bottom of the screen */
  showBanner(): void {
    if (this.adFree) return;

    if (this.isNativePlatform) {
      // TODO: Integrate with AdMob Capacitor plugin
      // @capacitor-community/admob
    } else {
      // Web: could integrate Google AdSense or a web ad network
      // For now, create a placeholder
    }
    this.bannerVisible = true;
  }

  hideBanner(): void {
    this.bannerVisible = false;
    // Remove banner ad DOM element if exists
  }

  /** Show a full-screen interstitial ad (between missions) */
  async showInterstitial(): Promise<boolean> {
    if (this.adFree) return false;
    if (this.interstitialCooldown > 0) return false;

    // Cooldown: 3 minutes between interstitials
    this.interstitialCooldown = 180;

    if (this.isNativePlatform) {
      // TODO: Native AdMob interstitial
      return true;
    } else {
      // Web: simulate (or integrate web ad provider)
      this.events?.emit('ad.interstitial.shown');
      return true;
    }
  }

  /**
   * Show a rewarded video ad. Player watches ad for a reward.
   * Returns true if the ad was watched to completion.
   */
  async showRewarded(rewardType: string, rewardAmount: number): Promise<boolean> {
    if (this.isNativePlatform) {
      // TODO: Native AdMob rewarded
      // On completion: emit reward
      this.events?.emit('ad.rewarded.completed', { rewardType, rewardAmount });
      return true;
    } else {
      // Web: simulate successful watch
      this.events?.emit('ad.rewarded.completed', { rewardType, rewardAmount });
      return true;
    }
  }

  isBannerVisible(): boolean {
    return this.bannerVisible;
  }
}
