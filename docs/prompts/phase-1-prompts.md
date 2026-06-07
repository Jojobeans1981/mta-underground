# Phase 1 — Implementation Prompts

## Prompt 1.1: Manhattan Map Data

**Create:** `src/data/maps/manhattan.ts`

**Imports:** `District`, `Station`, `SubwayLine`, `Landmark`, `StreetSegment`, `Platform` from `'@/types/game.types'`

Export a constant `MANHATTAN_DISTRICT` of type `District` and `MANHATTAN_SUBWAY_LINES` of type `SubwayLine[]`.

### Station Data

```typescript
const stations: Station[] = [
  {
    id: 'manhattan_grand_central',
    name: 'Grand Central',
    position: { x: 500, y: 200 },
    entrances: [{ x: 510, y: 215 }, { x: 490, y: 215 }],
    platforms: [{ id: 'manhattan_grand_central_platform', position: { x: 500, y: 200 }, width: 60, trackSide: 'south' }],
    connections: ['manhattan_times_sq', 'manhattan_union_sq'],
    lineIds: ['line_red', 'line_green'],
  },
  {
    id: 'manhattan_times_sq',
    name: 'Times Square',
    position: { x: 300, y: 300 },
    entrances: [{ x: 310, y: 315 }, { x: 290, y: 315 }],
    platforms: [{ id: 'manhattan_times_sq_platform', position: { x: 300, y: 300 }, width: 60, trackSide: 'south' }],
    connections: ['manhattan_grand_central', 'manhattan_penn'],
    lineIds: ['line_red', 'line_blue'],
  },
  {
    id: 'manhattan_penn',
    name: 'Penn Station',
    position: { x: 200, y: 400 },
    entrances: [{ x: 210, y: 415 }, { x: 190, y: 415 }],
    platforms: [{ id: 'manhattan_penn_platform', position: { x: 200, y: 400 }, width: 60, trackSide: 'east' }],
    connections: ['manhattan_times_sq'],
    lineIds: ['line_blue'],
  },
  {
    id: 'manhattan_union_sq',
    name: 'Union Square',
    position: { x: 500, y: 500 },
    entrances: [{ x: 510, y: 515 }, { x: 490, y: 515 }],
    platforms: [{ id: 'manhattan_union_sq_platform', position: { x: 500, y: 500 }, width: 60, trackSide: 'west' }],
    connections: ['manhattan_grand_central', 'manhattan_city_hall'],
    lineIds: ['line_green', 'line_yellow'],
  },
  {
    id: 'manhattan_city_hall',
    name: 'City Hall',
    position: { x: 350, y: 700 },
    entrances: [{ x: 360, y: 715 }, { x: 340, y: 715 }],
    platforms: [{ id: 'manhattan_city_hall_platform', position: { x: 350, y: 700 }, width: 60, trackSide: 'north' }],
    connections: ['manhattan_union_sq'],
    lineIds: ['line_yellow'],
  },
];
```

### Subway Lines

```typescript
const MANHATTAN_SUBWAY_LINES: SubwayLine[] = [
  { id: 'line_red', color: '#FF4444', stationIds: ['manhattan_grand_central', 'manhattan_times_sq'] },
  { id: 'line_blue', color: '#4444FF', stationIds: ['manhattan_times_sq', 'manhattan_penn'] },
  { id: 'line_green', color: '#44FF44', stationIds: ['manhattan_grand_central', 'manhattan_union_sq'] },
  { id: 'line_yellow', color: '#FFFF44', stationIds: ['manhattan_union_sq', 'manhattan_city_hall'] },
];
```

### Landmarks

