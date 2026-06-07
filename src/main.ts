import Phaser from 'phaser';
import { createGameConfig } from '@/config/game-config';
import { BootScene } from '@/scenes/BootScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { CharacterSelectScene } from '@/scenes/CharacterSelectScene';
import { GameScene } from '@/scenes/GameScene';
import { StationScene } from '@/scenes/StationScene';
import { MissionSelectScene } from '@/scenes/MissionSelectScene';
import { MissionBriefScene } from '@/scenes/MissionBriefScene';
import { MissionCompleteScene } from '@/scenes/MissionCompleteScene';
import { ShopScene } from '@/scenes/ShopScene';
import { StatsScene } from '@/scenes/StatsScene';
import { PauseScene } from '@/scenes/PauseScene';
import { LeaderboardScene } from '@/scenes/LeaderboardScene';
import { PremiumStoreScene } from '@/scenes/PremiumStoreScene';
import { HUDScene } from '@/scenes/HUDScene';
import { FullMapScene } from '@/scenes/FullMapScene';

const config = createGameConfig();
config.scene = [
  BootScene,
  MainMenuScene,
  CharacterSelectScene,
  GameScene,
  StationScene,
  MissionSelectScene,
  MissionBriefScene,
  MissionCompleteScene,
  ShopScene,
  StatsScene,
  PauseScene,
  LeaderboardScene,
  PremiumStoreScene,
  HUDScene,
  FullMapScene,
];

new Phaser.Game(config);
