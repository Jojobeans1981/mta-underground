# Phase 2 — Implementation Prompts

## Prompt 2.1: Entity Base Class

**Create:** `src/entities/Entity.ts`

**Imports:**
- `Phaser` from `'phaser'`

**Export `abstract class Entity extends Phaser.GameObjects.Container`:**

**Properties:**
- `entityId: string`
- `isActive: boolean` = true
- `protected entitySprite: Phaser.GameObjects.Sprite | null` = null

**Constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string, entityId: string):**
1. `super(scene, x, y)`
2. Store entityId
3. Create sprite: `this.entitySprite = scene.add.sprite(0, 0, textureKey)`
4. Add sprite to container: `this.add(this.entitySprite)`
5. Add to scene: `scene.add.existing(this)`
6. Enable physics: `scene.physics.add.existing(this)`

**Methods:**

`abstract update(delta: number): void`

`setEntityPosition(x: number, y: number): void`:
- `this.setPosition(x, y)`

`getEntityPosition(): { x: number; y: number }`:
- Return `{ x: this.x, y: this.y }`

`distanceTo(other: Entity): number`:
- Return `Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y)`

`activate(): void`:
- `this.isActive = true`
- `this.setActive(true).setVisible(true)`
- Enable physics body: `(this.body as Phaser.Physics.Arcade.Body).enable = true`

`deactivate(): void`:
- `this.isActive = false`
- `this.setActive(false).setVisible(false)`
- `(this.body as Phaser.Physics.Arcade.Body).enable = false`

**Acceptance:** File compiles. Cannot be instantiated directly (abstract).

---

## Prompt 2.2: NPC Class

**Create:** `src/entities/NPC.ts`

**Imports:**
- `Entity` from `'@/entities/Entity'`
- `NPCType`, `BehaviorPattern`, `NPCDefinition` from `'@/types/game.types'`
- `NPC_SPEED_NORMAL` from `'@/config/constants'`
- `Phaser` from `'phaser'`

**Export `class NPC extends Entity`:**

**Properties:**
- `npcType: NPCType`
- `behaviorPattern: BehaviorPattern`
- `speed: number`
- `interactable: boolean`
- `dialogueLines: string[]`
- `private currentTarget: { x: number; y: number } | null` = null
- `private behaviorTimer: number` = 0
- `private pauseTimer: number` = 0
- `private isPaused: boolean` = false

**Constructor(scene: Phaser.Scene, x: number, y: number, definition: NPCDefinition):**
1. Determine texture key from definition.type: `'npc_' + definition.type` (e.g., `'npc_civilian_1'` for civilians — but the definition id helps distinguish variants)
2. For civilians: use `'npc_civilian_' + (variant number)`. Map definition.id to texture: if id contains 'civilian_1' use 'npc_civilian_1', etc.
3. For fare_evader: use 'npc_fare_evader'
4. For suspicious_person: use 'npc_suspicious'
5. Call `super(scene, x, y, textureKey, definition.id)`
6. Set body size: `(this.body as Phaser.Physics.Arcade.Body).setSize(10, 10)`
7. Copy properties from definition

**Methods:**

`update(delta: number): void`:
- If not active, return
- `const dt = delta / 1000`
- If isPaused: decrement pauseTimer, if <= 0 set isPaused = false and pick new target, return
- Switch on behaviorPattern:
  - **'wander':** If no currentTarget, pick random walkable point within 80px. Move toward it. When reached (within 5px), set isPaused = true with random 1–3 second timer.
  - **'follow_path':** Move in a straight line along current direction. When reaching world bounds or building, turn 90 degrees. Slower pause between direction changes.
  - **'stationary':** Don't move. Occasionally (every 3–5 seconds) face a random direction (flip sprite).
  - **'crowd':** Similar to wander but with smaller radius (30px) and shorter pauses (0.5–1s). Creates denser movement.
  - **'flee':** Handled externally by PursuitSystem (Phase 3). If behavior is flee, just run away from a stored flee target.
  - **'patrol':** Similar to follow_path but with predefined waypoints (used in Phase 3).

`moveTo(targetX: number, targetY: number, dt: number): boolean`:
- Calculate direction: `dx = targetX - this.x`, `dy = targetY - this.y`
- Distance: `const dist = Math.hypot(dx, dy)`
- If dist < 5: return true (reached)
- Normalize: `dx /= dist`, `dy /= dist`
- Set velocity: `body.setVelocity(dx * this.speed, dy * this.speed)`
- Flip sprite: `if (dx < 0) this.entitySprite?.setFlipX(true); else this.entitySprite?.setFlipX(false)`
- Return false