```typescript
const landmarks: Landmark[] = [
  { id: 'central_tower', name: 'Central Tower', position: { x: 500, y: 100 }, size: { width: 40, height: 80 }, spriteConfig: { shape: 'rect', primaryColor: '#777777', secondaryColor: '#555555', size: 40 } },
  { id: 'theater_row', name: 'Theater Row', position: { x: 250, y: 280 }, size: { width: 80, height: 30 }, spriteConfig: { shape: 'rect', primaryColor: '#ff5722', secondaryColor: '#e64a19', size: 30 } },
  { id: 'garden_arena', name: 'Garden Arena', position: { x: 150, y: 380 }, size: { width: 60, height: 60 }, spriteConfig: { shape: 'circle', primaryColor: '#9e9e9e', secondaryColor: '#757575', size: 60 } },
  { id: 'square_park', name: 'The Square Park', position: { x: 500, y: 450 }, size: { width: 80, height: 80 }, spriteConfig: { shape: 'rect', primaryColor: '#2d5a27', secondaryColor: '#1b4d2e', size: 80 } },
  { id: 'bridge_approach', name: 'Bridge Approach', position: { x: 400, y: 850 }, size: { width: 100, height: 40 }, spriteConfig: { shape: 'rect', primaryColor: '#616161', secondaryColor: '#424242', size: 40 } },
];
```

### Street Grid

Generate the street grid programmatically:
- 7 horizontal roads at y = 150, 250, 350, 450, 550, 650, 750
- 5 vertical avenues at x = 150, 300, 500, 700, 850
- Each road segment spans the full width (x: 50 to 950) or height (y: 50 to 950)
- Road type: 'road', width: 40
- Add sidewalk segments parallel to each road (type: 'sidewalk', width: 10, offset +/- 25 from road center)

### District Object

```typescript
export const MANHATTAN_DISTRICT: District = {
  id: 'manhattan',
  name: 'Manhattan',
  bounds: { x: 0, y: 0, width: 1000, height: 1000 },
  stations: stations,
  landmarks: landmarks,
  streetGrid: streetGrid, // generated above
  unlockCondition: { type: 'always', value: 0 },
};
```

**Acceptance:** File compiles. `MANHATTAN_DISTRICT.stations.length === 5`. `MANHATTAN_SUBWAY_LINES.length === 4`. Street grid has both road and sidewalk segments.

---

## Prompt 1.2: MapManager

**Create:** `src/managers/MapManager.ts`

**Imports:**
- `District`, `DistrictId`, `Station`, `SubwayLine` from `'@/types/game.types'`
- `MANHATTAN_DISTRICT`, `MANHATTAN_SUBWAY_LINES` from `'@/data/maps/manhattan'`
- `ROAD_WIDTH`, `SIDEWALK_WIDTH` from `'@/config/constants'`

**Export `class MapManager`:**

**Properties:**
- `currentDistrict: District | null` = null
- `stationMap: Map<string, Station>` = new Map()
- `subwayLines: SubwayLine[]` = []

**Methods:**

`loadDistrict(id: DistrictId): District`:
- Switch on id: for 'manhattan', set `this.currentDistrict = MANHATTAN_DISTRICT`, `this.subwayLines = MANHATTAN_SUBWAY_LINES`
- Populate stationMap: for each station in district, `this.stationMap.set(station.id, station)`
- Return the district

`getStation(id: string): Station | null`:
- Return `this.stationMap.get(id) ?? null`

`getConnectedStations(stationId: string): Station[]`:
- Get station by id, get its connections array, map each connection ID to Station via getStation, filter nulls

`getStationAtPosition(x: number, y: number, radius: number): Station | null`:
- Iterate all stations in current district
- For each station, check all entrances: if `Math.hypot(entrance.x - x, entrance.y - y) < radius`, return that station
- Return null if none found

`getLinesBetweenStations(fromId: string, toId: string): SubwayLine[]`:
- Return subway lines where both fromId and toId appear in stationIds

