# Phase 1: World Map & Navigation

## Current State (After Phase 0)
The project is scaffolded and running:
- Vite + TypeScript + Phaser 3 configured and building
- BootScene generates all programmatic textures and initializes managers
- SaveManager handles localStorage persistence
- InputManager provides virtual joystick (touch) + keyboard (WASD) input with direction vector and action button
- AudioManager exists as a no-op shell
- HUDScene exists as an empty overlay
- SpriteFactory generates all textures programmatically
- All types, constants, colors, and balance values defined
- Game boots to a dark screen with "MTA Underground" text and a working joystick
- Vitest configured with passing SaveManager tests

### Existing Files
- `package.json`, `tsconfig.json`, `vite.config.ts`, `public/index.html`
- `src/main.ts`
- `src/types/game.types.ts`, `src/types/events.types.ts`
- `src/config/constants.ts`, `src/config/balance.ts`, `src/config/game-config.ts`
- `src/graphics/colors.ts`, `src/graphics/SpriteFactory.ts`
- `src/scenes/BootScene.ts`, `src/scenes/HUDScene.ts`
- `src/managers/SaveManager.ts`, `src/managers/InputManager.ts`, `src/managers/AudioManager.ts`
- `src/managers/__tests__/SaveManager.test.ts`

## Goal
Build the Manhattan game world. The player can walk around streets, enter/exit subway stations, ride the subway between 5 stations, and see a minimap. A day/night tint cycle adds atmosphere.

## Tech Stack
Same as Phase 0 (Phaser 3, TypeScript, Vite, Vitest).

## Coding Standards
Same as Phase 0 (strict TypeScript, PascalCase classes, camelCase methods, UPPER_SNAKE constants, no `any`, no magic numbers, event bus communication, object pooling, camera culling).

## Deliverables

### 1. Manhattan Map Data

**`src/data/maps/manhattan.ts`** — Exports a `District` object for Manhattan:

**5 Stations:**

| id | name | position | entrances | connections | lines |
|----|------|----------|-----------|-------------|-------|
| manhattan_grand_central | Grand Central | (500, 200) | [(510, 215), (490, 215)] | [manhattan_times_sq, manhattan_union_sq] | [line_red, line_green] |
| manhattan_times_sq | Times Square | (300, 300) | [(310, 315), (290, 315)] | [manhattan_grand_central, manhattan_penn] | [line_red, line_blue] |
| manhattan_penn | Penn Station | (200, 400) | [(210, 415), (190, 415)] | [manhattan_times_sq] | [line_blue] |
| manhattan_union_sq | Union Square | (500, 500) | [(510, 515), (490, 515)] | [manhattan_grand_central, manhattan_city_hall] | [line_green, line_yellow] |
| manhattan_city_hall | City Hall | (350, 700) | [(360, 715), (340, 715)] | [manhattan_union_sq] | [line_yellow] |

Each station has 1 platform:
- Platform centered in station, 60px wide
- Track side determined by primary line direction

**4 Subway Lines:**

| id | color | stations |
|----|-------|---------|
| line_red | #FF4444 | [grand_central, times_sq] |
| line_blue | #4444FF | [times_sq, penn] |
| line_green | #44FF44 | [grand_central, union_sq] |
| line_yellow | #FFFF44 | [union_sq, city_hall] |

**Street Grid:**
- Major horizontal roads at y = 150, 250, 350, 450, 550, 650, 750 (7 roads)
- Major vertical roads at x = 150, 300, 500, 700, 850 (5 avenues)
- All roads 40px wide
- Sidewalks 10px strips on each side of every road
- Buildings fill blocks between roads (colored rectangles from building palette)

**Landmarks:**

| id | name | position | size | sprite |
|----|------|----------|------|--------|
| central_tower | Central Tower | (500, 100) | 40x80 | Tall gray rect |
| theater_row | Theater Row | (250, 300) | 80x30 | Row of colored small rects |
| garden_arena | Garden Arena | (150, 400) | 60x60 | Large circle |
| square_park | The Square Park | (500, 450) | 80x80 | Green rect with tree circles |
| bridge_approach | Bridge Approach | (400, 800) | 100x40 | Diagonal gray lines |

