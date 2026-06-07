# Phase 0: Project Scaffolding & Core Engine

## Current State
Nothing exists. Starting from an empty directory at `C:\Users\beame\Desktop\mta-underground\`.

## Goal
Create a fully configured Vite + TypeScript + Phaser 3 project that boots, renders a colored screen, handles touch and keyboard input, and can save/load game state. This is the foundation every subsequent phase builds on.

## Tech Stack
- **Runtime:** Browser (ES2020+ target)
- **Game Engine:** Phaser 3 (^3.80.0) — Canvas/WebGL 2D rendering
- **Language:** TypeScript (^5.4.0) with strict mode
- **Build:** Vite (^5.4.0) with HMR
- **Testing:** Vitest (^1.6.0)
- **Package Manager:** npm

## Coding Standards (apply to ALL phases)

### TypeScript
- `"strict": true` in tsconfig
- No `any` — every variable, parameter, and return typed
- Interfaces for object shapes, types for unions/aliases
- String enums for categorical values
- Explicit null checks, no non-null assertions (`!`)

### Naming
- Files: PascalCase for classes/scenes (`GameScene.ts`), kebab-case for configs (`game-config.ts`)
- Classes: PascalCase (`MissionManager`)
- Interfaces: PascalCase, no `I` prefix (`PlayerSave`)
- Methods/functions: camelCase (`startMission()`)
- Constants: UPPER_SNAKE_CASE (`MAX_PLAYER_SPEED`)
- Enums: PascalCase name, PascalCase values (`CharacterClass.Police`)
- Event strings: dot-separated lowercase (`mission.started`)

### Architecture
- One class per file
- Phaser imports first, then local imports, alphabetized within groups
- No circular dependencies (managers communicate via Phaser event bus)
- All tuning values in `constants.ts` or `balance.ts`, never inline
- Manager singletons instantiated in BootScene, stored in `scene.game.registry`

### Performance
- Object pooling via Phaser Groups
- Texture caching — generate sprites once, store as textures
- Camera culling — only update entities in viewport
- No allocations in `update()` loops

## Deliverables

### 1. Project Configuration Files

**`package.json`** — npm project with these dependencies:
- dependencies: `phaser` (^3.80.0)
- devDependencies: `typescript` (^5.4.0), `vite` (^5.4.0), `vitest` (^1.6.0), `@types/node` (^20.0.0)
- scripts: `dev`, `build`, `preview`, `test`, `test:watch`

**`tsconfig.json`** — strict TypeScript config:
- target: ES2020
- module: ESNext
- moduleResolution: bundler
- strict: true
- jsx: not needed
- include: `["src"]`
- outDir: `dist`

**`vite.config.ts`** — Vite config:
- No special plugins needed (Phaser loads via npm)
- Build target: ES2020
- Output to `dist/`

**`public/index.html`** — minimal HTML shell:
- Viewport meta tag for mobile (`width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`)
- Body with margin 0, overflow hidden, background black
- Single `<div id="game-container">` element
- No external CSS or scripts (Vite handles bundling)

### 2. Type Definitions

**`src/types/game.types.ts`** — All game data interfaces:

```typescript
// Character classes
type CharacterClass = 'police' | 'rider' | 'driver';

// District identifiers
type DistrictId = 'manhattan' | 'brooklyn' | 'queens' | 'bronx';

