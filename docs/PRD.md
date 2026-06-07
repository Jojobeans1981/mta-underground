# MTA Underground — Project Requirements Document

## Executive Summary

**MTA Underground** is a mobile-first, 2D top-down action game themed around the New York City Metropolitan Transit Authority. Inspired by the original GTA (1/2) visual and gameplay style, players choose between three character classes — Metro Police, Rider, or MTA Driver — each with unique missions, progression, and visual identity.

**Target audience:** Riders of NYC transit who already use the MTATalk bus locator app. The game is a standalone companion product designed for short 5–15 minute play sessions during commutes.

**Monetization:** Free-to-play with in-app purchases (cosmetics, XP boosts, mission packs). Ad-supported (provider TBD in Phase 4). No pay-to-win.

**Platform:** Single TypeScript codebase targeting web browsers (primary) and native iOS/Android via Capacitor wrapper.

---

## Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Player retention | Day-1 retention rate | >40% |
| Session length | Average session duration | 5–15 minutes |
| Monetization | IAP conversion rate | >3% of active users |
| Performance | Consistent frame rate on mid-range phones | 60fps |
| Launch speed | MVP playable and deployed | 3 weeks from start |
| Content depth | Missions per class (full game) | 10–15 each |

---

## User Stories & Personas

### Persona 1: The Commuter (Primary)
- **Who:** NYC transit rider, 18–45, uses MTATalk daily
- **Context:** Sitting on the bus/train with 5–20 minutes to kill
- **Wants:** Quick, engaging gameplay that feels familiar (NYC setting)
- **Needs:** Fast load, instant save, one-hand-friendly controls

### Persona 2: The Casual Gamer
- **Who:** Mobile gamer who discovers the app through app store / word of mouth
- **Context:** Looking for a fun, free, GTA-lite experience on mobile
- **Wants:** Progression, unlockables, variety
- **Needs:** Clear mission structure, rewarding loop, cosmetic expression

### User Stories

| ID | As a... | I want to... | So that... |
|----|---------|-------------|------------|
| US-1 | Player | Choose a character class at game start | I play the role that interests me |
| US-2 | Metro Police player | Chase and catch fare evaders | I complete pursuit missions |
| US-3 | Metro Police player | Patrol subway stations | I discover random events and earn XP |
| US-4 | Player | Earn money from missions | I can buy upgrades and cosmetics |
| US-5 | Player | Level up and unlock new missions | I feel progression |
| US-6 | Player | Save my progress automatically | I can resume on my next commute |
| US-7 | Player | Use touch controls comfortably | I can play one-handed on transit |
| US-8 | Rider player | Navigate the subway system | I complete commuter missions |
| US-9 | Driver player | Operate a bus/subway train | I complete route missions |
| US-10 | Player | Buy cosmetic items | I personalize my character |
| US-11 | Player | See my stats and achievements | I track my progress |
| US-12 | Player | Play offline | I don't need cell service underground |

---

## Technical Architecture

### Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Game Engine | Phaser 3 | ^3.80.0 | 2D game rendering, physics, input, audio |
| Language | TypeScript | ^5.4.0 | Type safety, maintainability |
| Build Tool | Vite | ^5.4.0 | Fast dev server, HMR, production bundling |
| Native Wrapper | Capacitor | ^6.0.0 | iOS/Android native builds |
| Package Manager | npm | latest | Dependency management |
| Testing | Vitest | ^1.6.0 | Unit tests for game logic |

### System Architecture

```
┌─────────────────────────────────────────────────┐
│                    GAME CLIENT                   │
│  ┌───────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Phaser 3  │ │ Game     │ │ UI Scenes      │  │
│  │ Renderer  │ │ Scenes   │ │ (Menu/HUD/     │  │
│  │           │ │ (World/  │ │  Pause/Shop)   │  │
│  │ Canvas/   │ │  Mission/│ │                │  │
│  │ WebGL     │ │  Station)│ │                │  │
│  └─────┬─────┘ └────┬─────┘ └───────┬────────┘  │
│        │            │               │            │
│  ┌─────┴────────────┴───────────────┴─────────┐  │
│  │              GAME MANAGERS                  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ Mission  │ │ Economy  │ │ Progression│  │  │
│  │  │ Manager  │ │ Manager  │ │ Manager    │  │  │
│  │  └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │  │
│  │  │ Save     │ │ Input    │ │ Audio      │  │  │
│  │  │ Manager  │ │ Manager  │ │ Manager    │  │  │
│  │  └──────────┘ └──────────┘ └────────────┘  │  │
│  │  ┌──────────┐ ┌──────────┐                 │  │
│  │  │ NPC      │ │ Map      │                 │  │
│  │  │ Manager  │ │ Manager  │                 │  │
│  │  └──────────┘ └──────────┘                 │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
│  ┌────────────────────┴───────────────────────┐  │
│  │              DATA LAYER                     │  │
│  │  localStorage (save state)                  │  │
│  │  Static JSON configs (missions, items, map) │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         │ (Phase 5)
         ▼
┌─────────────────────┐
│   Capacitor Shell   │
│  iOS / Android      │
│  IAP + Ads plugins  │
└─────────────────────┘
```