**District bounds:** `{ x: 0, y: 0, width: 1000, height: 1000 }`

**Unlock condition:** `{ type: 'always', value: 0 }` (always available)

### 2. MapManager

**`src/managers/MapManager.ts`**

**Properties:**
- `currentDistrict: District` — currently loaded district
- `stationMap: Map<string, Station>` — fast lookup by station ID

**Methods:**
- `loadDistrict(id: DistrictId): District` — imports and returns district data (for MVP, only Manhattan exists)
- `getStation(id: string): Station | null` — lookup station by ID
- `getConnectedStations(stationId: string): Station[]` — returns stations connected by subway lines
- `getStationAtPosition(x: number, y: number, radius: number): Station | null` — checks if a position is near any station entrance
- `getLinesBetweenStations(fromId: string, toId: string): SubwayLine[]` — returns subway lines connecting two stations
- `isWalkable(x: number, y: number): boolean` — checks if a world position is on a road/sidewalk (not inside a building)
- `getBuildingsInView(camera: Phaser.Cameras.Scene2D.Camera): Array<{x: number, y: number, w: number, h: number, color: string}>` — returns buildings within camera bounds for rendering

Instantiated in BootScene, stored in `game.registry` as `'mapManager'`.

### 3. TileRenderer

**`src/graphics/TileRenderer.ts`**

Renders the overworld map. Uses a Phaser RenderTexture or TileSprite approach for performance — draws the static map once, not every frame.

**Methods:**
- `renderDistrict(scene: Phaser.Scene, district: District): Phaser.GameObjects.Container` — draws the complete district:
  1. Dark asphalt background covering district bounds
  2. Roads: gray rectangles for each street segment
  3. Sidewalks: lighter gray strips along roads
  4. Buildings: colored rectangles filling city blocks (use building color palette, vary by position for visual diversity)
  5. Landmarks: draw each landmark according to its spriteConfig
  6. Station entrances: blue/orange rectangles at each station entrance position, with text label
  7. Trees in park areas: small green circles
  8. Returns a Container holding all static elements

- `renderStationMarkers(scene: Phaser.Scene, stations: Station[]): Phaser.GameObjects.Container` — draws station entrance indicators that pulse to attract player attention (simple alpha tween)

**Performance approach:** The district is rendered once to a RenderTexture on load, then displayed as a single image. Only dynamic elements (player, NPCs, effects) are drawn per-frame.

### 4. StationRenderer

**`src/graphics/StationRenderer.ts`**

Renders subway station interiors when the player enters.

**Methods:**
- `renderStation(scene: Phaser.Scene, station: Station): Phaser.GameObjects.Container` — draws a station interior:
  1. Station walls: dark gray rectangles forming a rectangular room (~300x200px)
  2. Platform: lighter gray rectangle in center
  3. Tracks: dark lines with silver rails on one side of platform
  4. Turnstiles: small gray rectangles at entrance area
  5. Station sign: colored rectangle with station name text (uses the line color)
  6. Exit signs: small green rectangles near entrance positions with "EXIT" text
  7. Train arrival area: darker region along tracks where train will appear
  8. Returns a Container holding all station elements

- `renderTrainArrival(scene: Phaser.Scene, lineColor: string): Phaser.GameObjects.Rectangle` — creates a train graphic (long colored rectangle) that slides in from off-screen, stops, then opens "doors" (gap appears)

- `renderTrainDeparture(scene: Phaser.Scene, train: Phaser.GameObjects.Rectangle): void` — closes doors, slides train off-screen

### 5. Player Entity

**`src/entities/Player.ts`**

The player character. Extends Phaser.GameObjects.Container (not a raw sprite, because the player visual may combine multiple shapes).

**Properties:**
- `body: Phaser.Physics.Arcade.Body` — physics body for collision
- `characterClass: CharacterClass` — which class this player is
- `speed: number` — current movement speed (base from PLAYER_SPEED + item modifiers)
- `stamina: number` — current stamina (for sprinting)
- `maxStamina: number` — max stamina (base + item modifiers)
- `isInStation: boolean` — whether player is inside a station
- `currentStationId: string | null` — station ID if inside one

