# Phase 2: NPCs & Game World Population

## Current State (After Phase 1)
The game world exists and is navigable:
- Player walks around Manhattan overworld with collision against buildings
- 5 subway stations with interiors: Grand Central, Times Square, Penn Station, Union Square, City Hall
- Station entry/exit transitions with fades
- Subway travel between connected stations with train arrival/departure animations
- Minimap showing player position and stations
- Day/night tint cycle (10-minute real-time cycle)
- InputManager providing joystick + keyboard + action button
- SaveManager, AudioManager (shell), MapManager all running
- Full type system, constants, colors, balance values in place

### Existing Files
All Phase 0 files plus:
- `src/data/maps/manhattan.ts`
- `src/managers/MapManager.ts`
- `src/graphics/TileRenderer.ts`, `src/graphics/StationRenderer.ts`
- `src/entities/Player.ts`
- `src/scenes/GameScene.ts`, `src/scenes/StationScene.ts`
- `src/ui/MiniMap.ts`
- `src/systems/DayNightSystem.ts`

## Goal
Populate the world with ambient NPCs that make it feel alive. Civilians walk streets, wait on platforms, and enter/exit stations. The player can interact with NPCs to see dialogue. This phase establishes the NPC infrastructure that Phase 3's mission-specific NPCs (fare evaders, suspects) will build on.

## Tech Stack
Same as Phase 0.

## Coding Standards
Same as Phase 0.

## Deliverables

### 1. Entity Base Class

**`src/entities/Entity.ts`**

Base class for all game entities (Player already exists but will be refactored to extend this).

**Properties:**
- `scene: Phaser.Scene`
- `sprite: Phaser.GameObjects.Sprite` — the visual representation
- `body: Phaser.Physics.Arcade.Body` — physics body
- `worldX: number`, `worldY: number` — world position
- `isActive: boolean` — whether this entity is currently in play
- `entityId: string` — unique identifier

**Constructor(scene, x, y, textureKey, entityId):**
- Creates sprite at position with given texture
- Enables Arcade physics
- Sets active and visible

**Methods:**
- `update(delta: number): void` — virtual method, overridden by subclasses
- `setPosition(x: number, y: number): void` — moves entity
- `getPosition(): { x: number; y: number }` — returns position
- `distanceTo(other: Entity): number` — calculates distance to another entity
- `activate(): void` — sets active=true, visible=true, enables body
- `deactivate(): void` — sets active=false, visible=false, disables body
- `destroy(): void` — removes from scene, cleans up

### 2. NPC Class

**`src/entities/NPC.ts`**

Extends Entity. Represents any non-player character.

**Properties:**
- `npcType: NPCType` — civilian, fare_evader, etc.
- `behaviorPattern: BehaviorPattern` — wander, patrol, stationary, flee, etc.
- `speed: number` — movement speed
- `interactable: boolean` — whether player can talk to this NPC
- `dialogueLines: string[]` — random dialogue options
- `currentWaypoint: { x: number; y: number } | null` — target position for movement
- `waypointReachedRadius: number` — how close counts as "reached" (default 5px)
- `behaviorTimer: number` — countdown for behavior changes

**Constructor(scene, x, y, definition: NPCDefinition):**
- Calls super with appropriate texture key based on npcType
- Sets properties from definition
- Initializes behavior state

**Methods:**
- `update(delta: number): void` — runs behavior pattern:
  - **wander:** Pick a random walkable point within 100px, walk to it, pause 1–3 seconds, repeat
  - **patrol:** Follow a predefined list of waypoints in order, loop
  - **stationary:** Stay in place, face random directions occasionally
  - **flee:** (Used by fare evaders in Phase 3) Run away from player at NPC_SPEED_FLEE
  - **follow_path:** Walk along a street or subway corridor in one direction
  - **crowd:** Dense group — pick nearby points, move slowly, stay close to spawn

- `moveTo(targetX: number, targetY: number, delta: number): boolean` — moves toward target at speed, returns true when reached
- `pickRandomWalkableTarget(radius: number): { x: number; y: number }` — finds a random walkable position near current position using MapManager.isWalkable()
- `getDialogue(): string` — returns a random line from dialogueLines
- `setFleeing(targetX: number, targetY: number): void` — switches behavior to flee, running away from given position
- `stopFleeing(): void` — returns to original behavior pattern

### 3. Civilian NPC

**`src/entities/Civilian.ts`**

Extends NPC. Ambient population that makes the world feel lived-in.

**No additional properties** — just a convenience constructor that creates an NPC with civilian-appropriate defaults.