`pickRandomTarget(radius: number): { x: number; y: number }`:
- Pick random angle and distance (within radius)
- Calculate target position: `{ x: this.x + Math.cos(angle) * distance, y: this.y + Math.sin(angle) * distance }`
- Clamp to world bounds (50 to 950 on each axis)
- Return target

`getDialogue(): string`:
- Return random element from dialogueLines

`setFleeing(fleeFromX: number, fleeFromY: number): void`:
- Set behaviorPattern to 'flee'
- Store flee target for flee update logic

`stopFleeing(): void`:
- Restore original behaviorPattern
- Stop velocity

`initFromDefinition(definition: NPCDefinition): void`:
- Reset all properties from definition (used when recycling from pool)
- Set position, speed, behavior, type, dialogue

**Acceptance:** File compiles. NPC can be created with a definition, moves according to behavior pattern.

---

## Prompt 2.3: Civilian NPC & NPC Data

**Create:** `src/entities/Civilian.ts`, `src/data/npcs.ts`

### src/entities/Civilian.ts

**Imports:**
- `NPC` from `'@/entities/NPC'`
- `NPCDefinition` from `'@/types/game.types'`
- `CIVILIAN_DEFINITIONS` from `'@/data/npcs'`
- `Phaser` from `'phaser'`

**Export `class Civilian extends NPC`:**

**Constructor(scene: Phaser.Scene, x: number, y: number, variant?: number):**
1. Pick a variant: `const idx = variant ?? Math.floor(Math.random() * CIVILIAN_DEFINITIONS.length)`
2. Get definition: `const def = CIVILIAN_DEFINITIONS[idx % CIVILIAN_DEFINITIONS.length]`
3. Call `super(scene, x, y, def)`

No additional methods needed — Civilian is just a convenience wrapper.

### src/data/npcs.ts

**Imports:** `NPCDefinition` from `'@/types/game.types'`

Export the following arrays:

```typescript
export const CIVILIAN_DEFINITIONS: NPCDefinition[] = [
  {
    id: 'civilian_1',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#795548', secondaryColor: '#5d4037', size: 10 },
    speed: 60,
    behaviorPattern: 'wander',
    interactable: true,
    dialogueLines: [
      'Running late again...',
      'Is the downtown train running?',
      'Only in New York...',
      'I have been waiting twenty minutes.',
      'You know when the next bus is?',
    ],
  },
  {
    id: 'civilian_2',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#607d8b', secondaryColor: '#455a64', size: 10 },
    speed: 50,
    behaviorPattern: 'follow_path',
    interactable: true,
    dialogueLines: [
      'Excuse me, coming through!',
      'Watch the closing doors!',
      'Three trains just passed, all full.',
      'This is my stop... wait, no it is not.',
    ],
  },
  {
    id: 'civilian_3',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#ff7043', secondaryColor: '#e64a19', size: 10 },
    speed: 70,
    behaviorPattern: 'wander',
    interactable: true,
    dialogueLines: [
      'This station always smells weird.',
      'I shoulda taken the bus.',
      'My MetroCard keeps failing.',
      'Signal problems, what else is new.',
    ],
  },
  {
    id: 'civilian_4',
    type: 'civilian',
    spriteConfig: { shape: 'rect', primaryColor: '#ab47bc', secondaryColor: '#8e24aa', size: 10 },
    speed: 55,
    behaviorPattern: 'crowd',
    interactable: true,
    dialogueLines: [
      'At least it is not raining down here.',
      'Do not make eye contact...',
      'Is this the right platform?',
      'Another day, another dollar.',
    ],
  },
];

export const FARE_EVADER_DEFINITION: NPCDefinition = {
  id: 'fare_evader_base',
  type: 'fare_evader',
  spriteConfig: { shape: 'rect', primaryColor: '#c62828', secondaryColor: '#b71c1c', size: 10 },
  speed: 140,
  behaviorPattern: 'flee',
  interactable: false,
  dialogueLines: [],
};

export const SUSPICIOUS_PERSON_DEFINITION: NPCDefinition = {
  id: 'suspicious_base',
  type: 'suspicious_person',
  spriteConfig: { shape: 'rect', primaryColor: '#37474f', secondaryColor: '#263238', size: 10 },
  speed: 40,
  behaviorPattern: 'stationary',
  interactable: true,
  dialogueLines: [
    'What are you looking at?',
    'I am just waiting for someone.',
    'Move along, officer.',
    'Mind your own business.',
  ],
};
```

