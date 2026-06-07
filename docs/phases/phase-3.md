# Phase 3: Metro Police Class & Mission System

## Current State (After Phase 2)
The game world is populated and interactive:
- Player walks around Manhattan with collision, enters/exits 5 stations, rides subway
- 15–20 ambient civilian NPCs visible at all times, wandering/patrolling/crowding
- NPC pooling system (NPCManager) handles spawning/despawning around the player
- NPCs in stations (platforms, turnstiles)
- Player interacts with NPCs to see dialogue (DialogueSystem)
- Entity base class established; Player extends Entity
- Day/night cycle, minimap, HUD overlay all running
- Full type system, all managers in registry

### Existing Files
All Phase 0 + Phase 1 files plus:
- `src/entities/Entity.ts`, `src/entities/NPC.ts`, `src/entities/Civilian.ts`
- `src/managers/NPCManager.ts`
- `src/systems/DialogueSystem.ts`
- `src/data/npcs.ts`

## Goal
Build the full Metro Police gameplay loop: character selection, mission accept/track/complete/fail, pursuit mechanics, patrol mechanics, specialized NPCs (fare evaders, suspicious persons), radio dispatch UI, and all 10 police missions playable from start to finish.

## Tech Stack
Same as Phase 0.

## Coding Standards
Same as Phase 0.

## Deliverables

### 1. MainMenuScene

**`src/scenes/MainMenuScene.ts`** — Phaser.Scene (key: `'MainMenuScene'`):

The title screen. First scene the player sees (BootScene transitions here instead of GameScene).

**Visual layout:**
- Dark background (COLOR_UI_BACKGROUND: `#1a1a2e`)
- Title "MTA UNDERGROUND" in large white text, top third of screen
- Subtitle "TRANSIT NEVER SLEEPS" in smaller orange text (COLOR_UI_PRIMARY)
- Animated subway train silhouette sliding across behind the title (simple colored rectangle moving left to right, looping)
- Three buttons centered vertically:
  - "NEW GAME" — starts fresh (calls SaveManager.deleteSave then transitions to CharacterSelectScene)
  - "CONTINUE" — only visible if SaveManager.hasSave() is true; loads save and goes to GameScene
  - "SETTINGS" — opens settings overlay (volume sliders, vibration toggle) — simplified version, full version in Phase 5

**Button style:** Rounded rectangles with COLOR_UI_PRIMARY background, white text, slight scale tween on press.

### 2. CharacterSelectScene

**`src/scenes/CharacterSelectScene.ts`** — Phaser.Scene (key: `'CharacterSelectScene'`):

Where the player picks their class.

**Visual layout:**
- Title "CHOOSE YOUR ROLE" at top
- Three character cards side by side (horizontally scrollable on mobile):

  **Card 1: Metro Police** (PLAYABLE)
  - Character sprite preview (larger version of player_police texture, ~48px)
  - Name: "METRO POLICE"
  - Description: "Patrol the underground. Chase fare evaders. Keep the peace."
  - "SELECT" button (COLOR_UI_PRIMARY)
  
  **Card 2: Rider** (LOCKED)
  - Grayed-out character sprite
  - Name: "RIDER"
  - "COMING SOON" overlay text
  - No select button
  
  **Card 3: MTA Driver** (LOCKED)
  - Grayed-out character sprite
  - Name: "MTA DRIVER"
  - "COMING SOON" overlay text
  - No select button

**On select Police:**
1. Create new save via SaveManager.createNewSave('police')
2. Transition to GameScene

### 3. MissionManager

**`src/managers/MissionManager.ts`**

Core mission lifecycle manager. Handles accepting, tracking, completing, and failing missions.

**Properties:**
- `activeMission: MissionDefinition | null` — currently active mission
- `activeObjectives: Map<string, { objective: MissionObjective; completed: boolean; currentCount: number }>` — live objective tracking
- `missionTimer: number | null` — countdown timer for timed missions (seconds remaining)
- `missionState: 'idle' | 'briefing' | 'active' | 'complete' | 'failed'`
- `availableMissions: MissionDefinition[]` — missions the player can currently accept

**Methods:**
- `init(): void` — loads mission definitions, calculates available missions based on save data
- `getAvailableMissions(classProgress: ClassProgress): MissionDefinition[]` — filters all missions for the current class by:
  - Not already completed
  - Level requirement met
  - Unlock condition met (prerequisite mission completed, or 'always')
  - Returns sorted by difficulty