**Constructor(scene, x, y, variant: number):**
- Picks a civilian texture based on variant (1–4)
- Sets behaviorPattern to 'wander' or 'follow_path' (random)
- Sets speed to NPC_SPEED_NORMAL
- Sets interactable = true
- Sets dialogueLines from a pool of NYC commuter lines:
  - "Running late again..."
  - "Is the downtown train running?"
  - "Excuse me, coming through!"
  - "This station always smells weird."
  - "Signal problems, what else is new."
  - "You know when the next bus is?"
  - "I've been waiting twenty minutes."
  - "Watch the closing doors!"
  - "Is this the right platform?"
  - "Only in New York..."
  - "Don't make eye contact..."
  - "My MetroCard keeps failing."
  - "At least it's not raining down here."
  - "Three trains just passed, all full."
  - "I shoulda taken the bus."

### 4. NPCManager

**`src/managers/NPCManager.ts`**

Handles spawning, pooling, and lifecycle of all NPCs.

**Properties:**
- `activeNPCs: NPC[]` — currently active NPCs in the scene
- `npcPool: NPC[]` — deactivated NPCs available for reuse
- `maxActive: number` — MAX_NPCS_VISIBLE (20)
- `spawnTimer: number` — countdown to next spawn check
- `currentScene: Phaser.Scene` — reference to active scene

**Methods:**
- `init(scene: Phaser.Scene): void` — sets scene reference, pre-creates NPC pool
- `update(playerX: number, playerY: number, delta: number): void` — called every frame:
  1. Despawn NPCs too far from player (distance > NPC_DESPAWN_RADIUS)
  2. If activeNPCs.length < maxActive, spawn new NPCs near player (distance between NPC_SPAWN_RADIUS * 0.5 and NPC_SPAWN_RADIUS)
  3. Update all active NPCs (call each NPC.update(delta))
  
- `spawnCivilian(x: number, y: number): NPC` — gets NPC from pool (or creates new one), initializes as Civilian, activates
- `spawnNPCAtStation(station: Station): NPC` — spawns a civilian on a platform or near an entrance
- `despawn(npc: NPC): void` — deactivates NPC, returns to pool
- `despawnAll(): void` — clears all active NPCs (used on scene transitions)
- `getNearbyNPCs(x: number, y: number, radius: number): NPC[]` — returns NPCs within radius
- `getInteractableNPC(playerX: number, playerY: number): NPC | null` — returns the closest interactable NPC within PLAYER_INTERACT_RADIUS

**Pooling:** NPCs are created once and reused. When despawned, they're deactivated (invisible, no physics) and placed in the pool. When spawning, pull from pool first, only create new if pool is empty. Pool cap: 30 total NPC objects.