### Data Models

All data persists in `localStorage` as serialized JSON. No server, no database.

#### PlayerSave

```typescript
interface PlayerSave {
  version: number;                    // Save format version for migration
  createdAt: number;                  // Unix timestamp
  lastPlayedAt: number;              // Unix timestamp
  selectedClass: CharacterClass;     // 'police' | 'rider' | 'driver'
  classes: {
    police: ClassProgress;
    rider: ClassProgress;
    driver: ClassProgress;
  };
  wallet: number;                    // Current money balance (integer cents)
  settings: PlayerSettings;
  stats: PlayerStats;
}

type CharacterClass = 'police' | 'rider' | 'driver';

interface ClassProgress {
  unlocked: boolean;
  level: number;                     // 1-based
  xp: number;                       // Current XP within current level
  xpToNextLevel: number;            // XP needed to reach next level
  completedMissionIds: string[];     // Mission IDs completed
  unlockedMissionIds: string[];      // Mission IDs available to play
  equippedItems: string[];           // Item IDs currently equipped
  ownedItems: string[];              // Item IDs purchased/earned
  activeSkinId: string;             // Cosmetic skin ID
  ownedSkinIds: string[];           // Skin IDs purchased/earned
}

interface PlayerSettings {
  musicVolume: number;               // 0-1
  sfxVolume: number;                 // 0-1
  vibration: boolean;
  showFps: boolean;
  language: string;                  // 'en' default, future i18n
}

interface PlayerStats {
  totalPlayTime: number;             // Seconds
  totalMissionsCompleted: number;
  totalMoneyEarned: number;
  totalMoneySpent: number;
  totalXpEarned: number;
  highestLevel: number;
  missionsFailedCount: number;
  npcsCaught: number;               // Police-specific
  faresEvaded: number;              // Rider-specific
  passengersDelivered: number;      // Driver-specific
}
```

#### Mission Definition (Static Config)

```typescript
interface MissionDefinition {
  id: string;                        // e.g. 'police_m01'
  classRequired: CharacterClass;
  title: string;
  description: string;
  briefing: string;                  // Shown before mission starts
  district: DistrictId;
  stationId: string;                // Starting station
  levelRequired: number;
  type: MissionType;
  objectives: MissionObjective[];
  rewards: MissionRewards;
  timeLimit: number | null;          // Seconds, null = no limit
  difficulty: 1 | 2 | 3 | 4 | 5;
  unlockCondition: UnlockCondition;
}

type DistrictId = 'manhattan' | 'brooklyn' | 'queens' | 'bronx';

type MissionType =
  | 'pursuit'        // Chase and catch target
  | 'patrol'         // Visit checkpoints in order
  | 'escort'         // Protect/accompany NPC
  | 'investigate'    // Find clues at locations
  | 'timed_route'    // Complete route before timer
  | 'survival'       // Survive waves/duration
  | 'delivery'       // Transport item/person A to B
  | 'stealth';       // Avoid detection

interface MissionObjective {
  id: string;
  description: string;
  type: 'reach_location' | 'catch_npc' | 'collect_item' | 'survive_time' | 'interact_object' | 'escort_npc';
  targetId: string;                  // NPC/location/item ID
  count: number;                     // How many (1 for single targets)
  optional: boolean;                 // Bonus objectives
}

interface MissionRewards {
  money: number;
  xp: number;
  itemIds: string[];                 // Items awarded on completion
  bonusMoney: number;                // For optional objectives
  bonusXp: number;
}

interface UnlockCondition {
  type: 'level' | 'mission_complete' | 'always';
  value: number | string;            // Level number or mission ID
}
```

#### Item Definition (Static Config)

```typescript
interface ItemDefinition {
  id: string;                        // e.g. 'police_radio_2'
  name: string;
  description: string;
  classRequired: CharacterClass | null; // null = universal
  type: ItemType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  price: number;                     // Cost in money (0 = free/reward only)
  levelRequired: number;
  effects: ItemEffect[];
  icon: SpriteConfig;                // How to render in UI
}

type ItemType = 'equipment' | 'consumable' | 'cosmetic';

interface ItemEffect {
  stat: 'speed' | 'stamina' | 'detection_range' | 'catch_radius' | 'xp_multiplier' | 'money_multiplier';
  modifier: number;                  // Additive or multiplicative depending on stat
}

interface SpriteConfig {
  shape: 'rect' | 'circle' | 'triangle' | 'badge' | 'custom';
  primaryColor: string;              // Hex color
  secondaryColor: string;            // Hex color
  size: number;                      // Pixels
}
```