`isWalkable(x: number, y: number): boolean`:
- A position is walkable if it is on a road or sidewalk segment
- For each segment in currentDistrict.streetGrid:
  - If segment is horizontal (start.y === end.y): check if y is within segment.y +/- (segment.width/2) AND x is between start.x and end.x
  - If segment is vertical (start.x === end.x): check if x is within segment.x +/- (segment.width/2) AND y is between start.y and end.y
- Also walkable at station entrance positions (within STATION_ENTRANCE_SIZE radius)
- Also walkable in parks/open areas (landmarks with type 'rect' that are parks)
- Return true if any check passes

`getDistrictBounds(): { x: number; y: number; width: number; height: number } | null`:
- Return `this.currentDistrict?.bounds ?? null`

**Acceptance:** File compiles. After `loadDistrict('manhattan')`, `getStation('manhattan_grand_central')` returns the station. `getConnectedStations('manhattan_times_sq')` returns Grand Central and Penn Station.

---

## Prompt 1.3: TileRenderer

**Create:** `src/graphics/TileRenderer.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `District`, `Station`, `Landmark`, `StreetSegment` from `'@/types/game.types'`
- Color constants from `'@/graphics/colors'` (COLOR_ASPHALT, COLOR_SIDEWALK, building colors, COLOR_GRASS, COLOR_STATION_SIGN, hexToNum)
- `ROAD_WIDTH`, `STATION_ENTRANCE_SIZE` from `'@/config/constants'`

**Export `class TileRenderer`:**

**Static methods:**

`static renderDistrict(scene: Phaser.Scene, district: District): Phaser.GameObjects.Container`:

1. Create a container: `const container = scene.add.container(0, 0)`

2. **Background:** Dark asphalt rectangle covering full district bounds
   - `scene.add.rectangle(bounds.x + bounds.width/2, bounds.y + bounds.height/2, bounds.width, bounds.height, hexToNum(COLOR_ASPHALT))`
   - Add to container

3. **Streets:** For each StreetSegment in district.streetGrid:
   - Calculate rectangle position and dimensions from start/end/width
   - Horizontal segment: `scene.add.rectangle(midX, start.y, length, width, color)`
   - Vertical segment: `scene.add.rectangle(start.x, midY, width, length, color)`
   - Roads: use `hexToNum(COLOR_ASPHALT)` with slightly lighter shade (`0x3c3c3c`)
   - Sidewalks: use `hexToNum(COLOR_SIDEWALK)`
   - Add each to container

4. **Buildings:** Fill city blocks between roads with colored rectangles
   - For each block bounded by adjacent roads: create a rectangle with a random building color (cycle through COLOR_BUILDING_1 through 4 based on position)
   - Inset from roads by SIDEWALK_WIDTH
   - Skip areas occupied by landmarks, stations, or parks
   - Add each to container

5. **Landmarks:** For each landmark in district.landmarks:
   - If shape is 'circle': `scene.add.circle(pos.x, pos.y, size.width/2, hexToNum(primaryColor))`
   - If shape is 'rect': `scene.add.rectangle(pos.x, pos.y, size.width, size.height, hexToNum(primaryColor))`
   - Add name text below: small white text
   - Add to container

6. **Station entrances:** For each station, for each entrance:
   - `scene.add.rectangle(entrance.x, entrance.y, STATION_ENTRANCE_SIZE, STATION_ENTRANCE_SIZE, hexToNum(COLOR_UI_SECONDARY))` with orange border
   - Add small "S" text or station name abbreviation
   - Add to container

7. **Trees:** In park areas (square_park landmark), scatter 6-8 tree circles
   - Small green circles at semi-random positions within the park bounds

8. Return the container

`static renderStationMarkers(scene: Phaser.Scene, stations: Station[]): Phaser.GameObjects.Container`:
- Create container
- For each station, add a pulsing circle at the station position:
  - `const marker = scene.add.circle(pos.x, pos.y, 8, hexToNum(COLOR_UI_PRIMARY), 0.5)`
  - Add a tween: `scene.tweens.add({ targets: marker, alpha: { from: 0.3, to: 0.8 }, duration: 1000, yoyo: true, repeat: -1 })`
- Return container

**Acceptance:** File compiles. When called in a Phaser scene, returns a Container with visible streets, buildings, landmarks, and station entrances.

---

## Prompt 1.4: StationRenderer

**Create:** `src/graphics/StationRenderer.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `Station` from `'@/types/game.types'`
- Station color constants from `'@/graphics/colors'` (COLOR_STATION_WALL, FLOOR, PLATFORM, TRACK, TRACK_RAIL, TURNSTILE, STATION_SIGN, hexToNum)