- `startMission(missionId: string): void`:
  1. Find mission definition by ID
  2. Set activeMission, missionState = 'active'
  3. Initialize activeObjectives from mission.objectives (all incomplete, currentCount=0)
  4. Start missionTimer if mission.timeLimit is not null
  5. Emit GameEvents.MISSION_STARTED with mission data
  6. Trigger any mission-specific setup (spawn NPCs, set waypoints)

- `updateObjective(objectiveId: string, increment: number): void`:
  1. Find objective in activeObjectives
  2. Increment currentCount by increment
  3. If currentCount >= objective.count, mark completed
  4. Emit GameEvents.MISSION_OBJECTIVE_COMPLETE
  5. Check if all non-optional objectives complete → completeMission()

- `update(delta: number): void`:
  1. If missionState !== 'active', return
  2. If missionTimer !== null, decrement by delta
  3. If missionTimer <= 0, call failMission('Time ran out!')

- `completeMission(): void`:
  1. Set missionState = 'complete'
  2. Calculate rewards (base + bonus for optional objectives)
  3. Emit GameEvents.MISSION_COMPLETED with rewards
  4. Mark mission as completed in save data
  5. Check for newly unlocked missions
  6. Clean up mission-specific NPCs/objects

- `failMission(reason: string): void`:
  1. Set missionState = 'failed'
  2. Emit GameEvents.MISSION_FAILED with reason
  3. Clean up mission-specific NPCs/objects
  4. Increment stats.missionsFailedCount

- `abandonMission(): void` — cancel active mission without failure penalty

- `getObjectiveProgress(): Array<{ description: string; current: number; target: number; completed: boolean }>` — returns formatted objective status for HUD display

Instantiated in BootScene, stored in registry as `'missionManager'`.

### 4. MissionBriefScene

**`src/scenes/MissionBriefScene.ts`** — Phaser.Scene (key: `'MissionBriefScene'`):

Shown before a mission starts. Overlay on top of GameScene (does not replace it).

**Input data:** `{ mission: MissionDefinition }`

**Visual layout:**
- Semi-transparent dark overlay covering full screen
- Centered panel (80% width, 60% height) with COLOR_UI_SURFACE background
- Mission title in large white text
- Difficulty stars (1–5, orange filled, gray unfilled)
- Briefing text in smaller white text (the narrative briefing)
- Objectives list with checkbox-style bullets
- Rewards section: "$X" in gold, "XP: Y" in purple
- Time limit if applicable: "TIME: X:XX" in red
- Two buttons:
  - "ACCEPT" (COLOR_UI_PRIMARY) — starts the mission
  - "BACK" (gray) — returns to mission select

**On ACCEPT:**
1. Call missionManager.startMission(mission.id)
2. Stop this scene
3. Resume GameScene (which now has active mission state)

### 5. MissionCompleteScene

**`src/scenes/MissionCompleteScene.ts`** — Phaser.Scene (key: `'MissionCompleteScene'`):

Shown when a mission is completed or failed.

**Input data:** `{ mission: MissionDefinition; success: boolean; rewards?: MissionRewards; reason?: string }`

**Visual layout — Success:**
- "MISSION COMPLETE" in large green text
- Mission title
- Objectives checklist (all green checks, bonus objectives marked if done)
- Rewards: "$X earned" with counting animation, "XP +Y" with counting animation
- "CONTINUE" button → returns to GameScene idle state

**Visual layout — Failed:**
- "MISSION FAILED" in large red text
- Mission title
- Failure reason text
- Two buttons:
  - "RETRY" → restarts the same mission (goes to MissionBriefScene)
  - "QUIT" → returns to GameScene idle state

### 6. MissionTracker HUD

**`src/ui/MissionTracker.ts`**

Displays active mission objectives in the top-left of the HUD.

**Visual:**
- Small semi-transparent panel
- Mission title in small bold text
- Each objective as a line: "[ ] Description (0/1)" or "[X] Description (1/1)"
- Timer (if applicable) showing MM:SS countdown, turns red when under 30 seconds
- Panel auto-sizes based on number of objectives

**Methods:**
- `setMission(mission: MissionDefinition): void` — populate display
- `updateObjective(objectiveId: string, current: number, target: number, completed: boolean): void`
- `updateTimer(seconds: number): void`
- `clear(): void` — hide when no mission active