#### Map Data (Static Config)

```typescript
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
  id: string;                        // e.g. 'manhattan_times_sq'
  name: string;
  position: { x: number; y: number };
  entrances: { x: number; y: number }[];
  platforms: Platform[];
  connections: string[];             // Connected station IDs
  lineIds: string[];                 // Subway lines serving this station
}

interface Platform {
  id: string;
  position: { x: number; y: number };
  width: number;
  trackSide: 'north' | 'south' | 'east' | 'west';
}

interface SubwayLine {
  id: string;                        // e.g. 'line_1' (inspired by, not named after real lines)
  color: string;                     // Hex color
  stationIds: string[];              // Ordered station IDs on this line
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
```

#### NPC Definition

```typescript
interface NPCDefinition {
  id: string;
  type: NPCType;
  spriteConfig: SpriteConfig;
  speed: number;                     // Pixels per second
  behaviorPattern: BehaviorPattern;
  interactable: boolean;
  dialogueLines: string[];           // Random lines when interacted with
}

type NPCType =
  | 'civilian'
  | 'fare_evader'
  | 'suspicious_person'
  | 'lost_tourist'
  | 'vendor'
  | 'musician'
  | 'commuter';

type BehaviorPattern =
  | 'wander'        // Random movement within area
  | 'patrol'        // Follow waypoints
  | 'stationary'    // Stay in place
  | 'flee'          // Run from player
  | 'follow_path'   // Follow subway/street path
  | 'crowd';        // Dense group movement
```

### File Structure