**Export `class StationRenderer`:**

**Static methods:**

`static renderStation(scene: Phaser.Scene, station: Station): Phaser.GameObjects.Container`:

Creates a station interior layout. The station scene uses its own coordinate space (not world coordinates). Layout is ~300x200px centered in the scene.

1. Create container
2. **Floor:** Large dark rectangle (300x200) as the station floor, centered in scene
3. **Walls:** Darker rectangles along top and bottom edges (300x10 each)
4. **Platform:** Lighter rectangle in the center (station.platforms[0].width x 20), centered vertically
5. **Tracks:** Two dark lines with silver rail lines on one side of the platform (based on trackSide)
6. **Turnstiles:** 3 small gray rectangles (10x6 each) near the "entrance" area (bottom of station)
7. **Station sign:** Colored rectangle (uses first line color from station.lineIds) at top with station name text in white
8. **Exit signs:** Small green rectangles with "EXIT" text near the bottom (entrance area)
9. **Platform edge:** Yellow warning line (2px strip) along the platform edge facing tracks
10. Return container

`static renderTrainArrival(scene: Phaser.Scene, lineColor: string): Phaser.GameObjects.Rectangle`:
1. Create a train rectangle: 120x16, positioned off-screen to the left
2. Color: `hexToNum(lineColor)`
3. Animate sliding in from left: `scene.tweens.add({ targets: train, x: scene.cameras.main.width / 2, duration: 1500, ease: 'Power2' })`
4. After arrival, show "doors": create a small gap in the train (overlay two small bg-colored rectangles on the train)
5. Return the train object

`static renderTrainDeparture(scene: Phaser.Scene, train: Phaser.GameObjects.Rectangle): void`:
1. "Close doors" (remove door gap overlays)
2. Animate sliding out to the right: `scene.tweens.add({ targets: train, x: scene.cameras.main.width + 100, duration: 1500, ease: 'Power2', onComplete: () => train.destroy() })`

**Acceptance:** File compiles. Station interior renders with floor, walls, platform, tracks, turnstiles, sign, and exits visible.

---

## Prompt 1.5: Player Entity