**Spawn logic:**
- On overworld: spawn civilians on sidewalks near the player
- In stations: spawn civilians on platforms and near turnstiles
- Ensure NPCs spawn outside the camera viewport (so they don't pop in visually)
- Never spawn on roads or inside buildings (use MapManager.isWalkable)

Instantiated in BootScene, stored in registry as `'npcManager'`.

### 5. DialogueSystem

**`src/systems/DialogueSystem.ts`**

Displays NPC dialogue text on screen when the player interacts.

**Properties:**
- `textBox: Phaser.GameObjects.Container` — the dialogue UI element
- `nameText: Phaser.GameObjects.Text` — NPC type label
- `dialogueText: Phaser.GameObjects.Text` — the dialogue line
- `isShowing: boolean` — whether dialogue is currently visible
- `displayTimer: number` — auto-hide countdown

**Constructor(scene: Phaser.Scene):**
- Creates a semi-transparent dark rectangle at bottom of screen (fixed to camera)
- Creates text objects inside it
- Starts hidden

**Methods:**
- `show(npcType: NPCType, line: string): void` — displays dialogue:
  - Sets nameText to a friendly label based on type ("Commuter", "Tourist", etc.)
  - Sets dialogueText to the dialogue line
  - Fades in the text box
  - Starts a 3-second timer to auto-hide
  
- `hide(): void` — fades out and hides
- `update(delta: number): void` — counts down display timer, hides when expired
- `isVisible(): boolean` — returns isShowing

### 6. NPC Data Definitions

**`src/data/npcs.ts`** — Exports NPCDefinition arrays:

**Civilian variants (4):**

```typescript
const CIVILIAN_DEFINITIONS: NPCDefinition[] = [
  {
    id: 'civilian_1',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#795548', secondaryColor: '#5d4037', size: 10 },
    speed: 60,
    behaviorPattern: 'wander',
    interactable: true,
    dialogueLines: ['Running late again...', 'Is the downtown train running?', 'Only in New York...']
  },
  {
    id: 'civilian_2',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#607d8b', secondaryColor: '#455a64', size: 10 },
    speed: 50,
    behaviorPattern: 'follow_path',
    interactable: true,
    dialogueLines: ['Excuse me, coming through!', 'Watch the closing doors!', 'Three trains just passed, all full.']
  },
  {
    id: 'civilian_3',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#ff7043', secondaryColor: '#e64a19', size: 10 },
    speed: 70,
    behaviorPattern: 'wander',
    interactable: true,
    dialogueLines: ['This station always smells weird.', 'I shoulda taken the bus.', 'My MetroCard keeps failing.']
  },
  {
    id: 'civilian_4',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#ab47bc', secondaryColor: '#8e24aa', size: 10 },
    speed: 55,
    behaviorPattern: 'crowd',
    interactable: true,
    dialogueLines: ['Signal problems, what else is new.', 'At least it is not raining down here.', 'Do not make eye contact...']
  }
];
```

**Mission NPC templates (for Phase 3, defined here for data consistency):**

```typescript
const FARE_EVADER_DEFINITION: NPCDefinition = {
  id: 'fare_evader_base',
  type: 'fare_evader',
  spriteConfig: { shape: 'rect', primaryColor: '#c62828', secondaryColor: '#b71c1c', size: 10 },
  speed: 140,
  behaviorPattern: 'flee',
  interactable: false,
  dialogueLines: []
};

const SUSPICIOUS_PERSON_DEFINITION: NPCDefinition = {
  id: 'suspicious_base',
  type: 'suspicious_person',
  spriteConfig: { shape: 'rect', primaryColor: '#37474f', secondaryColor: '#263238', size: 10 },
  speed: 40,
  behaviorPattern: 'stationary',
  interactable: true,
  dialogueLines: ['What are you looking at?', 'I am just waiting for someone.', 'Move along, officer.']
};
```

### 7. Integration with Existing Scenes

**GameScene modifications:**
- In `create()`: get NPCManager from registry, call `npcManager.init(this)`
- In `update()`: call `npcManager.update(player.x, player.y, delta)` after player update
- Add physics collider between Player and active NPC group
- On action button press: check `npcManager.getInteractableNPC(player.x, player.y)` — if found, call DialogueSystem.show()
- Create DialogueSystem instance in create()
- Call `dialogueSystem.update(delta)` in update()

**StationScene modifications:**
- In `create()`: spawn 3–5 civilians inside the station (on platforms, near turnstiles)
- In station update: update those NPCs
- On scene sleep/stop: despawn station NPCs

**Player.ts modifications:**
- Refactor to extend Entity base class
- Keep all existing functionality
- Add `isInteracting: boolean` property (prevents movement during dialogue)

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `src/entities/Entity.ts` | Base entity class |
| `src/entities/NPC.ts` | NPC class with behavior patterns |
| `src/entities/Civilian.ts` | Civilian NPC convenience constructor |
| `src/managers/NPCManager.ts` | NPC spawning, pooling, lifecycle |
| `src/systems/DialogueSystem.ts` | NPC dialogue display |
| `src/data/npcs.ts` | NPC definition data |

## Files Modified in This Phase

| File | Change |
|------|--------|
| `src/entities/Player.ts` | Refactor to extend Entity; add isInteracting property |
| `src/scenes/GameScene.ts` | Integrate NPCManager, DialogueSystem, NPC physics, interaction |
| `src/scenes/StationScene.ts` | Spawn station NPCs, update them, despawn on exit |
| `src/scenes/BootScene.ts` | Add NPCManager instantiation to registry |

## Acceptance Criteria

1. 15+ civilian NPCs visible on the overworld at any time, walking on sidewalks
2. NPCs wander, follow paths, and crowd near stations — movement looks natural
3. NPCs collide with player (slight push) and buildings (don't walk through)
4. Walking to an NPC and pressing action shows a dialogue box with a NYC-themed line
5. Dialogue auto-hides after 3 seconds
6. NPCs despawn when far from player (camera + buffer), new ones spawn as player moves
7. NPCs appear inside stations (3–5 per station, on platforms and near exits)
8. No NPC pops into view inside the camera — they always spawn off-screen
9. 60fps maintained with 20 active NPCs
10. NPC pool reuses objects (verify: total created objects never exceeds ~30 even after walking across entire map)
11. No TypeScript errors, no console errors