```
mta-underground/
├── docs/                            # Pipeline documents (PRD, phases, prompts)
│   ├── PRD.md
│   ├── phases/
│   ├── prompts/
│   ├── validation/
│   └── state/
├── src/
│   ├── main.ts                      # Entry point — boots Phaser
│   ├── config/
│   │   ├── game-config.ts           # Phaser.Types.Core.GameConfig
│   │   ├── constants.ts             # Game-wide constants (speeds, sizes, colors)
│   │   └── balance.ts              # Tuning values (XP curve, prices, mission rewards)
│   ├── scenes/
│   │   ├── BootScene.ts             # Asset loading, initialization
│   │   ├── MainMenuScene.ts         # Title screen, play/settings/credits
│   │   ├── CharacterSelectScene.ts  # Class picker
│   │   ├── GameScene.ts             # Main gameplay world
│   │   ├── StationScene.ts          # Interior station view
│   │   ├── MissionBriefScene.ts     # Mission briefing overlay
│   │   ├── MissionCompleteScene.ts  # Results screen
│   │   ├── PauseScene.ts            # Pause overlay
│   │   ├── ShopScene.ts             # Item/cosmetic store
│   │   ├── StatsScene.ts            # Player stats/achievements
│   │   └── HUDScene.ts              # Always-on-top HUD overlay
│   ├── entities/
│   │   ├── Player.ts                # Player character (all classes)
│   │   ├── NPC.ts                   # Base NPC class
│   │   ├── FareEvader.ts            # NPC subtype: runs from police
│   │   ├── Civilian.ts              # NPC subtype: ambient population
│   │   ├── SuspiciousNPC.ts         # NPC subtype: investigation target
│   │   └── Entity.ts                # Base entity (position, sprite, physics)
│   ├── managers/
│   │   ├── SaveManager.ts           # localStorage read/write/migrate
│   │   ├── MissionManager.ts        # Mission lifecycle (start/track/complete/fail)
│   │   ├── EconomyManager.ts        # Money earn/spend, item purchase
│   │   ├── ProgressionManager.ts    # XP/level/unlock calculations
│   │   ├── InputManager.ts          # Touch + keyboard abstraction
│   │   ├── AudioManager.ts          # Procedural audio + SFX
│   │   ├── NPCManager.ts            # NPC spawning, AI, lifecycle
│   │   └── MapManager.ts            # District/station/line loading
│   ├── systems/
│   │   ├── PursuitSystem.ts         # Chase mechanics (police missions)
│   │   ├── PatrolSystem.ts          # Checkpoint patrol logic
│   │   ├── DayNightSystem.ts        # Time cycle, lighting changes
│   │   ├── WeatherSystem.ts         # Rain/snow/fog visual effects
│   │   └── DialogueSystem.ts        # NPC interaction text display
│   ├── ui/
│   │   ├── VirtualJoystick.ts       # Touch joystick component
│   │   ├── ActionButton.ts          # Context-sensitive action button
│   │   ├── MiniMap.ts               # Corner minimap
│   │   ├── HealthBar.ts             # Stamina/health display
│   │   ├── MoneyDisplay.ts          # Wallet HUD element
│   │   ├── XPBar.ts                 # Experience bar
│   │   ├── MissionTracker.ts        # Active mission objective display
│   │   ├── RadioDisplay.ts          # Police dispatch radio UI
│   │   └── NotificationToast.ts     # Popup notifications
│   ├── data/
│   │   ├── missions/
│   │   │   ├── police-missions.ts   # MissionDefinition[] for police class
│   │   │   ├── rider-missions.ts    # (Phase 2)
│   │   │   └── driver-missions.ts   # (Phase 3)
│   │   ├── items/
│   │   │   ├── police-items.ts      # ItemDefinition[] for police class
│   │   │   ├── rider-items.ts       # (Phase 2)
│   │   │   └── driver-items.ts      # (Phase 3)
│   │   ├── maps/
│   │   │   ├── manhattan.ts         # Manhattan district data
│   │   │   ├── brooklyn.ts          # (Phase 2)
│   │   │   ├── queens.ts            # (Phase 3)
│   │   │   └── bronx.ts             # (Phase 4)
│   │   ├── npcs.ts                  # NPC definitions
│   │   └── skins.ts                 # Cosmetic skin definitions
│   ├── graphics/
│   │   ├── SpriteFactory.ts         # Programmatic sprite generation
│   │   ├── TileRenderer.ts          # Map tile drawing (streets, buildings, tracks)
│   │   ├── CharacterRenderer.ts     # Character sprite drawing per class
│   │   ├── StationRenderer.ts       # Station interior rendering
│   │   ├── EffectsRenderer.ts       # Weather, day/night, particles
│   │   └── colors.ts                # Color palette constants
│   ├── audio/
│   │   ├── SFXGenerator.ts          # Procedural sound effect generation
│   │   └── MusicGenerator.ts        # Procedural ambient music/loops
│   └── types/
│       ├── game.types.ts            # All interfaces from this PRD
│       ├── events.types.ts          # Custom Phaser event type strings
│       └── enums.ts                 # Shared enums
├── public/
│   └── index.html                   # Shell HTML
├── capacitor.config.ts              # Capacitor native config (Phase 5)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Coding Standards

These rules apply identically across every phase, prompt, and line of code.

### TypeScript
- **Strict mode:** `"strict": true` in tsconfig
- **No `any`:** Every variable, parameter, and return value must be typed
- **Interfaces over types:** Use `interface` for object shapes, `type` for unions/aliases
- **Enums:** Use string enums for all categorical values
- **Null handling:** Explicit null checks, no non-null assertions (`!`)

### Naming
- **Files:** PascalCase for classes/scenes (`GameScene.ts`), kebab-case for configs/data (`police-missions.ts`)
- **Classes:** PascalCase (`MissionManager`)
- **Interfaces:** PascalCase, no `I` prefix (`PlayerSave`, not `IPlayerSave`)
- **Methods/functions:** camelCase (`startMission()`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_PLAYER_SPEED`)
- **Enums:** PascalCase name, PascalCase values (`CharacterClass.Police`)
- **Event strings:** dot-separated lowercase (`mission.started`, `player.levelup`)

### Architecture Patterns
- **Scene-based composition:** Each Phaser Scene is self-contained, communicates via the Phaser event bus
- **Manager singletons:** Game managers instantiated once in BootScene, attached to `scene.game.registry` for cross-scene access
- **Data-driven design:** All missions, items, NPCs, and map data are static config objects — no hardcoded gameplay values in logic code
- **Entity-component pattern:** Game entities (Player, NPC) extend a base Entity class with composable behaviors
- **Input abstraction:** All input goes through InputManager — game logic never reads raw Phaser input directly

### Code Organization
- **One class per file** (except small related types)
- **Imports:** Phaser imports first, then local imports, alphabetized within each group
- **No circular dependencies:** Managers depend on types and data, not on each other (communicate via events)
- **Magic numbers:** All tuning values in `constants.ts` or `balance.ts`, never inline

### Performance
- **Object pooling:** Reuse NPC and particle objects via Phaser Groups, never `new` in hot loops
- **Texture caching:** Generate all programmatic sprites once in BootScene, store as textures
- **Camera culling:** Only update/render entities within the camera viewport
- **Minimal GC:** Avoid allocations in `update()` loops — pre-allocate vectors, reuse objects