**Acceptance:** Both files compile. `new Civilian(scene, 100, 100)` creates a working civilian NPC. `CIVILIAN_DEFINITIONS.length === 4`.

---

## Prompt 2.4: NPCManager

**Create:** `src/managers/NPCManager.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `NPC` from `'@/entities/NPC'`
- `Civilian` from `'@/entities/Civilian'`
- `Station`, `NPCDefinition` from `'@/types/game.types'`
- `MAX_NPCS_VISIBLE`, `NPC_SPAWN_RADIUS`, `NPC_DESPAWN_RADIUS`, `PLAYER_INTERACT_RADIUS` from `'@/config/constants'`

**Export `class NPCManager`:**

**Properties:**
- `private activeNPCs: NPC[]` = []
- `private npcPool: NPC[]` = []
- `private maxActive: number` = MAX_NPCS_VISIBLE
- `private spawnTimer: number` = 0
- `private scene: Phaser.Scene | null` = null
- `private npcGroup: Phaser.Physics.Arcade.Group | null` = null

**Methods:**

`init(scene: Phaser.Scene): void`:
- Store scene
- Create physics group: `this.npcGroup = scene.physics.add.group()`
- Pre-create 10 civilians in pool (deactivated)

`update(playerX: number, playerY: number, delta: number): void`:
1. `const dt = delta / 1000`
2. Despawn far NPCs: iterate activeNPCs, if distance to player > NPC_DESPAWN_RADIUS, call despawn(npc)
3. Spawn check (every 0.5 seconds via spawnTimer):
   - If activeNPCs.length < maxActive:
   - Pick random position within NPC_SPAWN_RADIUS of player, but at least NPC_SPAWN_RADIUS * 0.6 away (spawn off-screen)
   - Call spawnCivilian at that position
4. Update all active NPCs: `for (const npc of this.activeNPCs) npc.update(delta)`

`spawnCivilian(x: number, y: number): NPC`:
- If pool has NPCs: pop one, reinitialize with random civilian definition, set position, activate
- Else: create new Civilian(scene, x, y), add to npcGroup
- Push to activeNPCs
- Return the NPC

`spawnNPCFromDefinition(x: number, y: number, definition: NPCDefinition): NPC`:
- Create new NPC from definition (don't use pool for mission NPCs)
- Add to npcGroup and activeNPCs
- Return NPC

`despawn(npc: NPC): void`:
- Remove from activeNPCs
- Deactivate
- Add to pool (if pool size < 30, else destroy)

`despawnAll(): void`:
- Despawn each active NPC

`getNearbyNPCs(x: number, y: number, radius: number): NPC[]`:
- Filter activeNPCs by distance < radius

`getInteractableNPC(playerX: number, playerY: number): NPC | null`:
- Get nearby NPCs within PLAYER_INTERACT_RADIUS
- Filter by interactable === true
- Return closest, or null

`getGroup(): Phaser.Physics.Arcade.Group | null`:
- Return npcGroup

`getActiveCount(): number`:
- Return activeNPCs.length

**Acceptance:** File compiles. After init, NPCs spawn near player, despawn when far, and pool reuses objects.

---

## Prompt 2.5: DialogueSystem

**Create:** `src/systems/DialogueSystem.ts`

**Imports:**
- `Phaser` from `'phaser'`
- `NPCType` from `'@/types/game.types'`
- `COLOR_UI_SURFACE`, `COLOR_UI_TEXT`, `COLOR_UI_TEXT_DIM`, `COLOR_UI_PRIMARY`, `hexToNum` from `'@/graphics/colors'`

**Export `class DialogueSystem`:**

**Properties:**
- `private container: Phaser.GameObjects.Container`
- `private nameText: Phaser.GameObjects.Text`
- `private dialogueText: Phaser.GameObjects.Text`
- `private background: Phaser.GameObjects.Rectangle`
- `private isShowing: boolean` = false
- `private displayTimer: number` = 0
- `private scene: Phaser.Scene`

**Constructor(scene: Phaser.Scene):**
1. Store scene
2. `const width = scene.cameras.main.width`
3. `const height = scene.cameras.main.height`
4. Create container at (0, height - 80), scrollFactor 0, depth 998
5. Background: rectangle at (width/2, 0), size (width - 20, 60), color COLOR_UI_SURFACE, alpha 0.9, rounded (use fillRoundedRect on a Graphics object, or just a plain rect)
6. nameText: at (15, 8), fontSize 12, bold, color COLOR_UI_PRIMARY
7. dialogueText: at (15, 28), fontSize 11, color COLOR_UI_TEXT, wordWrap width-50
8. Add all to container
9. Container starts invisible: `this.container.setVisible(false)`

**Methods:**

`show(npcType: NPCType, line: string): void`:
- Map npcType to display name:
  - 'civilian' → 'Commuter'
  - 'fare_evader' → 'Suspect'
  - 'suspicious_person' → 'Unknown Individual'
  - 'lost_tourist' → 'Tourist'
  - 'vendor' → 'Vendor'
  - 'musician' → 'Musician'
  - 'commuter' → 'Commuter'
- Set nameText to display name
- Set dialogueText to line
- Set container visible, alpha 0 → tween to 1 (200ms)
- isShowing = true
- displayTimer = 3.0

`hide(): void`:
- Tween alpha to 0 (200ms), then setVisible(false)
- isShowing = false

`update(delta: number): void`:
- If not showing, return
- `displayTimer -= delta / 1000`
- If displayTimer <= 0: hide()

`isVisible(): boolean`:
- Return isShowing

**Acceptance:** File compiles. Calling show() displays a dialogue box at bottom of screen with NPC name and text. Auto-hides after 3 seconds.

---

## Prompt 2.6: Phase 2 Integration

**Modify existing files:**

### src/entities/Player.ts
- Change `extends Phaser.GameObjects.Container` to `extends Entity`
- Import Entity from `'@/entities/Entity'`
- Adapt constructor to call `super(scene, x, y, 'player_' + characterClass, 'player')`
- Replace `this.playerSprite` references with `this.entitySprite`
- Keep all existing Player methods (update, enterStation, exitStation, etc.)
- Add `isInteracting: boolean` = false property
- In update(): if isInteracting, set velocity to 0 and return early

### src/scenes/BootScene.ts
- Import `NPCManager` from `'@/managers/NPCManager'`
- In create(): `const npcManager = new NPCManager()`, `this.game.registry.set('npcManager', npcManager)`

### src/scenes/GameScene.ts
- Import `NPCManager`, `DialogueSystem`, `NPC`
- In create():
  - Get npcManager from registry
  - `npcManager.init(this)`
  - Create dialogueSystem: `this.dialogueSystem = new DialogueSystem(this)`
  - Add physics collider: `this.physics.add.collider(this.player, npcManager.getGroup())`
- In update():
  - After player update: `npcManager.update(player.x, player.y, delta)`
  - `this.dialogueSystem.update(delta)`
  - On action press (when not at station entrance):
    - Check `npcManager.getInteractableNPC(player.x, player.y)`
    - If found: `this.dialogueSystem.show(npc.npcType, npc.getDialogue())`

### src/scenes/StationScene.ts
- Import `NPCManager`, `Civilian`
- In create(): spawn 3–5 civilians inside the station at platform and turnstile positions
- In update(): update those NPCs
- On scene stop/sleep: despawn station NPCs

**Acceptance:**
1. 15+ NPCs visible on overworld, walking naturally
2. NPCs spawn off-screen, despawn when far
3. Interacting with NPCs shows dialogue
4. NPCs visible inside stations
5. Pool reuses objects (no unbounded growth)
6. Player still works correctly with Entity base class
7. 60fps with 20 NPCs, no console errors

---

## Phase 2 Summary

| Prompt | Files | Description |
|--------|-------|-------------|
| 2.1 | 1 entity | Entity base class (abstract) |
| 2.2 | 1 entity | NPC class with behavior patterns |
| 2.3 | 2 files | Civilian NPC + NPC data definitions |
| 2.4 | 1 manager | NPCManager — spawning, pooling, lifecycle |
| 2.5 | 1 system | DialogueSystem — NPC dialogue display |
| 2.6 | Modifications | Integration into GameScene, StationScene, Player, BootScene |
