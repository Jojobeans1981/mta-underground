/** Detect which platform the game is running on */
export function getPlatform(): 'web' | 'ios' | 'android' | 'native' {
  const cap = (window as any).Capacitor;
  if (!cap) return 'web';

  const platform = cap.getPlatform?.();
  if (platform === 'ios') return 'ios';
  if (platform === 'android') return 'android';
  return 'native';
}

/** Check if running inside a Capacitor native shell */
export function isNative(): boolean {
  return getPlatform() !== 'web';
}

/** Check if the device supports vibration */
export function canVibrate(): boolean {
  return 'vibrate' in navigator;
}

/** Trigger a short vibration (if supported and enabled) */
export function vibrate(duration: number = 50): void {
  if (canVibrate()) {
    navigator.vibrate(duration);
  }
}

/** Get safe area insets for notched devices (returns 0 on web) */
export function getSafeAreaInsets(): { top: number; bottom: number; left: number; right: number } {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--sat') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--sab') || '0', 10),
    left: parseInt(style.getPropertyValue('--sal') || '0', 10),
    right: parseInt(style.getPropertyValue('--sar') || '0', 10),
  };
}