// Save data
interface PlayerSave {
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

interface ClassProgress {
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

interface PlayerSettings {
  musicVolume: number;
  sfxVolume: number;
  vibration: boolean;
  showFps: boolean;
  language: string;
}

interface PlayerStats {
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

// Mission system
type MissionType = 'pursuit' | 'patrol' | 'escort' | 'investigate' | 'timed_route' | 'survival' | 'delivery' | 'stealth';

interface MissionDefinition {
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

interface MissionObjective {
  id: string;
  description: string;
  type: 'reach_location' | 'catch_npc' | 'collect_item' | 'survive_time' | 'interact_object' | 'escort_npc';
  targetId: string;
  count: number;
  optional: boolean;
}

interface MissionRewards {
  money: number;
  xp: number;
  itemIds: string[];
  bonusMoney: number;
  bonusXp: number;
}

interface UnlockCondition {
  type: 'level' | 'mission_complete' | 'always';
  value: number | string;
}

// Items
type ItemType = 'equipment' | 'consumable' | 'cosmetic';
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';
type StatModifier = 'speed' | 'stamina' | 'detection_range' | 'catch_radius' | 'xp_multiplier' | 'money_multiplier';

interface ItemDefinition {
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

interface ItemEffect {
  stat: StatModifier;
  modifier: number;
}

interface SpriteConfig {
  shape: 'rect' | 'circle' | 'triangle' | 'badge' | 'custom';
  primaryColor: string;
  secondaryColor: string;
  size: number;
}

// Map
interface GameMap {
  districts: District[];
  subwayLines: SubwayLine[];
}

interface District {
  id: DistrictId;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  stations: Station[];
  landmarks: Landmark[];
  streetGrid: StreetSegment[];
  unlockCondition: UnlockCondition;
}

interface Station {
  id: string;
  name: string;
  position: { x: number; y: number };
  entrances: { x: number; y: number }[];
  platforms: Platform[];
  connections: string[];
  lineIds: string[];
}

interface Platform {
  id: string;
  position: { x: number; y: number };
  width: number;
  trackSide: 'north' | 'south' | 'east' | 'west';
}

interface SubwayLine {
  id: string;
  color: string;
  stationIds: string[];
}

interface Landmark {
  id: string;
  name: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  spriteConfig: SpriteConfig;
}

interface StreetSegment {
  start: { x: number; y: number };
  end: { x: number; y: number };
  width: number;
  type: 'road' | 'sidewalk' | 'alley';
}

// NPCs
type NPCType = 'civilian' | 'fare_evader' | 'suspicious_person' | 'lost_tourist' | 'vendor' | 'musician' | 'commuter';
type BehaviorPattern = 'wander' | 'patrol' | 'stationary' | 'flee' | 'follow_path' | 'crowd';

interface NPCDefinition {
  id: string;
  type: NPCType;
  spriteConfig: SpriteConfig;
  speed: number;
  behaviorPattern: BehaviorPattern;
  interactable: boolean;
  dialogueLines: string[];
}

// Skin (cosmetic)
interface SkinDefinition {
  id: string;
  name: string;
  classRequired: CharacterClass;
  price: number;
  levelRequired: number;
  spriteConfig: SpriteConfig;
}
```

**`src/types/events.types.ts`** — Custom event string constants:

```typescript
const GameEvents = {
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
```

**`src/types/enums.ts`** — not needed, CharacterClass etc. are string literal unions in game.types.ts.

### 3. Game Constants

**`src/config/constants.ts`** — All magic numbers:

```typescript
// World
const WORLD_WIDTH = 1000;
const WORLD_HEIGHT = 1000;
const TILE_SIZE = 10;

// Camera
const CAMERA_LERP = 0.1;
const CAMERA_ZOOM_DEFAULT = 1.5;

// Player
const PLAYER_SIZE = 12;
const PLAYER_SPEED = 120;          // pixels per second
const PLAYER_SPRINT_MULTIPLIER = 1.5;
const PLAYER_STAMINA_MAX = 100;
const PLAYER_STAMINA_DRAIN = 20;   // per second while sprinting
const PLAYER_STAMINA_REGEN = 10;   // per second while not sprinting
const PLAYER_CATCH_RADIUS = 20;    // pixels, for catching NPCs
const PLAYER_INTERACT_RADIUS = 30; // pixels, for NPC dialogue

// NPC
const NPC_SIZE = 10;
const NPC_SPEED_SLOW = 40;
const NPC_SPEED_NORMAL = 60;
const NPC_SPEED_FAST = 100;
const NPC_SPEED_FLEE = 140;
const NPC_SPAWN_RADIUS = 400;
const NPC_DESPAWN_RADIUS = 500;
const MAX_NPCS_VISIBLE = 20;

// Map
const ROAD_WIDTH = 40;
const SIDEWALK_WIDTH = 10;
const BUILDING_MIN_SIZE = 40;
const BUILDING_MAX_SIZE = 100;
const STATION_ENTRANCE_SIZE = 20;

// Day/Night
const DAY_NIGHT_CYCLE_DURATION = 600; // seconds (10 min real time = 1 game day)
const NIGHT_TINT = 0x334466;
const DAY_TINT = 0xffffff;

// UI
const JOYSTICK_RADIUS = 50;
const JOYSTICK_BASE_ALPHA = 0.3;
const JOYSTICK_THUMB_RADIUS = 20;
const ACTION_BUTTON_SIZE = 50;
const HUD_PADDING = 10;
const MINIMAP_SIZE = 100;
const MINIMAP_ZOOM = 0.1;

// Save
const SAVE_KEY = 'mta_underground_save';
const SAVE_VERSION = 1;

// Audio
const MASTER_VOLUME = 0.7;
const SFX_VOLUME = 0.8;
const MUSIC_VOLUME = 0.5;
```

**`src/config/balance.ts`** — Progression tuning:

```typescript
// XP formula: xpRequired = Math.floor(BASE_XP * Math.pow(XP_GROWTH, level - 2)) for level 2+
const BASE_XP = 200;
const XP_GROWTH = 1.2;
const MAX_LEVEL = 10;

// Economy
const STARTING_MONEY = 0;

// Mission rewards are defined per-mission in data files, but these are baseline multipliers
const MISSION_MONEY_BASE = 100;
const MISSION_XP_BASE = 50;
```

**`src/config/game-config.ts`** — Phaser GameConfig:

```typescript
// Returns a Phaser.Types.Core.GameConfig object
// - type: Phaser.AUTO (WebGL with Canvas fallback)
// - parent: 'game-container'
// - width: 375 (iPhone SE width — scales with device)
// - height: 667 (iPhone SE height)
// - scale mode: Phaser.Scale.FIT with autoCenter: Phaser.Scale.CENTER_BOTH
// - physics: Arcade physics with no gravity
// - backgroundColor: '#1a1a2e' (dark blue-black)
// - scene: [BootScene] (only boot scene registered initially, others added dynamically)
// - pixelArt: true (no antialiasing on textures)
// - roundPixels: true
// - fps: { target: 60, forceSetTimeOut: false }
```

### 4. Color Palette

**`src/graphics/colors.ts`** — NYC-inspired color palette:

```typescript
// Environment
const COLOR_ASPHALT = '#2c2c2c';
const COLOR_SIDEWALK = '#888888';
const COLOR_BUILDING_1 = '#4a3728';    // Brown stone
const COLOR_BUILDING_2 = '#5c6670';    // Gray concrete
const COLOR_BUILDING_3 = '#3d4f5f';    // Blue-gray glass
const COLOR_BUILDING_4 = '#8b7355';    // Tan brick
const COLOR_GRASS = '#2d5a27';
const COLOR_WATER = '#1a4a6e';
const COLOR_TREE = '#1b4d2e';

// Station
const COLOR_STATION_WALL = '#555555';
const COLOR_STATION_FLOOR = '#444444';
const COLOR_STATION_PLATFORM = '#666666';
const COLOR_TRACK = '#333333';
const COLOR_TRACK_RAIL = '#999999';
const COLOR_TURNSTILE = '#888888';
const COLOR_STATION_SIGN = '#003366';

// Subway lines (inspired by, not matching, real MTA colors)
const COLOR_LINE_RED = '#FF4444';
const COLOR_LINE_BLUE = '#4444FF';
const COLOR_LINE_GREEN = '#44FF44';
const COLOR_LINE_YELLOW = '#FFFF44';

// Characters
const COLOR_POLICE_UNIFORM = '#1a237e';  // Dark navy
const COLOR_POLICE_CAP = '#283593';
const COLOR_POLICE_BADGE = '#ffd700';
const COLOR_CIVILIAN_1 = '#795548';
const COLOR_CIVILIAN_2 = '#607d8b';
const COLOR_CIVILIAN_3 = '#ff7043';
const COLOR_CIVILIAN_4 = '#ab47bc';
const COLOR_FARE_EVADER = '#c62828';     // Red hoodie

// UI
const COLOR_UI_PRIMARY = '#ff6f00';      // MTA-inspired orange
const COLOR_UI_SECONDARY = '#0d47a1';    // MTA-inspired blue
const COLOR_UI_BACKGROUND = '#1a1a2e';
const COLOR_UI_SURFACE = '#252540';
const COLOR_UI_TEXT = '#ffffff';
const COLOR_UI_TEXT_DIM = '#aaaaaa';
const COLOR_UI_SUCCESS = '#4caf50';
const COLOR_UI_DANGER = '#f44336';
const COLOR_UI_WARNING = '#ffeb3b';
const COLOR_UI_XP = '#7c4dff';
const COLOR_UI_MONEY = '#ffd700';
```

### 5. Entry Point

**`src/main.ts`** — Creates the Phaser game instance using the config from `game-config.ts`. That's it — one line: `new Phaser.Game(gameConfig)`.

### 6. BootScene

**`src/scenes/BootScene.ts`** — Phaser.Scene subclass (key: `'BootScene'`):

**create() method:**
1. Generate all programmatic textures and cache them:
   - `'player_police'` — 12x12 dark navy rectangle with lighter cap area on top
   - `'player_rider'` — 12x12 gray rectangle
   - `'player_driver'` — 12x12 blue-orange rectangle
   - `'npc_civilian'` — 10x10 rectangle (multiple color variants: `'npc_civilian_1'` through `'npc_civilian_4'`)
   - `'npc_fare_evader'` — 10x10 red rectangle
   - `'npc_suspicious'` — 10x10 dark gray rectangle
   - `'station_entrance'` — 20x20 blue/orange rectangle with "S" indicator
   - `'building_1'` through `'building_4'` — various sized colored rectangles
   - `'tree'` — 8x8 green circle
   - `'joystick_base'` — 50px radius circle, semi-transparent white
   - `'joystick_thumb'` — 20px radius circle, white
   - `'action_button'` — 50x50 circle, orange
   - `'minimap_player'` — 4x4 white dot
   - `'minimap_station'` — 4x4 blue dot

   All textures generated using `this.make.graphics()` → draw shapes → `generateTexture(key, width, height)` → destroy graphics object.

2. Instantiate all managers and store in registry:
   - `this.game.registry.set('saveManager', new SaveManager())`
   - `this.game.registry.set('inputManager', new InputManager())`
   - `this.game.registry.set('audioManager', new AudioManager())`

3. Load or create save data via SaveManager

4. Transition to MainMenuScene (Phase 3) or a placeholder colored screen (Phase 0):
   - For Phase 0: just display a dark background with white text "MTA Underground" centered, and render the virtual joystick at the bottom of the screen to prove input works

### 7. SaveManager

**`src/managers/SaveManager.ts`** — Handles all localStorage persistence:

**Methods:**
- `hasSave(): boolean` — checks if `SAVE_KEY` exists in localStorage
- `createNewSave(selectedClass: CharacterClass): PlayerSave` — returns a fresh PlayerSave with defaults:
  - version: SAVE_VERSION
  - createdAt/lastPlayedAt: Date.now()
  - selectedClass: passed in
  - police class: unlocked=true, level=1, xp=0, xpToNextLevel=200, unlockedMissionIds=['police_m01', 'police_m02'], activeSkinId='police_skin_default', ownedSkinIds=['police_skin_default']
  - rider/driver class: unlocked=false, everything zeroed
  - wallet: STARTING_MONEY (0)
  - settings: musicVolume=0.5, sfxVolume=0.8, vibration=true, showFps=false, language='en'
  - stats: all zeros
- `save(data: PlayerSave): void` — serializes to JSON, writes to localStorage under SAVE_KEY, updates lastPlayedAt
- `load(): PlayerSave | null` — reads from localStorage, parses JSON, validates version, returns null if missing/corrupt
- `migrate(data: PlayerSave): PlayerSave` — if data.version < SAVE_VERSION, applies migration steps (for now just returns data since we're at version 1)
- `deleteSave(): void` — removes SAVE_KEY from localStorage
- `exportSave(): string` — returns the raw JSON string (for manual backup)
- `importSave(json: string): PlayerSave | null` — parses and validates imported save data

**No dependencies on Phaser** — this class is pure TypeScript, fully testable with Vitest.

### 8. InputManager

**`src/managers/InputManager.ts`** — Abstracts touch + keyboard input:

**Properties:**
- `direction: { x: number; y: number }` — normalized direction vector (-1 to 1 on each axis)
- `actionPressed: boolean` — true on the frame the action button is pressed
- `sprintHeld: boolean` — true while sprint is held

**Constructor takes a Phaser.Scene** to set up input listeners.

**Touch input (mobile):**
- Virtual joystick: renders at bottom-left of screen
  - On pointer down inside joystick base: track pointer
  - On pointer move: calculate direction vector from base center to pointer, clamp to joystick radius, normalize
  - On pointer up: reset direction to (0, 0), snap thumb back to center
  - Dead zone: ignore movements less than 10% of joystick radius
- Action button: renders at bottom-right of screen
  - On pointer down: set actionPressed=true for one frame
- Sprint: double-tap joystick area (detect two taps within 300ms)

**Keyboard input (desktop):**
- WASD or arrow keys for direction (normalize diagonal movement)
- Space bar for action
- Shift for sprint

**Methods:**
- `setup(scene: Phaser.Scene): void` — creates joystick and button game objects, registers keyboard listeners
- `update(): void` — called each frame to reset one-frame flags (actionPressed)
- `getDirection(): { x: number; y: number }` — returns current direction
- `isActionPressed(): boolean` — returns true for one frame when action triggered
- `isSprintHeld(): boolean` — returns sprint state
- `destroy(): void` — clean up listeners

**The virtual joystick and action button are Phaser GameObjects** (images using the generated textures) positioned in screen space (fixed to camera, using `setScrollFactor(0)`).

### 9. AudioManager

**`src/managers/AudioManager.ts`** — Shell for now, real implementation in Phase 5:

**Methods (all no-ops in Phase 0):**
- `init(scene: Phaser.Scene): void` — stores scene reference
- `playSFX(name: string): void` — does nothing yet
- `playMusic(name: string): void` — does nothing yet
- `stopMusic(): void` — does nothing yet
- `setMusicVolume(vol: number): void` — stores value
- `setSFXVolume(vol: number): void` — stores value
- `getMusicVolume(): number`
- `getSFXVolume(): number`

### 10. HUDScene

**`src/scenes/HUDScene.ts`** — Phaser.Scene subclass (key: `'HUDScene'`), launched in parallel with the game scene:

**Phase 0 implementation:**
- Empty scene that renders on top of the game scene
- Sets up the scene as a UI overlay (`this.scene.bringToTop()`)
- Has placeholder text "HUD" in the top-left corner
- This scene will be populated with UI components in later phases

### 11. SpriteFactory

**`src/graphics/SpriteFactory.ts`** — Static helper class for programmatic texture generation:

**Static methods:**
- `generateAllTextures(scene: Phaser.Scene): void` — generates every texture needed, called from BootScene
- `createRectTexture(scene: Phaser.Scene, key: string, width: number, height: number, color: number): void`
- `createCircleTexture(scene: Phaser.Scene, key: string, radius: number, color: number): void`
- `createCharacterTexture(scene: Phaser.Scene, key: string, bodyColor: number, headColor: number): void` — draws a simple character: rectangular body + smaller rectangle head
- `createBuildingTexture(scene: Phaser.Scene, key: string, width: number, height: number, color: number): void` — rectangle with darker border to suggest depth
- `createStationEntranceTexture(scene: Phaser.Scene, key: string): void` — blue rectangle with orange border (MTA-inspired)

Each method uses `scene.make.graphics({})`, draws shapes, calls `graphics.generateTexture(key, w, h)`, then `graphics.destroy()`.

### 12. Vitest Configuration

**`vitest.config.ts`** (or inside `vite.config.ts`):
- Test environment: 'node' (no DOM needed for manager tests)
- Include: `src/**/*.test.ts`
- Coverage: not required for MVP

### 13. First Test

**`src/managers/__tests__/SaveManager.test.ts`**:

Tests:
- `createNewSave()` returns valid PlayerSave with correct defaults
- `save()` + `load()` round-trips correctly
- `load()` returns null when nothing saved
- `deleteSave()` removes data
- `hasSave()` returns correct boolean

Uses a mock localStorage (simple in-memory object) since Vitest runs in Node.

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `package.json` | Project config, dependencies, scripts |
| `tsconfig.json` | TypeScript strict config |
| `vite.config.ts` | Vite build config |
| `public/index.html` | HTML shell |
| `src/main.ts` | Entry point |
| `src/types/game.types.ts` | All TypeScript interfaces |
| `src/types/events.types.ts` | Event string constants |
| `src/config/constants.ts` | Game-wide constants |
| `src/config/balance.ts` | Progression tuning values |
| `src/config/game-config.ts` | Phaser GameConfig |
| `src/graphics/colors.ts` | Color palette |
| `src/graphics/SpriteFactory.ts` | Programmatic texture generation |
| `src/scenes/BootScene.ts` | Boot, texture gen, manager init |
| `src/scenes/HUDScene.ts` | Empty HUD overlay |
| `src/managers/SaveManager.ts` | localStorage persistence |
| `src/managers/InputManager.ts` | Touch + keyboard abstraction |
| `src/managers/AudioManager.ts` | Audio shell (no-op) |
| `src/managers/__tests__/SaveManager.test.ts` | Unit test |

## Acceptance Criteria

1. `npm install` succeeds with no errors
2. `npm run dev` serves the game at localhost — browser shows a dark screen with "MTA Underground" text
3. `npm run build` produces a production bundle under 2MB in `dist/`
4. Virtual joystick renders at bottom-left, action button at bottom-right
5. Moving the joystick (touch) or pressing WASD (keyboard) produces direction values (log to console for verification)
6. SaveManager creates, saves, loads, and deletes save data correctly
7. `npm test` runs SaveManager tests — all pass
8. No TypeScript errors (`npx tsc --noEmit` passes)
9. No console errors in the browser