### Testing
- **Vitest for unit tests:** Test all managers and systems independently
- **Test data factories:** Helper functions that produce valid test data for each interface
- **No Phaser dependency in tests:** Managers accept injected dependencies, testable without a running Phaser instance

---

## Implementation Phases

### Phase 0: Project Scaffolding & Core Engine
**Goal:** Empty Phaser game that boots, renders a screen, handles input, and saves/loads.

**Deliverables:**
- Vite + TypeScript + Phaser 3 project initialized and building
- `BootScene` that generates all texture atlases programmatically
- `InputManager` with virtual joystick (touch) and keyboard support
- `SaveManager` with create/load/save/migrate functionality
- `AudioManager` shell (silent, but API in place)
- Color palette and constants defined
- All TypeScript interfaces from this PRD in `types/`
- Basic HUD rendering (empty, but scene exists)
- Vitest configured with one passing test

**Acceptance Criteria:**
- `npm run dev` serves the game at localhost
- `npm run build` produces a production bundle under 2MB
- Game boots to a colored screen on Chrome mobile and desktop
- Virtual joystick renders and reports direction values
- Save/load round-trips a `PlayerSave` through localStorage
- `npm test` passes

### Phase 1: World Map & Navigation
**Goal:** Player can walk around a simplified Manhattan district, enter/exit subway stations, and ride between them.

**Deliverables:**
- `MapManager` loads Manhattan district data
- `TileRenderer` draws streets, buildings, sidewalk, subway entrances
- `StationRenderer` draws station interiors (platforms, tracks, walls)
- `Player` entity moves on the world map with collision
- Camera follows player with smooth lerp
- Subway station entry/exit transitions
- Subway travel between 5 stations (fast-travel with brief animation)
- `MiniMap` UI component showing player position
- Day/night tint system (cosmetic only, no gameplay effect yet)
- Manhattan map data file with 5 stations and street grid

**Acceptance Criteria:**
- Player walks around Manhattan streets with collision against buildings
- Player enters a station entrance and scene transitions to station interior
- Player can board a train and travel to another station
- Minimap updates in real time
- Day/night cycle tints the screen on a 10-minute real-time cycle
- All movement at 60fps on Chrome mobile emulator

### Phase 2: NPCs & Game World Population
**Goal:** The world feels alive with ambient NPCs and interactive characters.

**Deliverables:**
- `Entity` base class with position, sprite, physics body
- `NPC` class extending Entity with behavior patterns
- `Civilian` NPCs that wander, follow paths, crowd stations
- `NPCManager` handles spawning, pooling, lifecycle
- NPC collision with player and environment
- Basic NPC interaction (walk up and press action button to see dialogue)
- `DialogueSystem` for text display
- Ambient NPC population on streets and in stations (10–20 visible at once)
- NPC definitions data file

**Acceptance Criteria:**
- 15+ NPCs visible on screen at once without frame drops
- NPCs walk on sidewalks, wait on platforms, enter/exit stations
- Player can interact with NPCs to see dialogue text
- NPCs despawn when far from camera, respawn when area re-entered
- No NPC walks through walls or off the map

### Phase 3: Metro Police Class & Mission System
**Goal:** Player can select Metro Police, accept missions, and play through the full mission loop.

**Deliverables:**
- `CharacterSelectScene` with Police playable, Rider/Driver shown as "Coming Soon"
- `MainMenuScene` with New Game, Continue, Settings options
- `MissionManager` — accept, track objectives, complete, fail, reward
- `MissionBriefScene` and `MissionCompleteScene`
- `MissionTracker` HUD element showing active objectives
- `PursuitSystem` — chase mechanics (player chases fleeing NPC)
- `PatrolSystem` — visit waypoints in order
- `FareEvader` NPC type that flees from player
- `SuspiciousNPC` type for investigation missions
- `RadioDisplay` UI — dispatch messages for police class
- 10 Metro Police missions (data file):
  1. "First Beat" — Tutorial patrol, visit 3 platforms
  2. "Fare Jumper" — Chase a single fare evader
  3. "Rush Hour Patrol" — Patrol during heavy NPC crowds
  4. "The Runner" — High-speed pursuit across 2 stations
  5. "Suspicious Package" — Investigate 3 locations, find the right one
  6. "Platform Incident" — Escort injured NPC to station exit
  7. "Night Shift" — Patrol at night with reduced visibility
  8. "Double Trouble" — Chase 2 fare evaders simultaneously
  9. "Underground Network" — Multi-station investigation across 4 stops
  10. "The Kingpin" — Final boss pursuit across entire Manhattan map

