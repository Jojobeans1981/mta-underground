import type Phaser from 'phaser';

export type SceneKey =
  | 'CharacterSelectScene'
  | 'GameScene'
  | 'HUDScene'
  | 'FullMapScene'
  | 'MissionSelectScene'
  | 'MissionBriefScene'
  | 'MissionCompleteScene'
  | 'StationScene'
  | 'PauseScene'
  | 'ShopScene'
  | 'StatsScene'
  | 'LeaderboardScene'
  | 'PremiumStoreScene'
  | 'MainMenuScene';

const loaders: Record<SceneKey, () => Promise<Record<string, unknown>>> = {
  CharacterSelectScene: () => import('@/scenes/CharacterSelectScene'),
  GameScene: () => import('@/scenes/GameScene'),
  HUDScene: () => import('@/scenes/HUDScene'),
  FullMapScene: () => import('@/scenes/FullMapScene'),
  MissionSelectScene: () => import('@/scenes/MissionSelectScene'),
  MissionBriefScene: () => import('@/scenes/MissionBriefScene'),
  MissionCompleteScene: () => import('@/scenes/MissionCompleteScene'),
  StationScene: () => import('@/scenes/StationScene'),
  PauseScene: () => import('@/scenes/PauseScene'),
  ShopScene: () => import('@/scenes/ShopScene'),
  StatsScene: () => import('@/scenes/StatsScene'),
  LeaderboardScene: () => import('@/scenes/LeaderboardScene'),
  PremiumStoreScene: () => import('@/scenes/PremiumStoreScene'),
  MainMenuScene: () => import('@/scenes/MainMenuScene'),
};

export async function ensureSceneLoaded(scene: Phaser.Scene, key: SceneKey): Promise<void> {
  if (scene.scene.get(key)) {
    return;
  }

  const module = await loaders[key]();
  const sceneClass = module[key] as unknown as typeof Phaser.Scene | undefined;
  if (!sceneClass) {
    throw new Error(`Scene loader could not find export ${key}`);
  }

  scene.scene.add(key, sceneClass, false);
}

export async function startScene(scene: Phaser.Scene, key: SceneKey, data?: any): Promise<void> {
  await ensureSceneLoaded(scene, key);
  scene.scene.start(key, data);
}

export async function launchScene(scene: Phaser.Scene, key: SceneKey, data?: any): Promise<void> {
  await ensureSceneLoaded(scene, key);
  scene.scene.launch(key, data);
}
