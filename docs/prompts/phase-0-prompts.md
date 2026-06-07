# Phase 0 — Implementation Prompts

## Prompt 0.1: Project Configuration Files

**Create the following files from scratch:**
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `public/index.html`

### package.json

```json
{
  "name": "mta-underground",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vitest": "^1.6.0",
    "@types/node": "^20.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": false,
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"]
}
```

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

### public/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="mobile-web-app-capable" content="yes" />
  <title>MTA Underground</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #game-container { width: 100%; height: 100%; }
    canvas { display: block; touch-action: none; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**After creating these files, run `npm install` to install dependencies.**

**Acceptance:** `npm install` completes with no errors. All 4 files exist.

---

## Prompt 0.2: Type Definitions

**Create:** `src/types/game.types.ts`, `src/types/events.types.ts`

### src/types/game.types.ts

Define and export all of these types. Each type must be individually exported with `export`.

```typescript
export type CharacterClass = 'police' | 'rider' | 'driver';
export type DistrictId = 'manhattan' | 'brooklyn' | 'queens' | 'bronx';
export type MissionType = 'pursuit' | 'patrol' | 'escort' | 'investigate' | 'timed_route' | 'survival' | 'delivery' | 'stealth';
export type ItemType = 'equipment' | 'consumable' | 'cosmetic';
export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
export type StatModifier = 'speed' | 'stamina' | 'detection_range' | 'catch_radius' | 'xp_multiplier' | 'money_multiplier';
export type NPCType = 'civilian' | 'fare_evader' | 'suspicious_person' | 'lost_tourist' | 'vendor' | 'musician' | 'commuter';
export type BehaviorPattern = 'wander' | 'patrol' | 'stationary' | 'flee' | 'follow_path' | 'crowd';

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
}

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
  type: 'reach_location' | 'catch_npc' | 'collect_item' | 'survive_time' | 'interact_object' | 'escort_npc';
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

export interface NPCDefinition {
  id: string;
  type: NPCType;
  spriteConfig: SpriteConfig;
  speed: number;
  behaviorPattern: BehaviorPattern;
  interactable: boolean;
  dialogueLines: string[];
}

export interface SkinDefinition {
  id: string;
  name: string;
  classRequired: CharacterClass;
  price: number;
  levelRequired: number;
  spriteConfig: SpriteConfig;
}
```

### src/types/events.types.ts

```typescript
export const GameEvents = {
  PLAYER_MOVED: 'player.moved',
  PLAYER_INTERACTED: 'player.interacted',
  PLAYER_ENTERED_STATION: 'player.entered.station',
  PLAYER_EXITED_STATION: 'player.exited.station',
  PLAYER_BOARDED_TRAIN: 'player.boarded.train',
  MISSION_STARTED: 'mission.started',
  MISSION_OBJECTIVE_COMPLETE: 'mission.objective.complete',
  MISSION_COMPLETED: 'mission.completed',
  MISSION_FAILED: 'mission.failed',
  MONEY_EARNED: 'money.earned',
  MONEY_SPENT: 'money.spent',
  ITEM_PURCHASED: 'item.purchased',
  ITEM_EQUIPPED: 'item.equipped',
  XP_EARNED: 'xp.earned',
  LEVEL_UP: 'level.up',
  MISSION_UNLOCKED: 'mission.unlocked',
  NPC_SPAWNED: 'npc.spawned',
  NPC_DESPAWNED: 'npc.despawned',
  NPC_CAUGHT: 'npc.caught',
  NPC_ESCAPED: 'npc.escaped',
  NPC_DIALOGUE: 'npc.dialogue',
  GAME_SAVED: 'game.saved',
  GAME_LOADED: 'game.loaded',
  SCENE_TRANSITION: 'scene.transition',
  DAY_NIGHT_CHANGED: 'daynight.changed',
} as const;

export type GameEventKey = keyof typeof GameEvents;
export type GameEventValue = (typeof GameEvents)[GameEventKey];
```

**Acceptance:** Both files compile with no errors (`npx tsc --noEmit`).

---

## Prompt 0.3: Constants, Balance & Game Config

**Create:** `src/config/constants.ts`, `src/config/balance.ts`, `src/config/game-config.ts`

### src/config/constants.ts

Export every constant individually with `export const`:

```typescript
// World
export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 1000;
export const TILE_SIZE = 10;

// Camera
export const CAMERA_LERP = 0.1;
export const CAMERA_ZOOM_DEFAULT = 1.5;

// Player
export const PLAYER_SIZE = 12;
export const PLAYER_SPEED = 120;
export const PLAYER_SPRINT_MULTIPLIER = 1.5;
export const PLAYER_STAMINA_MAX = 100;
export const PLAYER_STAMINA_DRAIN = 20;
export const PLAYER_STAMINA_REGEN = 10;
export const PLAYER_CATCH_RADIUS = 20;
export const PLAYER_INTERACT_RADIUS = 30;

// NPC
export const NPC_SIZE = 10;
export const NPC_SPEED_SLOW = 40;
export const NPC_SPEED_NORMAL = 60;
export const NPC_SPEED_FAST = 100;
export const NPC_SPEED_FLEE = 140;
export const NPC_SPAWN_RADIUS = 400;
export const NPC_DESPAWN_RADIUS = 500;
export const MAX_NPCS_VISIBLE = 20;

// Map
export const ROAD_WIDTH = 40;
export const SIDEWALK_WIDTH = 10;
export const BUILDING_MIN_SIZE = 40;
export const BUILDING_MAX_SIZE = 100;
export const STATION_ENTRANCE_SIZE = 20;

// Day/Night
export const DAY_NIGHT_CYCLE_DURATION = 600;
export const NIGHT_TINT = 0x334466;
export const DAY_TINT = 0xffffff;

// UI
export const JOYSTICK_RADIUS = 50;
export const JOYSTICK_BASE_ALPHA = 0.3;
export const JOYSTICK_THUMB_RADIUS = 20;
export const ACTION_BUTTON_SIZE = 50;
export const HUD_PADDING = 10;
export const MINIMAP_SIZE = 100;
export const MINIMAP_ZOOM = 0.1;

// Save
export const SAVE_KEY = 'mta_underground_save';
export const SAVE_VERSION = 1;

// Audio
export const MASTER_VOLUME = 0.7;
export const DEFAULT_SFX_VOLUME = 0.8;
export const DEFAULT_MUSIC_VOLUME = 0.5;
```

### src/config/balance.ts

```typescript
export const BASE_XP = 200;
export const XP_GROWTH = 1.2;
export const MAX_LEVEL = 10;
export const STARTING_MONEY = 0;
export const MISSION_MONEY_BASE = 100;
export const MISSION_XP_BASE = 50;

export function calculateXPRequired(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(XP_GROWTH, level - 2));
}
```

### src/config/game-config.ts

```typescript
import Phaser from 'phaser';

export function createGameConfig(): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 375,
    height: 667,
    scale: {
      mode: Phaser.Scale.FIT,
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
    pixelArt: true,
    roundPixels: true,
    fps: {
      target: 60,
      forceSetTimeOut: false,
    },
    scene: [], // Scenes added in main.ts after import
  };
}
```

**Acceptance:** All 3 files compile. `createGameConfig()` returns a valid Phaser config object. `calculateXPRequired(2)` returns 200, `calculateXPRequired(3)` returns 240.

---

## Prompt 0.4: Color Palette

**Create:** `src/graphics/colors.ts`

Export every color individually. All values are hex strings.

```typescript
// Environment
export const COLOR_ASPHALT = '#2c2c2c';
export const COLOR_SIDEWALK = '#888888';
export const COLOR_BUILDING_1 = '#4a3728';
export const COLOR_BUILDING_2 = '#5c6670';
export const COLOR_BUILDING_3 = '#3d4f5f';
export const COLOR_BUILDING_4 = '#8b7355';
export const COLOR_GRASS = '#2d5a27';
export const COLOR_WATER = '#1a4a6e';
export const COLOR_TREE = '#1b4d2e';

// Station
export const COLOR_STATION_WALL = '#555555';
export const COLOR_STATION_FLOOR = '#444444';
export const COLOR_STATION_PLATFORM = '#666666';
export const COLOR_TRACK = '#333333';
export const COLOR_TRACK_RAIL = '#999999';
export const COLOR_TURNSTILE = '#888888';
export const COLOR_STATION_SIGN = '#003366';

// Subway lines
export const COLOR_LINE_RED = '#FF4444';
export const COLOR_LINE_BLUE = '#4444FF';
export const COLOR_LINE_GREEN = '#44FF44';
export const COLOR_LINE_YELLOW = '#FFFF44';

// Characters
export const COLOR_POLICE_UNIFORM = '#1a237e';
export const COLOR_POLICE_CAP = '#283593';
export const COLOR_POLICE_BADGE = '#ffd700';
export const COLOR_CIVILIAN_1 = '#795548';
export const COLOR_CIVILIAN_2 = '#607d8b';
export const COLOR_CIVILIAN_3 = '#ff7043';
export const COLOR_CIVILIAN_4 = '#ab47bc';
export const COLOR_FARE_EVADER = '#c62828';

// UI
export const COLOR_UI_PRIMARY = '#ff6f00';
export const COLOR_UI_SECONDARY = '#0d47a1';
export const COLOR_UI_BACKGROUND = '#1a1a2e';
export const COLOR_UI_SURFACE = '#252540';
export const COLOR_UI_TEXT = '#ffffff';
export const COLOR_UI_TEXT_DIM = '#aaaaaa';
export const COLOR_UI_SUCCESS = '#4caf50';
export const COLOR_UI_DANGER = '#f44336';
export const COLOR_UI_WARNING = '#ffeb3b';
export const COLOR_UI_XP = '#7c4dff';
export const COLOR_UI_MONEY = '#ffd700';

// Helper to convert hex string to number for Phaser
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
```

**Acceptance:** File compiles. `hexToNum('#FF4444')` returns `0xFF4444` (16728132).

---

## Prompt 0.5: SpriteFactory

**Create:** `src/graphics/SpriteFactory.ts`

This static class generates all programmatic textures. Every texture is created using `scene.make.graphics({})`, drawing shapes, calling `generateTexture()`, then destroying the graphics object.

**Imports needed:**
- `Phaser` from `'phaser'`
- Color constants from `'@/graphics/colors'` (use `hexToNum`)
- Size constants from `'@/config/constants'` (`PLAYER_SIZE`, `NPC_SIZE`, `JOYSTICK_RADIUS`, `JOYSTICK_THUMB_RADIUS`, `ACTION_BUTTON_SIZE`, `STATION_ENTRANCE_SIZE`)

**Static methods:**

`static generateAllTextures(scene: Phaser.Scene): void` — calls all the individual generators below.

`static createRectTexture(scene: Phaser.Scene, key: string, width: number, height: number, fillColor: number, borderColor?: number): void`:
1. `const g = scene.make.graphics({ x: 0, y: 0 })`
2. If borderColor provided: `g.fillStyle(borderColor)`, `g.fillRect(0, 0, width, height)`; then `g.fillStyle(fillColor)`, `g.fillRect(1, 1, width-2, height-2)`
3. Else: `g.fillStyle(fillColor)`, `g.fillRect(0, 0, width, height)`
4. `g.generateTexture(key, width, height)`
5. `g.destroy()`

`static createCircleTexture(scene: Phaser.Scene, key: string, radius: number, fillColor: number): void`:
1. Create graphics
2. `g.fillStyle(fillColor, 1)`
3. `g.fillCircle(radius, radius, radius)`
4. `g.generateTexture(key, radius * 2, radius * 2)`
5. Destroy

`static createCharacterTexture(scene: Phaser.Scene, key: string, bodyColor: number, headColor: number, size: number): void`:
1. Create graphics
2. Body: `g.fillStyle(bodyColor)`, `g.fillRect(1, size * 0.3, size - 2, size * 0.7)` (lower 70%)
3. Head: `g.fillStyle(headColor)`, `g.fillRect(size * 0.2, 0, size * 0.6, size * 0.35)` (upper 35%, centered)
4. Generate texture at size x size
5. Destroy

**Textures to generate in `generateAllTextures`:**

Characters:
- `'player_police'`: createCharacterTexture with `COLOR_POLICE_UNIFORM`, `COLOR_POLICE_CAP`, `PLAYER_SIZE`
- `'player_rider'`: createCharacterTexture with `hexToNum('#607d8b')`, `hexToNum('#455a64')`, `PLAYER_SIZE`
- `'player_driver'`: createCharacterTexture with `hexToNum('#0d47a1')`, `hexToNum('#ff6f00')`, `PLAYER_SIZE`

NPCs:
- `'npc_civilian_1'`: createRectTexture `NPC_SIZE x NPC_SIZE`, `COLOR_CIVILIAN_1`
- `'npc_civilian_2'`: createRectTexture `NPC_SIZE x NPC_SIZE`, `COLOR_CIVILIAN_2`
- `'npc_civilian_3'`: createRectTexture `NPC_SIZE x NPC_SIZE`, `COLOR_CIVILIAN_3`
- `'npc_civilian_4'`: createRectTexture `NPC_SIZE x NPC_SIZE`, `COLOR_CIVILIAN_4`
- `'npc_fare_evader'`: createRectTexture `NPC_SIZE x NPC_SIZE`, `COLOR_FARE_EVADER`
- `'npc_suspicious'`: createRectTexture `NPC_SIZE x NPC_SIZE`, `hexToNum('#37474f')`

Map elements:
- `'station_entrance'`: 20x20 rect, `COLOR_UI_SECONDARY` fill with `COLOR_UI_PRIMARY` border
- `'building_1'`: 1x1 rect, `COLOR_BUILDING_1` (used as tint-able fill)
- `'building_2'`: 1x1 rect, `COLOR_BUILDING_2`
- `'building_3'`: 1x1 rect, `COLOR_BUILDING_3`
- `'building_4'`: 1x1 rect, `COLOR_BUILDING_4`
- `'tree'`: circle radius 4, `hexToNum(COLOR_TREE)`

UI:
- `'joystick_base'`: circle radius `JOYSTICK_RADIUS`, `0xffffff` (will be used with alpha)
- `'joystick_thumb'`: circle radius `JOYSTICK_THUMB_RADIUS`, `0xffffff`
- `'action_button'`: circle radius `ACTION_BUTTON_SIZE / 2`, `hexToNum(COLOR_UI_PRIMARY)`
- `'minimap_player'`: createRectTexture 4x4, `0xffffff`
- `'minimap_station'`: createRectTexture 4x4, `hexToNum(COLOR_UI_SECONDARY)`

**Acceptance:** File compiles. After calling `SpriteFactory.generateAllTextures(scene)` in a Phaser scene, all texture keys are available via `scene.textures.exists(key)`.

---

## Prompt 0.6: SaveManager

**Create:** `src/managers/SaveManager.ts`

This class handles all localStorage persistence. It has **no dependency on Phaser** — it is pure TypeScript, fully testable with Vitest.

**Imports:**
- `PlayerSave`, `CharacterClass`, `ClassProgress` from `'@/types/game.types'`
- `SAVE_KEY`, `SAVE_VERSION` from `'@/config/constants'`
- `STARTING_MONEY` from `'@/config/balance'`

**Export as `class SaveManager`:**

**Methods:**

`hasSave(): boolean`:
- Returns `localStorage.getItem(SAVE_KEY) !== null`

`createNewSave(selectedClass: CharacterClass): PlayerSave`:
- Build a full PlayerSave object:
  - `version`: `SAVE_VERSION`
  - `createdAt`: `Date.now()`
  - `lastPlayedAt`: `Date.now()`
  - `selectedClass`: parameter
  - `classes.police`: `{ unlocked: true, level: 1, xp: 0, xpToNextLevel: 200, completedMissionIds: [], unlockedMissionIds: ['police_m01', 'police_m02'], equippedItems: ['police_radio_1'], ownedItems: ['police_radio_1'], activeSkinId: 'police_skin_default', ownedSkinIds: ['police_skin_default'] }`
  - `classes.rider`: `{ unlocked: false, level: 1, xp: 0, xpToNextLevel: 200, completedMissionIds: [], unlockedMissionIds: [], equippedItems: [], ownedItems: [], activeSkinId: '', ownedSkinIds: [] }`
  - `classes.driver`: same as rider
  - `wallet`: `STARTING_MONEY`
  - `settings`: `{ musicVolume: 0.5, sfxVolume: 0.8, vibration: true, showFps: false, language: 'en' }`
  - `stats`: all fields set to 0
- Call `this.save(save)` to persist
- Return the save object

`save(data: PlayerSave): void`:
- Set `data.lastPlayedAt = Date.now()`
- `localStorage.setItem(SAVE_KEY, JSON.stringify(data))`

`load(): PlayerSave | null`:
- Get raw string from `localStorage.getItem(SAVE_KEY)`
- If null, return null
- `try { return JSON.parse(raw) as PlayerSave }` catch return null
- After parsing, call `this.migrate(data)` and return result

`migrate(data: PlayerSave): PlayerSave`:
- If `data.version < SAVE_VERSION`, apply migrations (none yet at version 1)
- Set `data.version = SAVE_VERSION`
- Return data

`deleteSave(): void`:
- `localStorage.removeItem(SAVE_KEY)`

`exportSave(): string`:
- Return `localStorage.getItem(SAVE_KEY) ?? ''`

`importSave(json: string): PlayerSave | null`:
- Try JSON.parse, validate it has `version` field, return parsed or null

**Acceptance:** File compiles. No Phaser imports. Can be instantiated with `new SaveManager()`.

---

## Prompt 0.7: InputManager

**Create:** `src/managers/InputManager.ts`

Abstracts touch and keyboard input into a unified interface.

**Imports:**
- `Phaser` from `'phaser'`
- `JOYSTICK_RADIUS`, `JOYSTICK_BASE_ALPHA`, `JOYSTICK_THUMB_RADIUS`, `ACTION_BUTTON_SIZE` from `'@/config/constants'`

**Export as `class InputManager`:**

**Properties:**
- `private direction: { x: number; y: number }` — initialized to `{ x: 0, y: 0 }`
- `private actionPressed: boolean` — `false`
- `private sprintHeld: boolean` — `false`
- `private scene: Phaser.Scene | null` — `null`
- `private joystickBase: Phaser.GameObjects.Image | null`
- `private joystickThumb: Phaser.GameObjects.Image | null`
- `private actionButton: Phaser.GameObjects.Image | null`
- `private activePointer: Phaser.Input.Pointer | null`
- `private joystickCenter: { x: number; y: number }`
- `private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null`
- `private wasd: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null`
- `private spaceKey: Phaser.Input.Keyboard.Key | null`
- `private shiftKey: Phaser.Input.Keyboard.Key | null`
- `private lastTapTime: number` — `0` (for double-tap sprint detection)
- `private sprintToggled: boolean` — `false`

**Methods:**

`setup(scene: Phaser.Scene): void`:
1. Store scene reference
2. Calculate positions based on game dimensions:
   - `const gameWidth = scene.cameras.main.width`
   - `const gameHeight = scene.cameras.main.height`
   - Joystick position: `x = JOYSTICK_RADIUS + 20`, `y = gameHeight - JOYSTICK_RADIUS - 20`
   - Action button position: `x = gameWidth - ACTION_BUTTON_SIZE - 20`, `y = gameHeight - ACTION_BUTTON_SIZE - 20`

3. Create joystick base image:
   - `this.joystickBase = scene.add.image(joystickX, joystickY, 'joystick_base')`
   - `.setScrollFactor(0)` (fixed to camera)
   - `.setAlpha(JOYSTICK_BASE_ALPHA)`
   - `.setDepth(1000)` (above everything)
   - `.setInteractive()`

4. Create joystick thumb:
   - Same position, texture `'joystick_thumb'`, alpha 0.6, depth 1001

5. Create action button:
   - `scene.add.image(buttonX, buttonY, 'action_button')`
   - `.setScrollFactor(0).setDepth(1000).setInteractive()`
   - Add text "!" on top (white, bold, centered on button)

6. Store `joystickCenter = { x: joystickX, y: joystickY }`

7. Set up touch input:
   - `scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => ...)`:
     - If pointer is within JOYSTICK_RADIUS * 2 of joystickCenter: start tracking this pointer, check for double-tap
     - If pointer is within ACTION_BUTTON_SIZE of action button center: set `actionPressed = true`
   - `scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => ...)`:
     - If this is the tracked joystick pointer: calculate direction from center, clamp, normalize, apply dead zone (15%)
   - `scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => ...)`:
     - If this was the joystick pointer: reset direction to (0,0), snap thumb back, clear sprint toggle

8. Set up keyboard input (only if `scene.input.keyboard` exists):
   - Create cursor keys and WASD keys
   - Create space and shift keys

`update(): void` — called once per frame:
1. Reset `actionPressed = false` (it was true for one frame)
2. If keyboard exists:
   - Calculate direction from keys (WASD or arrows, normalize diagonal)
   - If keyboard direction is non-zero, override touch direction
   - Check space → set actionPressed
   - Check shift → set sprintHeld
3. If touch: sprintHeld comes from double-tap toggle

`getDirection(): { x: number; y: number }`:
- Return copy of direction

`isActionPressed(): boolean`:
- Return actionPressed

`isSprintHeld(): boolean`:
- Return sprintHeld or sprintToggled

`destroy(): void`:
- Remove all listeners, destroy game objects

**Joystick math (in pointermove handler):**
```
const dx = pointer.x - joystickCenter.x;
const dy = pointer.y - joystickCenter.y;
const distance = Math.sqrt(dx * dx + dy * dy);
const clampedDist = Math.min(distance, JOYSTICK_RADIUS);

// Dead zone: 15% of radius
if (clampedDist < JOYSTICK_RADIUS * 0.15) {
  this.direction = { x: 0, y: 0 };
} else {
  this.direction = { x: dx / distance, y: dy / distance };
}

// Move thumb visual
const thumbX = joystickCenter.x + (dx / distance) * clampedDist;
const thumbY = joystickCenter.y + (dy / distance) * clampedDist;
this.joystickThumb.setPosition(thumbX, thumbY);
```

**Acceptance:** File compiles. When setup() is called with a Phaser scene, joystick and button render on screen. WASD produces direction values.

---

## Prompt 0.8: AudioManager Shell

**Create:** `src/managers/AudioManager.ts`

A no-op shell. All methods exist but do nothing. Real implementation comes in Phase 5.

```typescript
import Phaser from 'phaser';

export class AudioManager {
  private musicVolume: number = 0.5;
  private sfxVolume: number = 0.8;

  init(scene: Phaser.Scene): void {
    // Phase 5: initialize Web Audio API
  }

  playSFX(name: string): void {
    // Phase 5: delegate to SFXGenerator
  }

  playMusic(name: string): void {
    // Phase 5: delegate to MusicGenerator
  }

  stopMusic(): void {
    // Phase 5: stop current track
  }

  setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
  }

  setSFXVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }
}
```

**Acceptance:** File compiles. `new AudioManager()` works. All methods callable without errors.

---

## Prompt 0.9: BootScene, HUDScene & Entry Point

**Create:** `src/scenes/BootScene.ts`, `src/scenes/HUDScene.ts`, `src/main.ts`

### src/scenes/BootScene.ts

```typescript
import Phaser from 'phaser';
import { SpriteFactory } from '@/graphics/SpriteFactory';
import { SaveManager } from '@/managers/SaveManager';
import { InputManager } from '@/managers/InputManager';
import { AudioManager } from '@/managers/AudioManager';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Generate all textures
    SpriteFactory.generateAllTextures(this);

    // Instantiate managers and store in registry
    const saveManager = new SaveManager();
    const inputManager = new InputManager();
    const audioManager = new AudioManager();

    this.game.registry.set('saveManager', saveManager);
    this.game.registry.set('inputManager', inputManager);
    this.game.registry.set('audioManager', audioManager);

    // Initialize audio
    audioManager.init(this);

    // For Phase 0: show placeholder screen
    // In Phase 3 this will transition to MainMenuScene
    const { width, height } = this.cameras.main;

    // Title text
    this.add.text(width / 2, height * 0.3, 'MTA\nUNDERGROUND', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.45, 'TRANSIT NEVER SLEEPS', {
      fontSize: '14px',
      color: '#ff6f00',
      align: 'center',
    }).setOrigin(0.5);

    // Status text
    this.add.text(width / 2, height * 0.6, 'Engine Ready', {
      fontSize: '12px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);

    // Setup input to demonstrate it works
    inputManager.setup(this);

    // Direction display (debug)
    const dirText = this.add.text(width / 2, height * 0.7, 'Direction: 0, 0', {
      fontSize: '10px',
      color: '#666666',
      align: 'center',
    }).setOrigin(0.5);

    // Update direction display each frame
    this.events.on('update', () => {
      inputManager.update();
      const dir = inputManager.getDirection();
      dirText.setText(`Direction: ${dir.x.toFixed(2)}, ${dir.y.toFixed(2)}`);
    });
  }
}
```

### src/scenes/HUDScene.ts

```typescript
import Phaser from 'phaser';

export class HUDScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    // HUD overlay — runs on top of game scenes
    // Phase 0: placeholder text only
    this.add.text(10, 10, 'HUD', {
      fontSize: '10px',
      color: '#666666',
    });

    // Bring this scene to top so it renders above game scenes
    this.scene.bringToTop();
  }
}
```

### src/main.ts

```typescript
import Phaser from 'phaser';
import { createGameConfig } from '@/config/game-config';
import { BootScene } from '@/scenes/BootScene';
import { HUDScene } from '@/scenes/HUDScene';

const config = createGameConfig();
config.scene = [BootScene, HUDScene];

new Phaser.Game(config);
```

**Acceptance:** `npm run dev` serves the game. Browser shows dark screen with "MTA UNDERGROUND" title, "TRANSIT NEVER SLEEPS" subtitle, joystick at bottom-left, action button at bottom-right. Moving joystick (or pressing WASD) updates the direction text.

---

## Prompt 0.10: SaveManager Unit Tests

**Create:** `src/managers/__tests__/SaveManager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from '../SaveManager';
import { SAVE_KEY, SAVE_VERSION } from '../../config/constants';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] ?? null,
    setItem: (key: string, value: string): void => { store[key] = value; },
    removeItem: (key: string): void => { delete store[key]; },
    clear: (): void => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('SaveManager', () => {
  let manager: SaveManager;

  beforeEach(() => {
    localStorageMock.clear();
    manager = new SaveManager();
  });

  it('hasSave returns false when no save exists', () => {
    expect(manager.hasSave()).toBe(false);
  });

  it('createNewSave creates a valid save with police defaults', () => {
    const save = manager.createNewSave('police');
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.selectedClass).toBe('police');
    expect(save.classes.police.unlocked).toBe(true);
    expect(save.classes.police.level).toBe(1);
    expect(save.classes.police.xpToNextLevel).toBe(200);
    expect(save.classes.police.unlockedMissionIds).toContain('police_m01');
    expect(save.classes.police.equippedItems).toContain('police_radio_1');
    expect(save.classes.rider.unlocked).toBe(false);
    expect(save.classes.driver.unlocked).toBe(false);
    expect(save.wallet).toBe(0);
    expect(save.settings.sfxVolume).toBe(0.8);
  });

  it('hasSave returns true after creating a save', () => {
    manager.createNewSave('police');
    expect(manager.hasSave()).toBe(true);
  });

  it('save and load round-trips correctly', () => {
    const original = manager.createNewSave('police');
    original.wallet = 500;
    manager.save(original);
    const loaded = manager.load();
    expect(loaded).not.toBeNull();
    expect(loaded!.wallet).toBe(500);
    expect(loaded!.selectedClass).toBe('police');
  });

  it('load returns null when no save exists', () => {
    expect(manager.load()).toBeNull();
  });

  it('deleteSave removes the save', () => {
    manager.createNewSave('police');
    expect(manager.hasSave()).toBe(true);
    manager.deleteSave();
    expect(manager.hasSave()).toBe(false);
    expect(manager.load()).toBeNull();
  });

  it('exportSave returns JSON string', () => {
    manager.createNewSave('police');
    const exported = manager.exportSave();
    expect(exported.length).toBeGreaterThan(0);
    const parsed = JSON.parse(exported);
    expect(parsed.selectedClass).toBe('police');
  });

  it('importSave parses valid JSON', () => {
    const save = manager.createNewSave('police');
    const json = JSON.stringify(save);
    const imported = manager.importSave(json);
    expect(imported).not.toBeNull();
    expect(imported!.version).toBe(SAVE_VERSION);
  });

  it('importSave returns null for invalid JSON', () => {
    expect(manager.importSave('not json')).toBeNull();
  });
});
```

**Acceptance:** `npm test` runs and all 8 tests pass.

---

## Phase 0 Summary

| Prompt | Files | Description |
|--------|-------|-------------|
| 0.1 | 4 config files | package.json, tsconfig, vite, index.html |
| 0.2 | 2 type files | All TypeScript interfaces + event constants |
| 0.3 | 3 config files | Constants, balance formulas, Phaser game config |
| 0.4 | 1 file | Color palette with hex-to-number helper |
| 0.5 | 1 file | SpriteFactory — programmatic texture generation |
| 0.6 | 1 file | SaveManager — localStorage CRUD |
| 0.7 | 1 file | InputManager — touch joystick + keyboard |
| 0.8 | 1 file | AudioManager — no-op shell |
| 0.9 | 3 files | BootScene + HUDScene + main.ts entry point |
| 0.10 | 1 test file | SaveManager unit tests |