**Constructor(scene, x, y, characterClass):**
- Creates a sprite using the appropriate texture (`'player_police'`, etc.)
- Enables Arcade physics on this container
- Sets body size to PLAYER_SIZE x PLAYER_SIZE
- Sets collideWorldBounds = true

**Methods:**
- `update(direction: {x: number, y: number}, isSprinting: boolean, delta: number): void` — moves player based on input direction and sprint state:
  - Calculate velocity from direction * speed (or speed * SPRINT_MULTIPLIER if sprinting and stamina > 0)
  - Drain stamina while sprinting, regen while not
  - Set body velocity
  - Flip sprite based on movement direction (left/right)
  
- `enterStation(stationId: string): void` — sets isInStation=true, stores stationId
- `exitStation(): void` — sets isInStation=false, clears stationId
- `getPosition(): { x: number; y: number }` — returns world position
- `applyItemEffects(effects: ItemEffect[]): void` — modifies speed/stamina based on equipped items

### 6. GameScene

**`src/scenes/GameScene.ts`** — Phaser.Scene subclass (key: `'GameScene'`):

The main gameplay scene where the player walks around the overworld.

**create():**
1. Get MapManager from registry, load Manhattan district
2. Use TileRenderer to render the district — add the returned Container to the scene
3. Create Player entity at starting position (Grand Central station entrance: 500, 215)
4. Set up Arcade physics collision between Player and building boundaries
5. Configure camera:
   - Set bounds to district bounds (0, 0, 1000, 1000)
   - Start following player with lerp (CAMERA_LERP)
   - Set zoom to CAMERA_ZOOM_DEFAULT (1.5)
6. Get InputManager from registry, call setup(this) to create joystick/button in this scene
7. Launch HUDScene in parallel (`this.scene.launch('HUDScene')`)
8. Set up station entrance detection zones (overlap triggers at each station entrance position)
9. Start DayNightSystem

**update(time, delta):**
1. Read input from InputManager
2. Update Player with direction and sprint state
3. InputManager.update() to reset one-frame flags
4. Check for station entrance proximity — if player overlaps entrance and presses action, trigger station entry

**Station entry flow:**
1. Fade out GameScene camera
2. Store player position for return
3. Scene.sleep('GameScene')
4. Scene.launch('StationScene', { stationId: id })

**Station exit flow (received via event):**
1. Scene.stop('StationScene')
2. Scene.wake('GameScene')
3. Restore player to station entrance position
4. Fade camera back in

### 7. StationScene

**`src/scenes/StationScene.ts`** — Phaser.Scene subclass (key: `'StationScene'`):

Shows the inside of a subway station. Player can walk around, approach platforms, and board trains.

**create(data: { stationId: string }):**
1. Get MapManager, look up station by ID
2. Use StationRenderer to render station interior
3. Create Player at the entrance position of the station
4. Set up camera (no world bounds scrolling — station fits in one screen, or small scroll)
5. Set up InputManager for this scene
6. Create exit zone near the entrance — player walks to it and presses action to exit
7. Create platform zone — player walks to platform and presses action to see train destinations
8. Display station name at top of screen

**Train boarding flow:**
1. Player approaches platform, presses action
2. Show a simple destination picker: list connected stations (text buttons)
3. Player selects a destination
4. Play train arrival animation (StationRenderer.renderTrainArrival)
5. Fade to black
6. Wait 1 second (simulating travel)
7. Fade in at destination station (re-render StationScene with new station ID)
8. Play train departure animation

**Exit flow:**
1. Player walks to exit zone, presses action
2. Emit event that GameScene listens for
3. StationScene stops, GameScene wakes with player at that station's entrance

### 8. MiniMap

**`src/ui/MiniMap.ts`**

A small map in the top-right corner of the HUD showing the player's position and stations.

**Constructor(scene: Phaser.Scene, x: number, y: number):**
- Creates a RenderTexture of MINIMAP_SIZE x MINIMAP_SIZE
- Renders a simplified version of the district:
  - Dark background
  - Roads as thin lines
  - Station dots (colored by line)
  - Player dot (white, blinking)
