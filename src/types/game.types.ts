// ===== Character & World =====

export type CharacterClass = 'police' | 'rider' | 'driver';
export type DistrictId = 'manhattan' | 'brooklyn' | 'queens' | 'bronx';

// ===== Save Data =====

export interface PlayerSave {
  version: number;
  createdAt: number;
  lastPlayedAt: number;
  selectedClass: CharacterClass;
  classes: {
    police: ClassProgress;
    rider: ClassProgress;
    driver: ClassProgress;
  };
  wallet: number;
  settings: PlayerSettings;
  stats: PlayerStats;
}

export interface ClassProgress {
  unlocked: boolean;
  level: number;
  xp: number;
  xpToNextLevel: number;
  completedMissionIds: string[];
  unlockedMissionIds: string[];
  equippedItems: string[];
  ownedItems: string[];
  activeSkinId: string;
  ownedSkinIds: string[];
}

export interface PlayerSettings {
  musicVolume: number;
  sfxVolume: number;
  vibration: boolean;
  showFps: boolean;
  language: string;
}

export interface PlayerStats {
  totalPlayTime: number;
  totalMissionsCompleted: number;
  totalMoneyEarned: number;
  totalMoneySpent: number;
  totalXpEarned: number;
  highestLevel: number;
  missionsFailedCount: number;
  npcsCaught: number;
  faresEvaded: number;
  passengersDelivered: number;
  streetCred: number;
  tagsPlaced: number;
}

// ===== Missions =====

export type MissionType =
  | 'pursuit'
  | 'patrol'
  | 'escort'
  | 'investigate'
  | 'timed_route'
  | 'survival'
  | 'delivery'
  | 'stealth';

export interface MissionDefinition {
  id: string;
  classRequired: CharacterClass;
  title: string;
  description: string;
  briefing: string;
  district: DistrictId;
  stationId: string;
  levelRequired: number;
  type: MissionType;
  objectives: MissionObjective[];
  rewards: MissionRewards;
  timeLimit: number | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  unlockCondition: UnlockCondition;
}

export interface MissionObjective {
  id: string;
  description: string;
  type:
    | 'reach_location'
    | 'catch_npc'
    | 'collect_item'
    | 'survive_time'
    | 'interact_object'
    | 'escort_npc';
  targetId: string;
  count: number;
  optional: boolean;
}

export interface MissionRewards {
  money: number;
  xp: number;
  itemIds: string[];
  bonusMoney: number;
  bonusXp: number;
}

export interface UnlockCondition {
  type: 'level' | 'mission_complete' | 'always';
  value: number | string;
}

// ===== Items =====

export type ItemType = 'equipment' | 'consumable' | 'cosmetic';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type StatModifier =
  | 'speed'
  | 'stamina'
  | 'detection_range'
  | 'catch_radius'
  | 'xp_multiplier'
  | 'money_multiplier';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  classRequired: CharacterClass | null;
  type: ItemType;
  rarity: ItemRarity;
  price: number;
  levelRequired: number;
  effects: ItemEffect[];
  icon: SpriteConfig;
}

export interface ItemEffect {
  stat: StatModifier;
  modifier: number;
}

export interface SpriteConfig {
  shape: 'rect' | 'circle' | 'triangle' | 'badge' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  size: number;
}

// ===== Map =====

export interface GameMap {
  districts: District[];
  subwayLines: SubwayLine[];
}

export interface District {
  id: DistrictId;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  stations: Station[];
  landmarks: Landmark[];
  streetGrid: StreetSegment[];
  unlockCondition: UnlockCondition;
}

export interface Station {
  id: string;
  name: string;
  position: { x: number; y: number };
  entrances: { x: number; y: number }[];
  platforms: Platform[];
  connections: string[];
  lineIds: string[];
}

export interface Platform {
  id: string;
  position: { x: number; y: number };
  width: number;
  trackSide: 'north' | 'south' | 'east' | 'west';
}

export interface SubwayLine {
  id: string;
  /** Real-world line designation shown to the player, e.g. '1·2·3', 'A·C·E'. */
  name: string;
  color: string;
  stationIds: string[];
}

export interface Landmark {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  spriteConfig: SpriteConfig;
}

export interface StreetSegment {
  start: { x: number; y: number };
  end: { x: number; y: number };
  width: number;
  type: 'road' | 'sidewalk' | 'alley';
}

// ===== NPCs =====

export type NPCType =
  | 'civilian'
  | 'fare_evader'
  | 'suspicious_person'
  | 'lost_tourist'
  | 'vendor'
  | 'musician'
  | 'commuter';

export type BehaviorPattern =
  | 'wander'
  | 'patrol'
  | 'stationary'
  | 'flee'
  | 'follow_path'
  | 'crowd'
  | 'goal_seek';

export interface NPCDefinition {
  id: string;
  type: NPCType;
  spriteConfig: SpriteConfig;
  speed: number;
  behaviorPattern: BehaviorPattern;
  interactable: boolean;
  dialogueLines: string[];
}

// ===== Skins =====

export interface SkinDefinition {
  id: string;
  name: string;
  classRequired: CharacterClass;
  price: number;
  levelRequired: number;
  spriteConfig: SpriteConfig;
}