Added to HUDScene.

### 7. PursuitSystem

**`src/systems/PursuitSystem.ts`**

Manages chase mechanics for pursuit missions.

**Properties:**
- `target: NPC | null` — the NPC being chased
- `isActive: boolean`
- `catchRadius: number` — PLAYER_CATCH_RADIUS (modified by items)
- `targetEscapeRadius: number` — distance at which target escapes (300px from spawn point)

**Methods:**
- `startPursuit(target: NPC): void`:
  1. Set target, isActive = true
  2. Set NPC behavior to 'flee'
  3. NPC begins running away from player

- `update(playerX: number, playerY: number, delta: number): void`:
  1. If not active, return
  2. Update flee direction (NPC runs away from player, with some randomness to avoid straight lines)
  3. NPC pathfinding: prefers to run along streets (not through buildings), picks the street direction most away from player
  4. Check catch condition: if distance(player, target) < catchRadius → caught()
  5. Check escape condition: if target reaches map edge or too far from player → escaped()

- `caught(): void`:
  1. Stop NPC movement
  2. Play "caught" visual feedback (NPC flashes)
  3. Emit GameEvents.NPC_CAUGHT
  4. Set isActive = false

- `escaped(): void`:
  1. Emit GameEvents.NPC_ESCAPED
  2. Set isActive = false

**Flee AI (NPC behavior during pursuit):**
- Calculate vector from player to NPC
- Add randomness (up to 30 degrees deviation) every 0.5 seconds
- Prefer street-aligned directions (snap to nearest cardinal if within 20 degrees)
- If about to hit a building, turn 90 degrees toward nearest open street
- Speed: NPC_SPEED_FLEE (140 px/s) — faster than player base (120 px/s), so player needs sprint or items to catch up
- Flee NPCs slow down slightly (~10%) when turning corners (adds skill element)

### 8. PatrolSystem

**`src/systems/PatrolSystem.ts`**

Manages patrol/checkpoint missions.

**Properties:**
- `checkpoints: Array<{ id: string; position: { x: number; y: number }; reached: boolean; stationId?: string }>` — ordered waypoints
- `currentCheckpointIndex: number`
- `isActive: boolean`
- `checkpointRadius: number` — 30px

**Methods:**
- `startPatrol(checkpoints: Array<{ id: string; position: { x: number; y: number }; stationId?: string }>): void`:
  1. Set checkpoints, all marked not reached
  2. currentCheckpointIndex = 0
  3. isActive = true
  4. Render first checkpoint marker on map

- `update(playerX: number, playerY: number): void`:
  1. If not active, return
  2. Check if player is within checkpointRadius of current checkpoint
  3. If reached: mark reached, emit objective update, advance to next
  4. If all checkpoints reached: patrol complete

- `getActiveCheckpointPosition(): { x: number; y: number } | null` — for rendering waypoint marker
- `renderCheckpointMarker(scene: Phaser.Scene): Phaser.GameObjects.Graphics` — draws a pulsing circle at the active checkpoint position (orange circle, alpha oscillating)

### 9. FareEvader NPC

**`src/entities/FareEvader.ts`**

Extends NPC. Specialized for pursuit missions.

**Properties:**
- `fleeSpeed: number` — NPC_SPEED_FLEE
- `cornerSlowdown: number` — 0.9 (10% speed reduction on turns)
- `directionChangeTimer: number` — countdown for random direction changes during flee
- `hasBeenSpotted: boolean` — becomes true when player gets within detection range

**Constructor(scene, x, y):**
- Uses fare_evader definition from npcs.ts
- Sets behaviorPattern to 'stationary' initially (loitering, waiting to be "spotted")

**Methods:**
- `spot(): void` — called when player gets within detection range:
  - Sets hasBeenSpotted = true
  - Changes behaviorPattern to 'flee'
  - Visual indicator: NPC briefly shows "!" text above head
  
- `update(delta: number): void`:
  - If not spotted: stand in place, maybe wander slightly
  - If spotted/fleeing: run from player using PursuitSystem's flee AI
  - Handles cornering slowdown, random direction changes

### 10. SuspiciousNPC

**`src/entities/SuspiciousNPC.ts`**

Extends NPC. Used in investigation missions.