**Acceptance Criteria:**
- Player selects Police class and spawns in Manhattan in uniform
- All 10 missions playable start to finish
- Mission objectives track and update in real time
- Failed missions can be retried
- Completed missions award money and XP
- Pursuit system: evaders flee intelligently (pathfinding around obstacles)
- Radio dispatch messages appear for new missions
- Mission difficulty scales (mission 1 is easy, mission 10 is hard)

### Phase 4: Economy, Progression & Shop
**Goal:** Players earn and spend money, level up, buy items, and equip cosmetics.

**Deliverables:**
- `EconomyManager` — earn money from missions, spend in shop
- `ProgressionManager` — XP gain, level-up logic, unlock calculations
- XP curve: each level requires 20% more XP than the previous
- `ShopScene` — browse and purchase items/skins
- `StatsScene` — view player stats and achievements
- `MoneyDisplay` HUD element
- `XPBar` HUD element with level-up animation
- `NotificationToast` for level-ups, unlocks, purchases
- 5 Police items (data file):
  1. "Standard Radio" (free, equipped by default) — base detection range
  2. "Long-Range Radio" ($500, level 2) — +25% detection range
  3. "Running Shoes" ($300, level 1) — +10% movement speed
  4. "Tactical Vest" ($800, level 3) — +20% stamina
  5. "Detective Badge" ($1500, level 5) — +15% XP from missions
- 3 Police skins (data file):
  1. "Standard Blue" (free, default)
  2. "Plainclothes" ($1000, level 3)
  3. "Gold Shield" ($2500, level 5)
- Level cap: 10 for MVP

**Acceptance Criteria:**
- Money earned from missions appears in wallet
- Items purchasable in shop with money
- Equipped items modify player stats (visible in stats screen)
- Level-up triggers notification and unlocks new missions
- Skins change player sprite color/shape
- Cannot buy items without sufficient money or level
- All state persists across sessions via SaveManager

### Phase 5: Polish, Audio & Game Feel
**Goal:** The game feels polished, sounds good, and is fun to play.

**Deliverables:**
- `SFXGenerator` — procedural sound effects:
  - Footsteps (different surfaces)
  - Radio crackle/beep
  - Train arriving/departing
  - Chase music (tempo increases near target)
  - Level-up fanfare
  - Money earned chime
  - UI button clicks
  - Ambient station noise (crowd murmur)
- `MusicGenerator` — procedural ambient loops:
  - Street theme (mellow, urban)
  - Station theme (echoing, atmospheric)
  - Chase theme (tense, fast)
  - Menu theme (chill, inviting)
- `WeatherSystem` — visual rain/snow/fog particles
- Screen shake on impacts
- Smooth scene transitions (fade/slide)
- `PauseScene` with resume/settings/quit
- Settings: volume sliders, vibration toggle
- Game over screen with retry/quit options
- Performance optimization pass (object pooling audit, draw call reduction)
- Touch control polish (dead zones, sensitivity tuning)

**Acceptance Criteria:**
- All SFX play at appropriate moments
- Music loops seamlessly, crossfades between scenes
- Weather effects render without frame drops
- Pause works instantly, game state is frozen
- Settings persist via SaveManager
- Game feels responsive — no input lag on touch
- Consistent 60fps on a mid-range phone (test: Chrome DevTools throttle to 4x slowdown)

---

## Phase Summary (Future — Not Built in MVP Pipeline)

| Phase | Name | Content | Depends On |
|-------|------|---------|------------|
| 6 | Rider Class | Rider character, Brooklyn district, 10 commuter missions, MetroCard mechanic | Phases 0–5 |
| 7 | Driver Class | Driver character, Queens district, 10 route missions, vehicle controls | Phases 0–5 |
| 8 | Bronx & Multiplayer | Bronx district, multiplayer foundation (future server), leaderboards | Phases 6–7 |
| 9 | Monetization | IAP store (Capacitor IAP plugin), ad integration (provider TBD), premium MetroCard | Phases 0–5 |
| 10 | Native Builds | Capacitor iOS/Android builds, app store assets, submission | Phase 9 |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Phaser 3 performance on low-end phones | Medium | High | Object pooling, texture caching, camera culling. Test early on throttled Chrome. |
| Procedural sprites look too primitive | Medium | Medium | Use a rich color palette, add simple animation frames. Upgrade to real art post-MVP. |
| Procedural audio sounds bad | Medium | Medium | Keep SFX simple and short. Use proven synthesis patterns (noise + filter for radio, sine waves for chimes). Mute option always available. |
| Touch controls feel clunky | High | High | Implement virtual joystick with configurable dead zone and sensitivity. Test on real phones early. Prioritize one-hand play. |
| localStorage data loss on app update/clear | Medium | Medium | Version the save format, warn users, add export/import save feature in Phase 5. |
| NYC/MTA trademark issues | Low | High | No real MTA logos, train line names, or copyrighted signage. Use inspired-by names and colors. |
| Scope creep from 3 character classes | High | High | Ship Police class only in MVP. Rider and Driver gated behind "Coming Soon" with clear player expectation. |
| Solo developer burnout | Medium | High | Strict phase boundaries. Ship each phase as playable. Don't start next phase until current phase is done and fun. |

