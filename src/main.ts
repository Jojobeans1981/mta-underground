import Phaser from 'phaser';
import { createGameConfig } from '@/config/game-config';
import { BootScene } from '@/scenes/BootScene';

const config = createGameConfig();
config.scene = [
  BootScene,
];

new Phaser.Game(config);