**Properties:**
- `isEvidence: boolean` — whether this NPC/location is the correct investigation target
- `investigated: boolean` — whether player has already interacted

**Constructor(scene, x, y, isEvidence: boolean):**
- Uses suspicious_person definition from npcs.ts
- Sets stationary behavior

**Methods:**
- `investigate(): string` — called when player interacts:
  - Sets investigated = true
  - If isEvidence: returns a "found evidence" dialogue line
  - If not evidence: returns a "nothing here" dialogue line
  - Visual change: NPC sprite tint changes to indicate investigated

### 11. RadioDisplay

**`src/ui/RadioDisplay.ts`**

Police dispatch radio UI element. Shows mission prompts and alerts.

**Visual:**
- Small panel at top-center of HUD
- Radio icon (small circle) on the left
- Message text scrolling/typing in from left to right (typewriter effect)
- Background: dark semi-transparent with subtle orange border
- Auto-hides after message is fully displayed + 3 seconds

**Methods:**
- `showMessage(message: string, priority: 'normal' | 'urgent'): void`:
  - 'normal': white text, types at 30 chars/second
  - 'urgent': orange text, types at 50 chars/second, border flashes
- `update(delta: number): void` — handles typewriter animation and auto-hide
- `hide(): void` — immediately hide

Added to HUDScene. Used by MissionManager to announce new missions, objective updates, alerts.

### 12. Police Mission Data

**`src/data/missions/police-missions.ts`** — Exports `MissionDefinition[]`:

**Mission 1: "First Beat"**
```
id: 'police_m01'
classRequired: 'police'
title: 'First Beat'
description: 'Walk your first patrol route.'
briefing: 'Welcome to Transit, Officer. Your first shift is a simple walkthrough. Visit the platforms at Grand Central, Penn Station, and City Hall to check in.'
district: 'manhattan'
stationId: 'manhattan_grand_central'
levelRequired: 1
type: 'patrol'
objectives: [
  { id: 'p1_o1', description: 'Visit Grand Central platform', type: 'reach_location', targetId: 'manhattan_grand_central_platform', count: 1, optional: false },
  { id: 'p1_o2', description: 'Visit Penn Station platform', type: 'reach_location', targetId: 'manhattan_penn_platform', count: 1, optional: false },
  { id: 'p1_o3', description: 'Visit City Hall platform', type: 'reach_location', targetId: 'manhattan_city_hall_platform', count: 1, optional: false }
]
rewards: { money: 100, xp: 50, itemIds: [], bonusMoney: 0, bonusXp: 0 }
timeLimit: null
difficulty: 1
unlockCondition: { type: 'always', value: 0 }
```

**Mission 2: "Fare Jumper"**
```
id: 'police_m02'
classRequired: 'police'
title: 'Fare Jumper'
description: 'Chase down a fare evader.'
briefing: 'We have got a fare evader at Union Square. Suspect jumped the turnstile heading downtown. Intercept and detain.'
district: 'manhattan'
stationId: 'manhattan_union_sq'
levelRequired: 1
type: 'pursuit'
objectives: [
  { id: 'p2_o1', description: 'Catch the fare evader', type: 'catch_npc', targetId: 'fare_evader_m02', count: 1, optional: false }
]
rewards: { money: 150, xp: 75, itemIds: [], bonusMoney: 0, bonusXp: 0 }
timeLimit: 60
difficulty: 1
unlockCondition: { type: 'mission_complete', value: 'police_m01' }
```

**Mission 3: "Rush Hour Patrol"**
```
id: 'police_m03'
classRequired: 'police'
title: 'Rush Hour Patrol'
description: 'Keep the peace during rush hour.'
briefing: 'Evening rush is hitting hard. We need eyes on the platform. Walk the beat at Times Square during peak hour — keep the peace.'
district: 'manhattan'
stationId: 'manhattan_times_sq'
levelRequired: 2
type: 'patrol'
objectives: [
  { id: 'p3_o1', description: 'Patrol Times Square station', type: 'survive_time', targetId: 'manhattan_times_sq', count: 90, optional: false },
  { id: 'p3_o2', description: 'Talk to 3 commuters', type: 'interact_object', targetId: 'civilian', count: 3, optional: false }
]
rewards: { money: 200, xp: 100, itemIds: [], bonusMoney: 0, bonusXp: 0 }
timeLimit: 120
difficulty: 2
unlockCondition: { type: 'level', value: 2 }
```