---

## Dependencies & Environment

### npm Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| phaser | ^3.80.0 | Game engine |
| typescript | ^5.4.0 | Language |
| vite | ^5.4.0 | Build tool |
| vitest | ^1.6.0 | Unit testing |
| @capacitor/core | ^6.0.0 | Native wrapper (Phase 5+) |
| @capacitor/cli | ^6.0.0 | Native build tooling (Phase 5+) |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @types/node | ^20.0.0 | Node type definitions |

### Environment Variables

None required for MVP. The game is fully client-side with no external services.

### Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Mission Design Details (Metro Police — Phase 3)

### Mission 1: "First Beat"
- **Type:** Patrol
- **Briefing:** "Welcome to Transit, Officer. Your first shift is a simple walkthrough. Visit the platforms at Grand Central, Penn Station, and City Hall to check in."
- **Objectives:** Visit 3 station platforms in any order
- **Time limit:** None
- **Difficulty:** 1
- **Rewards:** $100, 50 XP
- **Unlock:** Always available (starter mission)

### Mission 2: "Fare Jumper"
- **Type:** Pursuit
- **Briefing:** "We've got a fare evader at Union Square. Suspect jumped the turnstile heading downtown. Intercept and detain."
- **Objectives:** Chase and catch 1 fare evader NPC
- **Time limit:** 60 seconds
- **Difficulty:** 1
- **Rewards:** $150, 75 XP
- **Unlock:** Complete Mission 1

### Mission 3: "Rush Hour Patrol"
- **Type:** Patrol
- **Briefing:** "Evening rush is hitting hard. We need eyes on the platform. Walk the beat at Times Square during peak hour — keep the peace."
- **Objectives:** Patrol Times Square station for 90 seconds, interact with 3 commuters
- **Time limit:** 120 seconds
- **Difficulty:** 2
- **Rewards:** $200, 100 XP
- **Unlock:** Level 2

### Mission 4: "The Runner"
- **Type:** Pursuit
- **Briefing:** "Got a real runner this time. Suspect evaded fare at Grand Central and is heading toward Penn Station on foot through the tunnels. This one's fast."
- **Objectives:** Chase fare evader across 2 stations, catch before they exit
- **Time limit:** 90 seconds
- **Difficulty:** 2
- **Rewards:** $300, 150 XP
- **Unlock:** Complete Mission 2

### Mission 5: "Suspicious Package"
- **Type:** Investigate
- **Briefing:** "Dispatch received a call about an unattended bag. Could be nothing, could be something. Check the reported locations at Union Square — platforms, mezzanine, and exit corridor."
- **Objectives:** Search 3 locations, find the suspicious item, report it
- **Time limit:** 120 seconds
- **Difficulty:** 3
- **Rewards:** $400, 200 XP
- **Unlock:** Level 3

### Mission 6: "Platform Incident"
- **Type:** Escort
- **Briefing:** "Got a medical situation at City Hall. A passenger collapsed on the northbound platform. Get to them, provide first response, and escort them to street level for EMS."
- **Objectives:** Reach NPC, interact to stabilize, escort to station exit
- **Time limit:** 90 seconds
- **Difficulty:** 3
- **Rewards:** $350, 175 XP
- **Unlock:** Complete Mission 5

### Mission 7: "Night Shift"
- **Type:** Patrol
- **Briefing:** "Late night duty. The stations thin out after midnight but that's when trouble likes to show up. Patrol Penn Station and Grand Central — visibility is reduced, stay sharp."
- **Objectives:** Patrol 2 stations with reduced visibility radius, interact with 2 suspicious NPCs
- **Time limit:** 180 seconds
- **Difficulty:** 3
- **Rewards:** $500, 250 XP
- **Unlock:** Level 4

### Mission 8: "Double Trouble"
- **Type:** Pursuit
- **Briefing:** "Two suspects, one station. Both jumped turnstiles at Times Square heading opposite directions. You'll need to decide who to chase first — or get creative."
- **Objectives:** Catch 2 fare evaders (they flee in different directions)
- **Time limit:** 120 seconds
- **Difficulty:** 4
- **Rewards:** $600, 300 XP
- **Unlock:** Complete Mission 4 and Mission 7