**Create:** `src/entities/Player.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `CharacterClass`, `ItemEffect` from `'@/types/game.types'`
- `PLAYER_SIZE`, `PLAYER_SPEED`, `PLAYER_SPRINT_MULTIPLIER`, `PLAYER_STAMINA_MAX`, `PLAYER_STAMINA_DRAIN`, `PLAYER_STAMINA_REGEN` from `'@/config/constants'`

**Export `class Player extends Phaser.GameObjects.Container`:**

**Properties:**
- `characterClass: CharacterClass`
- `speed: number` = PLAYER_SPEED
- `stamina: number` = PLAYER_STAMINA_MAX
- `maxStamina: number` = PLAYER_STAMINA_MAX
- `isInStation: boolean` = false
- `currentStationId: string | null` = null
- `isInteracting: boolean` = false
- `private playerSprite: Phaser.GameObjects.Sprite`

**Constructor(scene: Phaser.Scene, x: number, y: number, characterClass: CharacterClass):**
1. Call `super(scene, x, y)`
2. Store characterClass
3. Create sprite: `this.playerSprite = scene.add.sprite(0, 0, 'player_' + characterClass)`
4. Add sprite to this container: `this.add(this.playerSprite)`
5. Add this container to the scene: `scene.add.existing(this)`
6. Enable physics on the container: `scene.physics.add.existing(this)`
7. Get the physics body: `const body = this.body as Phaser.Physics.Arcade.Body`
8. Set body size: `body.setSize(PLAYER_SIZE, PLAYER_SIZE)`
9. Set `body.setCollideWorldBounds(true)`

**Methods:**

`update(direction: { x: number; y: number }, isSprinting: boolean, delta: number): void`:
- If `this.isInteracting`, set velocity to 0 and return
- Calculate delta in seconds: `const dt = delta / 1000`
- Determine effective speed:
  - If isSprinting and stamina > 0: `effectiveSpeed = this.speed * PLAYER_SPRINT_MULTIPLIER`, drain stamina by `PLAYER_STAMINA_DRAIN * dt`
  - Else: `effectiveSpeed = this.speed`, regen stamina by `PLAYER_STAMINA_REGEN * dt`
- Clamp stamina between 0 and maxStamina
- Set velocity: `body.setVelocity(direction.x * effectiveSpeed, direction.y * effectiveSpeed)`
- Flip sprite if moving left: `this.playerSprite.setFlipX(direction.x < 0)`

`enterStation(stationId: string): void`:
- `this.isInStation = true`
- `this.currentStationId = stationId`

`exitStation(): void`:
- `this.isInStation = false`
- `this.currentStationId = null`

`getPosition(): { x: number; y: number }`:
- Return `{ x: this.x, y: this.y }`

`applyItemEffects(effects: ItemEffect[]): void`:
- Reset speed and maxStamina to defaults
- For each effect: if stat is 'speed', multiply speed by modifier. If 'stamina', multiply maxStamina by modifier.

`getStamina(): number`: return stamina
`getMaxStamina(): number`: return maxStamina

**Acceptance:** File compiles. Player can be created in a Phaser scene with physics. Calling update with direction moves the player.

---

## Prompt 1.6: GameScene

**Create:** `src/scenes/GameScene.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `Player` from `'@/entities/Player'`
- `MapManager` from `'@/managers/MapManager'`
- `InputManager` from `'@/managers/InputManager'`
- `TileRenderer` from `'@/graphics/TileRenderer'`
- `CAMERA_LERP`, `CAMERA_ZOOM_DEFAULT`, `WORLD_WIDTH`, `WORLD_HEIGHT`, `STATION_ENTRANCE_SIZE` from `'@/config/constants'`
- `GameEvents` from `'@/types/events.types'`
- `Station` from `'@/types/game.types'`

**Export `class GameScene extends Phaser.Scene`:**

**Properties:**
- `private player: Player | null` = null
- `private mapManager: MapManager | null` = null
- `private inputManager: InputManager | null` = null
- `private buildingBodies: Phaser.Physics.Arcade.StaticGroup | null` = null
- `private entranceZones: Phaser.Physics.Arcade.StaticGroup | null` = null
- `private dayNightOverlay: Phaser.GameObjects.Rectangle | null` = null

**Constructor:** `super({ key: 'GameScene' })`

**create():**
1. Get managers from registry: `mapManager`, `inputManager`
2. Load Manhattan: `const district = mapManager.loadDistrict('manhattan')`
3. Render the district: `const worldContainer = TileRenderer.renderDistrict(this, district)`
4. Render station markers: `TileRenderer.renderStationMarkers(this, district.stations)`
5. Create player at Grand Central entrance: `this.player = new Player(this, 510, 230, 'police')`
6. Set up physics world bounds: `this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)`
7. Set up camera:
   - `this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)`
   - `this.cameras.main.startFollow(this.player, true, CAMERA_LERP, CAMERA_LERP)`
   - `this.cameras.main.setZoom(CAMERA_ZOOM_DEFAULT)`