- Fixed to camera (scrollFactor 0)
- Semi-transparent background (alpha 0.7)

**Methods:**
- `update(playerX: number, playerY: number): void` — redraws the player dot at the correct minimap position
  - Minimap position = (playerX / WORLD_WIDTH) * MINIMAP_SIZE, same for Y
- `show(): void` / `hide(): void` — toggle visibility

Added to HUDScene.

### 9. DayNightSystem

**`src/systems/DayNightSystem.ts`**

Simple tint overlay that cycles between day and night.

**Properties:**
- `timeOfDay: number` — 0 to 1 (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
- `cycleDuration: number` — DAY_NIGHT_CYCLE_DURATION (600 seconds)
- `overlay: Phaser.GameObjects.Rectangle` — full-screen tint rectangle

**Constructor(scene: Phaser.Scene):**
- Creates a full-screen rectangle with alpha 0, fixed to camera
- Sets depth to a high value (above world, below HUD)

**Methods:**
- `update(delta: number): void` — advances timeOfDay based on delta, calculates tint:
  - 0.0–0.25 (midnight to sunrise): dark blue tint, alpha 0.4 → 0
  - 0.25–0.75 (day): no tint, alpha 0
  - 0.75–1.0 (sunset to midnight): tint increases, alpha 0 → 0.4
  - Uses sine curve for smooth transitions
- `getTimeOfDay(): number` — returns current time 0–1
- `isNight(): boolean` — returns true if timeOfDay < 0.25 or > 0.75
- `setTime(time: number): void` — manually set time (for mission-specific lighting)

### 10. Collision Setup

Building collision in GameScene:
- After TileRenderer creates the district, generate invisible Arcade physics static bodies for each building rectangle
- Group all building bodies into a `Phaser.Physics.Arcade.StaticGroup`
- Add collider: `this.physics.add.collider(player, buildingGroup)`
- Player cannot walk through buildings — they slide along edges

Station entrance detection:
- Create invisible overlap zones at each station entrance position (20x20)
- Use `this.physics.add.overlap(player, entranceZones)` to detect proximity
- When overlapping + action pressed → enter station

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `src/data/maps/manhattan.ts` | Manhattan district data (stations, streets, landmarks) |
| `src/managers/MapManager.ts` | District loading, station lookup, walkability checks |
| `src/graphics/TileRenderer.ts` | Overworld map rendering |
| `src/graphics/StationRenderer.ts` | Station interior rendering + train animations |
| `src/entities/Player.ts` | Player character entity |
| `src/scenes/GameScene.ts` | Main overworld gameplay scene |
| `src/scenes/StationScene.ts` | Station interior scene |
| `src/ui/MiniMap.ts` | Corner minimap HUD element |
| `src/systems/DayNightSystem.ts` | Day/night tint cycle |

## Files Modified in This Phase

| File | Change |
|------|--------|
| `src/scenes/BootScene.ts` | Add MapManager instantiation to registry; after texture generation, transition to GameScene instead of placeholder screen |
| `src/scenes/HUDScene.ts` | Instantiate and update MiniMap component |
| `src/config/game-config.ts` | Register GameScene and StationScene in the scene list |
| `src/graphics/SpriteFactory.ts` | Add any additional textures needed (train, exit sign, turnstile) |

## Acceptance Criteria

1. Player spawns near Grand Central and can walk in all directions using joystick/keyboard
2. Player collides with buildings — cannot walk through them
3. Player walks to a station entrance, presses action → transitions to station interior
4. Inside station: player can walk around, see platform, tracks, station name, exit signs
5. Player approaches platform, presses action → sees list of connected stations
6. Selecting a station → train arrives, fade to black, arrive at destination station
7. Player walks to exit → returns to overworld at that station's entrance
8. Minimap in top-right shows player dot moving, station dots visible
9. Day/night tint cycles over 10 minutes — visible darkening at night
10. All transitions smooth (fade in/out), no jarring cuts
11. 60fps maintained with full map rendered on Chrome mobile emulator
12. No TypeScript errors, no console errors
