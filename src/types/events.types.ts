export const GameEvents = {
  // Player
  PLAYER_MOVED: 'player.moved',
  PLAYER_INTERACTED: 'player.interacted',
  PLAYER_ENTERED_STATION: 'player.entered.station',
  PLAYER_EXITED_STATION: 'player.exited.station',
  PLAYER_BOARDED_TRAIN: 'player.boarded.train',

  // Mission
  MISSION_STARTED: 'mission.started',
  MISSION_OBJECTIVE_COMPLETE: 'mission.objective.complete',
  MISSION_COMPLETED: 'mission.completed',
  MISSION_FAILED: 'mission.failed',

  // Economy
  MONEY_EARNED: 'money.earned',
  MONEY_SPENT: 'money.spent',
  ITEM_PURCHASED: 'item.purchased',
  ITEM_EQUIPPED: 'item.equipped',

  // Progression
  XP_EARNED: 'xp.earned',
  LEVEL_UP: 'level.up',
  MISSION_UNLOCKED: 'mission.unlocked',

  // NPC
  NPC_SPAWNED: 'npc.spawned',
  NPC_DESPAWNED: 'npc.despawned',
  NPC_CAUGHT: 'npc.caught',
  NPC_ESCAPED: 'npc.escaped',
  NPC_DIALOGUE: 'npc.dialogue',

  // System
  GAME_SAVED: 'game.saved',
  GAME_LOADED: 'game.loaded',
  SCENE_TRANSITION: 'scene.transition',
  DAY_NIGHT_CHANGED: 'daynight.changed',
} as const;

export type GameEventKey = keyof typeof GameEvents;
export type GameEventValue = (typeof GameEvents)[GameEventKey];