8. Set up building collision bodies:
   - Create a StaticGroup
   - For each building rectangle on the map, add an invisible static body
   - `this.physics.add.collider(this.player, this.buildingBodies)`
9. Set up station entrance zones:
   - Create a StaticGroup
   - For each station entrance position, create an invisible zone
   - Store the station ID on each zone object: `zone.setData('stationId', station.id)`
   - `this.physics.add.overlap(this.player, this.entranceZones, this.handleEntranceOverlap, undefined, this)`
10. Set up InputManager: `inputManager.setup(this)`
11. Launch HUD: `this.scene.launch('HUDScene')`
12. Create day/night overlay rectangle (full world size, starts transparent)

**update(time: number, delta: number):**
1. If no player or inputManager, return
2. `this.inputManager.update()`
3. Get direction and sprint: `const dir = this.inputManager.getDirection()`, `const sprint = this.inputManager.isSprintHeld()`
4. `this.player.update(dir, sprint, delta)`
5. Check action press for station entry (handled by overlap callback)
6. Update day/night cycle (simple time-based alpha on overlay)

**handleEntranceOverlap(player: any, zone: any):**
- If `this.inputManager.isActionPressed()`:
  - Get stationId from zone data
  - Transition to station: fade out, sleep this scene, launch StationScene

**transitionToStation(stationId: string):**
1. `this.cameras.main.fadeOut(300)`
2. On fade complete:
   - `this.scene.sleep('GameScene')`
   - `this.scene.launch('StationScene', { stationId })`

**returnFromStation(stationId: string):**
1. Get station from MapManager
2. Set player position to station entrance
3. `this.scene.wake('GameScene')`
4. `this.cameras.main.fadeIn(300)`

Listen for a custom event from StationScene: `this.game.events.on('exitStation', (stationId: string) => this.returnFromStation(stationId))`

**Acceptance:** Player spawns on the map, walks around with joystick/WASD, collides with buildings, and pressing action near a station entrance transitions to StationScene.

---

## Prompt 1.7: StationScene

**Create:** `src/scenes/StationScene.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `Player` from `'@/entities/Player'`
- `InputManager` from `'@/managers/InputManager'`
- `MapManager` from `'@/managers/MapManager'`
- `StationRenderer` from `'@/graphics/StationRenderer'`
- `Station` from `'@/types/game.types'`

**Export `class StationScene extends Phaser.Scene`:**

**Properties:**
- `private player: Player | null` = null
- `private inputManager: InputManager | null` = null
- `private currentStation: Station | null` = null
- `private destinationMenu: Phaser.GameObjects.Container | null` = null
- `private exitZone: Phaser.GameObjects.Zone | null` = null
- `private platformZone: Phaser.GameObjects.Zone | null` = null

**Constructor:** `super({ key: 'StationScene' })`

**create(data: { stationId: string }):**
1. Get managers from registry
2. Look up station: `this.currentStation = mapManager.getStation(data.stationId)`
3. Render station: `const stationContainer = StationRenderer.renderStation(this, this.currentStation)`
4. Create player at entrance area (bottom center of station layout): `this.player = new Player(this, width/2, height * 0.85, 'police')`
5. Set up InputManager: `inputManager.setup(this)`
6. Create exit zone near entrance (bottom): invisible overlap zone
7. Create platform zone near platform center: invisible overlap zone
8. Set up overlaps for exit and platform zones
9. Camera: no follow needed (station fits in view), center on station

**update(time: number, delta: number):**
1. inputManager.update()
2. player.update with direction and sprint
3. If action pressed on exit zone → exit station
4. If action pressed on platform zone → show destination menu

**showDestinationMenu():**
1. Get connected stations from MapManager
2. Create a container with semi-transparent background
3. Title text: "SELECT DESTINATION"
4. For each connected station: create a text button with station name
5. On click: trigger travel to that station
6. "CANCEL" button at bottom

**travelToStation(destinationId: string):**
1. Hide destination menu
2. Get line color between current and destination
3. Render train arrival: `StationRenderer.renderTrainArrival(this, lineColor)`
4. Wait for arrival animation (1.5s)
5. Fade to black (500ms)
6. Wait (500ms, simulating travel)
7. Re-create this scene with new stationId: `this.scene.restart({ stationId: destinationId })`
8. Fade in

**exitStation():**
1. Fade out (300ms)
2. On complete: `this.scene.stop('StationScene')`
3. Emit exit event: `this.game.events.emit('exitStation', this.currentStation.id)`

**Acceptance:** Station interior renders correctly. Player can walk around inside. Pressing action on platform shows destination menu. Selecting a station plays train animation and transitions. Pressing action at exit returns to overworld.

---

## Prompt 1.8: MiniMap

**Create:** `src/ui/MiniMap.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `MINIMAP_SIZE`, `WORLD_WIDTH`, `WORLD_HEIGHT`, `HUD_PADDING` from `'@/config/constants'`
- `COLOR_UI_SURFACE`, `COLOR_UI_PRIMARY`, `hexToNum` from `'@/graphics/colors'`
- `District` from `'@/types/game.types'`