**Mission 4: "The Runner"**
```
id: 'police_m04'
classRequired: 'police'
title: 'The Runner'
description: 'High-speed pursuit across stations.'
briefing: 'Got a real runner this time. Suspect evaded fare at Grand Central and is heading toward Penn Station on foot through the tunnels. This one is fast.'
district: 'manhattan'
stationId: 'manhattan_grand_central'
levelRequired: 2
type: 'pursuit'
objectives: [
  { id: 'p4_o1', description: 'Chase the suspect to Penn Station', type: 'reach_location', targetId: 'manhattan_penn', count: 1, optional: false },
  { id: 'p4_o2', description: 'Catch the runner', type: 'catch_npc', targetId: 'fare_evader_m04', count: 1, optional: false }
]
rewards: { money: 300, xp: 150, itemIds: [], bonusMoney: 0, bonusXp: 0 }
timeLimit: 90
difficulty: 2
unlockCondition: { type: 'mission_complete', value: 'police_m02' }
```

**Mission 5: "Suspicious Package"**
```
id: 'police_m05'
classRequired: 'police'
title: 'Suspicious Package'
description: 'Investigate a reported threat.'
briefing: 'Dispatch received a call about an unattended bag. Could be nothing, could be something. Check the reported locations at Union Square — platforms, mezzanine, and exit corridor.'
district: 'manhattan'
stationId: 'manhattan_union_sq'
levelRequired: 3
type: 'investigate'
objectives: [
  { id: 'p5_o1', description: 'Search platform area', type: 'interact_object', targetId: 'search_spot_1', count: 1, optional: false },
  { id: 'p5_o2', description: 'Search mezzanine', type: 'interact_object', targetId: 'search_spot_2', count: 1, optional: false },
  { id: 'p5_o3', description: 'Search exit corridor', type: 'interact_object', targetId: 'search_spot_3', count: 1, optional: false },
  { id: 'p5_o4', description: 'Report findings', type: 'interact_object', targetId: 'report_spot', count: 1, optional: false }
]
rewards: { money: 400, xp: 200, itemIds: [], bonusMoney: 50, bonusXp: 25 }
timeLimit: 120
difficulty: 3
unlockCondition: { type: 'level', value: 3 }
```

**Mission 6: "Platform Incident"**
```
id: 'police_m06'
classRequired: 'police'
title: 'Platform Incident'
description: 'Help an injured passenger.'
briefing: 'Got a medical situation at City Hall. A passenger collapsed on the northbound platform. Get to them, provide first response, and escort them to street level for EMS.'
district: 'manhattan'
stationId: 'manhattan_city_hall'
levelRequired: 3
type: 'escort'
objectives: [
  { id: 'p6_o1', description: 'Reach the injured passenger', type: 'reach_location', targetId: 'injured_npc_pos', count: 1, optional: false },
  { id: 'p6_o2', description: 'Stabilize the passenger', type: 'interact_object', targetId: 'injured_npc', count: 1, optional: false },
  { id: 'p6_o3', description: 'Escort to station exit', type: 'escort_npc', targetId: 'injured_npc', count: 1, optional: false }
]
rewards: { money: 350, xp: 175, itemIds: [], bonusMoney: 0, bonusXp: 0 }
timeLimit: 90
difficulty: 3
unlockCondition: { type: 'mission_complete', value: 'police_m05' }
```

**Mission 7: "Night Shift"**
```
id: 'police_m07'
classRequired: 'police'
title: 'Night Shift'
description: 'Patrol after dark with reduced visibility.'
briefing: 'Late night duty. The stations thin out after midnight but that is when trouble likes to show up. Patrol Penn Station and Grand Central — visibility is reduced, stay sharp.'
district: 'manhattan'
stationId: 'manhattan_penn'
levelRequired: 4
type: 'patrol'
objectives: [
  { id: 'p7_o1', description: 'Patrol Penn Station', type: 'reach_location', targetId: 'manhattan_penn_platform', count: 1, optional: false },
  { id: 'p7_o2', description: 'Patrol Grand Central', type: 'reach_location', targetId: 'manhattan_grand_central_platform', count: 1, optional: false },
  { id: 'p7_o3', description: 'Interact with 2 suspicious persons', type: 'interact_object', targetId: 'suspicious_npc', count: 2, optional: false }
]
rewards: { money: 500, xp: 250, itemIds: [], bonusMoney: 100, bonusXp: 50 }
timeLimit: 180
difficulty: 3
unlockCondition: { type: 'level', value: 4 }
```