### Mission 9: "Underground Network"
- **Type:** Investigate
- **Briefing:** "Intel says a group is running a counterfeit MetroCard operation across multiple stations. Visit Grand Central, Times Square, Union Square, and Penn Station. Find the evidence at each location."
- **Objectives:** Visit 4 stations, find evidence item at each, collect all 4
- **Time limit:** 240 seconds
- **Difficulty:** 4
- **Rewards:** $800, 400 XP
- **Unlock:** Level 5 + Complete Mission 5

### Mission 10: "The Kingpin"
- **Type:** Pursuit + Investigate
- **Briefing:** "This is it, Officer. The counterfeit operation leads to one person. They've been spotted at City Hall station but they won't go quietly. Track them across the entire Manhattan system. This is your moment."
- **Objectives:** Chase the boss NPC through all 5 stations, catch them before they escape the map
- **Time limit:** 300 seconds
- **Difficulty:** 5
- **Rewards:** $1500, 750 XP, unlocks "Gold Shield" skin
- **Unlock:** Complete Mission 9

---

## Item Details (Metro Police — Phase 4)

### Equipment

| ID | Name | Price | Level | Effect |
|----|------|-------|-------|--------|
| police_radio_1 | Standard Radio | $0 | 1 | Base detection range (100px) |
| police_radio_2 | Long-Range Radio | $500 | 2 | +25% detection range (125px) |
| police_shoes_1 | Running Shoes | $300 | 1 | +10% movement speed |
| police_vest_1 | Tactical Vest | $800 | 3 | +20% stamina |
| police_badge_1 | Detective Badge | $1500 | 5 | +15% XP from all sources |

### Cosmetic Skins

| ID | Name | Price | Level | Visual |
|----|------|-------|-------|--------|
| police_skin_default | Standard Blue | $0 | 1 | Dark blue rectangle body, light blue cap |
| police_skin_plain | Plainclothes | $1000 | 3 | Gray body, no cap, badge visible |
| police_skin_gold | Gold Shield | $2500 | 5 | Dark blue body with gold trim, gold cap |

---

## XP & Level Curve

| Level | XP Required | Cumulative XP | Unlocks |
|-------|-------------|---------------|---------|
| 1 | 0 | 0 | Missions 1, 2; Standard Radio; Running Shoes |
| 2 | 200 | 200 | Mission 3; Long-Range Radio |
| 3 | 240 | 440 | Mission 5; Tactical Vest; Plainclothes skin |
| 4 | 288 | 728 | Mission 7 |
| 5 | 346 | 1074 | Mission 9; Detective Badge; Gold Shield skin |
| 6 | 415 | 1489 | — (future content) |
| 7 | 498 | 1987 | — |
| 8 | 598 | 2585 | — |
| 9 | 717 | 3302 | — |
| 10 | 861 | 4163 | Level cap (MVP) |

Formula: `xpRequired = Math.floor(200 * Math.pow(1.2, level - 2))` for level 2+.

---

## Manhattan Map Design

The Manhattan district is a simplified grid representing Midtown/Downtown. Not to scale, but recognizable.

### Stations (5)

| ID | Name | Grid Position | Lines |
|----|------|--------------|-------|
| manhattan_grand_central | Grand Central | (500, 200) | Red, Green |
| manhattan_times_sq | Times Square | (300, 300) | Red, Blue |
| manhattan_penn | Penn Station | (200, 400) | Blue |
| manhattan_union_sq | Union Square | (500, 500) | Green, Yellow |
| manhattan_city_hall | City Hall | (350, 700) | Yellow |

### Subway Lines (inspired names, NOT real MTA line names)

| ID | Color | Route |
|----|-------|-------|
| line_red | #FF4444 | Grand Central → Times Square |
| line_blue | #4444FF | Times Square → Penn Station |
| line_green | #44FF44 | Grand Central → Union Square |
| line_yellow | #FFFF44 | Union Square → City Hall |

### Landmarks (visual reference points, NOT real trademarked names)

| Name | Position | Visual |
|------|----------|--------|
| Central Tower | (500, 100) | Tall gray rectangle with spire |
| Theater Row | (250, 300) | Row of colorful small rectangles with marquee lights |
| Garden Arena | (150, 400) | Large circular structure |
| The Square Park | (500, 450) | Green rectangle with trees (circles) |
| Bridge Approach | (400, 800) | Diagonal lines leading off-map (south) |

### World Size
- Total map: 1000 x 1000 game units (each unit = 1 pixel at 1x zoom)
- Camera viewport: 375 x 667 (iPhone SE equivalent, scales up)
- Streets: 40px wide roads in a grid pattern
- Buildings: Colored rectangles filling city blocks (40–100px per block)
- Sidewalks: 10px strips alongside roads

---

*End of PRD*