**Export `class MiniMap`:**

**Properties:**
- `private container: Phaser.GameObjects.Container`
- `private playerDot: Phaser.GameObjects.Rectangle`
- `private background: Phaser.GameObjects.Rectangle`

**Constructor(scene: Phaser.Scene, district: District):**
1. Calculate position: top-right corner with padding
   - `const x = scene.cameras.main.width - MINIMAP_SIZE - HUD_PADDING`
   - `const y = HUD_PADDING`
2. Create container at (x, y), scrollFactor 0, depth 999
3. Create background: dark rectangle MINIMAP_SIZE x MINIMAP_SIZE, alpha 0.7
4. Draw roads as thin lines (1px) on the minimap:
   - Scale world coords to minimap: `minimapX = (worldX / WORLD_WIDTH) * MINIMAP_SIZE`
   - Draw each street segment as a thin gray line
5. Draw station dots: for each station, small colored dot at scaled position
6. Create player dot: 4x4 white rectangle at (0, 0) (updated each frame)
7. Add blinking tween on player dot: alpha 0.5 to 1, repeat -1
8. Add all elements to container

**Methods:**

`update(playerX: number, playerY: number): void`:
- Calculate minimap position: `const mx = (playerX / WORLD_WIDTH) * MINIMAP_SIZE`
- `const my = (playerY / WORLD_HEIGHT) * MINIMAP_SIZE`
- `this.playerDot.setPosition(mx, my)`

`show(): void`: container.setVisible(true)
`hide(): void`: container.setVisible(false)
`getContainer(): Phaser.GameObjects.Container`: return container

**Acceptance:** Minimap renders in top-right corner. Player dot moves as player walks. Station dots visible.

---

## Prompt 1.9: DayNightSystem