**Mission 8: "Double Trouble"**
```
id: 'police_m08'
classRequired: 'police'
title: 'Double Trouble'
description: 'Chase two fare evaders at once.'
briefing: 'Two suspects, one station. Both jumped turnstiles at Times Square heading opposite directions. You will need to decide who to chase first — or get creative.'
district: 'manhattan'
stationId: 'manhattan_times_sq'
levelRequired: 4
type: 'pursuit'
objectives: [
  { id: 'p8_o1', description: 'Catch fare evader #1', type: 'catch_npc', targetId: 'fare_evader_m08_a', count: 1, optional: false },
  { id: 'p8_o2', description: 'Catch fare evader #2', type: 'catch_npc', targetId: 'fare_evader_m08_b', count: 1, optional: false }
]
rewards: { money: 600, xp: 300, itemIds: [], bonusMoney: 0, bonusXp: 0 }
timeLimit: 120
difficulty: 4
unlockCondition: { type: 'mission_complete', value: 'police_m04' }
```

**Mission 9: "Underground Network"**
```
id: 'police_m09'
classRequired: 'police'
title: 'Underground Network'
description: 'Multi-station investigation.'
briefing: 'Intel says a group is running a counterfeit MetroCard operation across multiple stations. Visit Grand Central, Times Square, Union Square, and Penn Station. Find the evidence at each location.'
district: 'manhattan'
stationId: 'manhattan_grand_central'
levelRequired: 5
type: 'investigate'
objectives: [
  { id: 'p9_o1', description: 'Find evidence at Grand Central', type: 'collect_item', targetId: 'evidence_gc', count: 1, optional: false },
  { id: 'p9_o2', description: 'Find evidence at Times Square', type: 'collect_item', targetId: 'evidence_ts', count: 1, optional: false },
  { id: 'p9_o3', description: 'Find evidence at Union Square', type: 'collect_item', targetId: 'evidence_us', count: 1, optional: false },
  { id: 'p9_o4', description: 'Find evidence at Penn Station', type: 'collect_item', targetId: 'evidence_ps', count: 1, optional: false }
]
rewards: { money: 800, xp: 400, itemIds: [], bonusMoney: 200, bonusXp: 100 }
timeLimit: 240
difficulty: 4
unlockCondition: { type: 'mission_complete', value: 'police_m05' }
```

**Mission 10: "The Kingpin"**
```
id: 'police_m10'
classRequired: 'police'
title: 'The Kingpin'
description: 'Final showdown across all of Manhattan.'
briefing: 'This is it, Officer. The counterfeit operation leads to one person. They have been spotted at City Hall station but they will not go quietly. Track them across the entire Manhattan system. This is your moment.'
district: 'manhattan'
stationId: 'manhattan_city_hall'
levelRequired: 5
type: 'pursuit'
objectives: [
  { id: 'p10_o1', description: 'Track the Kingpin to Union Square', type: 'reach_location', targetId: 'manhattan_union_sq', count: 1, optional: false },
  { id: 'p10_o2', description: 'Track the Kingpin to Times Square', type: 'reach_location', targetId: 'manhattan_times_sq', count: 1, optional: false },
  { id: 'p10_o3', description: 'Track the Kingpin to Grand Central', type: 'reach_location', targetId: 'manhattan_grand_central', count: 1, optional: false },
  { id: 'p10_o4', description: 'Catch the Kingpin', type: 'catch_npc', targetId: 'kingpin_npc', count: 1, optional: false },
  { id: 'p10_o5', description: 'Catch within 4 minutes (bonus)', type: 'survive_time', targetId: 'timer_bonus', count: 240, optional: true }
]
rewards: { money: 1500, xp: 750, itemIds: ['police_skin_gold'], bonusMoney: 500, bonusXp: 250 }
timeLimit: 300
difficulty: 5
unlockCondition: { type: 'mission_complete', value: 'police_m09' }
```

### 13. Mission Select Integration in GameScene

When the player is idle (no active mission) and presses the action button near a station entrance or inside a station, show a mission select menu:

