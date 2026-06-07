import Phaser from 'phaser';

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window && window.innerWidth < 800);
}

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  const mobile = isMobileDevice();

  // Use the ACTUAL available screen pixels as the canvas size.
  // No scaling = no blur. 1:1 pixel mapping.
  const width = mobile ? 375 : window.innerWidth;
  const height = mobile ? 667 : window.innerHeight;

  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width,
    height,
    scale: {
      mode: Phaser.Scale.RESIZE, // Canvas matches window size exactly
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    backgroundColor: '#1a1a2e',
    antialias: true,
    roundPixels: false,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    scene: [],
  };
}

export function isMobile(): boolean {
  return isMobileDevice();
}