**Create:** `src/systems/DayNightSystem.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `DAY_NIGHT_CYCLE_DURATION` from `'@/config/constants'`

**Export `class DayNightSystem`:**

**Properties:**
- `private timeOfDay: number` = 0.3 (start at morning)
- `private cycleDuration: number` = DAY_NIGHT_CYCLE_DURATION
- `private overlay: Phaser.GameObjects.Rectangle`
- `private scene: Phaser.Scene`

**Constructor(scene: Phaser.Scene):**
1. Store scene reference
2. Create full-screen overlay rectangle:
   - `this.overlay = scene.add.rectangle(0, 0, scene.cameras.main.width * 3, scene.cameras.main.height * 3, 0x112244, 0)`
   - Set depth high (above world, below HUD): depth 900
   - Note: NOT scrollFactor 0 — it covers the world, so it moves with camera naturally if large enough

**Methods:**

`update(delta: number): void`:
- `const dt = delta / 1000`
- `this.timeOfDay = (this.timeOfDay + dt / this.cycleDuration) % 1.0`
- Calculate overlay alpha based on time:
  - 0.0–0.20 (night): alpha = 0.4
  - 0.20–0.30 (sunrise): alpha lerps from 0.4 to 0.0
  - 0.30–0.70 (day): alpha = 0.0
  - 0.70–0.80 (sunset): alpha lerps from 0.0 to 0.4
  - 0.80–1.0 (night): alpha = 0.4
- `this.overlay.setAlpha(alpha)`

`getTimeOfDay(): number`: return timeOfDay
`isNight(): boolean`: return timeOfDay < 0.25 || timeOfDay > 0.75

`setTime(time: number): void`:
- `this.timeOfDay = time % 1.0`
- Immediately recalculate overlay alpha

**Acceptance:** Day/night tint cycles over 10 minutes. Screen darkens at night, lightens at dawn.

---

## Prompt 1.10: Phase 1 Integration

**Modify the following existing files:**

### src/scenes/BootScene.ts
- Import `MapManager` from `'@/managers/MapManager'`
- In `create()`, after existing manager initialization:
  - `const mapManager = new MapManager()`
  - `this.game.registry.set('mapManager', mapManager)`
- Change the end of `create()`: instead of showing the placeholder title screen, transition to GameScene:
  - `this.scene.start('GameScene')`
  - Remove the placeholder title text, subtitle, direction text, and input setup from BootScene (those were Phase 0 debug only)

### src/scenes/HUDScene.ts
- Import `MiniMap` from `'@/ui/MiniMap'`
- Import `MapManager` from `'@/managers/MapManager'`
- In `create()`:
  - Get MapManager from registry
  - Load Manhattan district if not loaded
  - Create MiniMap instance: `this.minimap = new MiniMap(this, district)`
  - Add minimap container to scene
- Add `update()` method:
  - Get player position from GameScene (via registry or event)
  - Call `this.minimap.update(playerX, playerY)`
- Store player position in game registry from GameScene.update(): `this.game.registry.set('playerPos', this.player.getPosition())`
- In HUDScene.update(): read from registry

### src/config/game-config.ts
- Import `GameScene` from `'@/scenes/GameScene'`
- Import `StationScene` from `'@/scenes/StationScene'`
- (Note: actual scene array is set in main.ts, not in createGameConfig)

### src/main.ts
- Import `GameScene` and `StationScene`
- Add them to `config.scene` array: `[BootScene, GameScene, StationScene, HUDScene]`

### src/graphics/SpriteFactory.ts
- Add any missing textures discovered during integration (train, exit sign, turnstile if needed)

**Acceptance:**
1. Game boots → BootScene → GameScene loads with Manhattan map
2. Player walks around with collision
3. Station entrances visible and interactive
4. Station interior renders on entry
5. Subway travel works between connected stations
6. Minimap shows player position
7. Day/night cycle visible
8. Exit station returns to overworld
9. 60fps on desktop, no console errors

---

## Phase 1 Summary

| Prompt | Files | Description |
|--------|-------|-------------|
| 1.1 | 1 data file | Manhattan district data (stations, lines, streets, landmarks) |
| 1.2 | 1 manager | MapManager — district/station loading and queries |
| 1.3 | 1 renderer | TileRenderer — overworld map drawing |
| 1.4 | 1 renderer | StationRenderer — station interior + train animations |
| 1.5 | 1 entity | Player — character with movement, stamina, physics |
| 1.6 | 1 scene | GameScene — main overworld gameplay |
| 1.7 | 1 scene | StationScene — station interior with travel |
| 1.8 | 1 UI component | MiniMap — corner minimap |
| 1.9 | 1 system | DayNightSystem — tint cycle |
| 1.10 | Modifications | Integration of all Phase 1 into existing Phase 0 files |