**Mission select flow:**
1. Player presses action at a station (or inside one)
2. GameScene checks: is there an active mission? If yes, handle mission interaction. If no:
3. Show a simple mission list overlay (not a full scene — a Container with list items)
4. List shows available missions for this station or nearby stations
5. Player taps a mission → launch MissionBriefScene with that mission's data
6. If no missions available at this station, show "No missions available here"

### 14. Mission Runtime Integration

When a mission is active, GameScene.update() must:
1. Call missionManager.update(delta) for timer countdown
2. Based on mission type, update the relevant system:
   - 'pursuit': update PursuitSystem with player/target positions
   - 'patrol': update PatrolSystem with player position
   - 'investigate': check interact_object overlaps with search spots
   - 'escort': update escort NPC follow behavior, check exit zone

**Mission-specific NPC spawning:**
- When MissionManager starts a pursuit mission: spawn FareEvader at the mission's target position
- When starting investigate mission: spawn SuspiciousNPCs and search spot indicators at specified positions
- When starting escort mission: spawn the escort target NPC
- All mission NPCs are despawned when the mission ends (complete/fail/abandon)

**Night Shift (Mission 7) special behavior:**
- When this mission starts, force DayNightSystem.setTime(0.9) (night)
- Reduce player visibility radius (add a circular "flashlight" mask or increase night tint alpha)

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `src/scenes/MainMenuScene.ts` | Title screen with New Game/Continue/Settings |
| `src/scenes/CharacterSelectScene.ts` | Class picker (Police only for MVP) |
| `src/scenes/MissionBriefScene.ts` | Mission briefing overlay |
| `src/scenes/MissionCompleteScene.ts` | Mission results (success/fail) |
| `src/managers/MissionManager.ts` | Mission lifecycle management |
| `src/systems/PursuitSystem.ts` | Chase mechanics |
| `src/systems/PatrolSystem.ts` | Checkpoint patrol mechanics |
| `src/entities/FareEvader.ts` | Fare evader NPC |
| `src/entities/SuspiciousNPC.ts` | Investigation target NPC |
| `src/ui/MissionTracker.ts` | HUD mission objective display |
| `src/ui/RadioDisplay.ts` | Police radio dispatch messages |
| `src/data/missions/police-missions.ts` | 10 police mission definitions |

## Files Modified in This Phase

| File | Change |
|------|--------|
| `src/scenes/BootScene.ts` | Transition to MainMenuScene; add MissionManager to registry |
| `src/scenes/GameScene.ts` | Mission runtime integration, mission select, pursuit/patrol system updates, mission NPC spawning |
| `src/scenes/StationScene.ts` | Mission interactions inside stations (patrol checkpoints, investigation spots, escort targets) |
| `src/scenes/HUDScene.ts` | Add MissionTracker and RadioDisplay components |
| `src/config/game-config.ts` | Register new scenes |
| `src/managers/NPCManager.ts` | Add methods for spawning mission-specific NPCs (FareEvader, SuspiciousNPC) |

## Acceptance Criteria

1. Game boots to MainMenuScene with title, New Game, and Settings
2. New Game → CharacterSelectScene shows Police (selectable), Rider and Driver (Coming Soon)
3. Selecting Police creates save and enters GameScene
4. Continue button loads existing save and enters GameScene
5. Mission 1 ("First Beat"): patrol 3 stations, all trackable via HUD objectives → complete → rewards shown
6. Mission 2 ("Fare Jumper"): fare evader spawns, flees from player, catchable within 60s → rewards
7. Mission 5 ("Suspicious Package"): 3 search spots in station, find evidence, report → rewards
8. Mission 6 ("Platform Incident"): NPC follows player after interaction, escort to exit → rewards
9. Mission 7 ("Night Shift"): screen darkens, reduced visibility, patrol + interact → rewards
10. Mission 8 ("Double Trouble"): 2 evaders flee different directions, both catchable → rewards
11. Mission 10 ("The Kingpin"): multi-station chase, catch boss → rewards + Gold Shield skin unlock
12. All missions: timer counts down when applicable, mission fails on timeout with retry option
13. Radio display shows dispatch messages with typewriter effect when missions start/objectives update
14. Mission tracker HUD updates in real time as objectives progress
15. Failed missions incrementable in stats, retryable from results screen
16. Cannot start a mission if level requirement not met
17. Cannot start a locked mission (prerequisite not completed)
18. All 10 missions completable in sequence from start to finish
19. No TypeScript errors, no console errors
