# Phase 3 — Implementation Prompts

## Prompt 3.1: MainMenuScene

**Create:** `src/scenes/MainMenuScene.ts`

Full main menu scene. See phase-3.md for complete visual layout spec.

- Scene key: `'MainMenuScene'`
- Dark background (COLOR_UI_BACKGROUND)
- "MTA UNDERGROUND" title (32px white bold, centered, top third)
- "TRANSIT NEVER SLEEPS" subtitle (14px orange)
- Animated train: colored rectangle sliding left→right across mid-screen, repeating
- "NEW GAME" button — calls SaveManager.deleteSave(), transitions to CharacterSelectScene
- "CONTINUE" button — only visible if SaveManager.hasSave(), loads save, transitions to GameScene
- "SETTINGS" button — placeholder for now (Phase 5 implements full settings)
- Button style: rounded rect with COLOR_UI_PRIMARY bg, white text, 200x40px, scale tween on press (0.95 for 100ms)

**Modify `src/scenes/BootScene.ts`:** Change transition target from GameScene to MainMenuScene: `this.scene.start('MainMenuScene')`

**Modify `src/main.ts`:** Add MainMenuScene to scene array.

**Acceptance:** Game boots to main menu. NEW GAME button works. CONTINUE appears only if save exists.

---

## Prompt 3.2: CharacterSelectScene

**Create:** `src/scenes/CharacterSelectScene.ts`

Scene key: `'CharacterSelectScene'`. See phase-3.md for complete spec.

- "CHOOSE YOUR ROLE" title
- Three character cards in a horizontal row (scrollable or just fitted):
  - **Metro Police** (selectable): 48px sprite preview, name, description text, "SELECT" button
  - **Rider** (locked): grayed out sprite, name, "COMING SOON" overlay
  - **Driver** (locked): same as Rider
- On select Police:
  - Get SaveManager from registry
  - `saveManager.createNewSave('police')`
  - `this.scene.start('GameScene')`

**Modify `src/main.ts`:** Add CharacterSelectScene to scene array.

**Acceptance:** Selecting Police creates a save and enters the game. Rider and Driver show as locked.

---

## Prompt 3.3: MissionManager

**Create:** `src/managers/MissionManager.ts`

See phase-3.md for complete method specs. Key implementation details:

**Properties:** activeMission, activeObjectives (Map), missionTimer, missionState ('idle'|'briefing'|'active'|'complete'|'failed'), availableMissions.

**Methods:** init(), getAvailableMissions(classProgress), startMission(id), updateObjective(id, increment), update(delta), completeMission(), failMission(reason), abandonMission(), getObjectiveProgress().

- Uses GameEvents for all emissions (MISSION_STARTED, MISSION_OBJECTIVE_COMPLETE, MISSION_COMPLETED, MISSION_FAILED)
- All mission definitions imported from police-missions.ts (Prompt 3.8)
- Manages mission timer countdown in update()
- completeMission() marks mission complete in save data, checks unlocks
- failMission() increments stats.missionsFailedCount

**Modify `src/scenes/BootScene.ts`:** Add MissionManager to registry.
**Modify `src/main.ts`:** No scene changes needed (MissionManager is not a scene).

**Acceptance:** Can start, track, complete, and fail missions. Objectives update correctly. Timer counts down.

---

## Prompt 3.4: MissionBriefScene & MissionCompleteScene

**Create:** `src/scenes/MissionBriefScene.ts`, `src/scenes/MissionCompleteScene.ts`

### MissionBriefScene (key: 'MissionBriefScene')
- Receives `{ mission: MissionDefinition }` in create(data)
- Overlay on top of game (semi-transparent dark bg)
- Shows: title, difficulty stars, briefing text, objectives list, rewards ($, XP), time limit
- "ACCEPT" button → starts mission via MissionManager, stops this scene
- "BACK" button → stops this scene

### MissionCompleteScene (key: 'MissionCompleteScene')
- Receives `{ mission, success, rewards?, reason? }` in create(data)
- Success: "MISSION COMPLETE" green, objectives checklist, animated reward counting, "CONTINUE" button
- Failure: "MISSION FAILED" red, reason text, "RETRY" button (→ MissionBriefScene), "QUIT" button (→ GameScene idle)

**Modify `src/main.ts`:** Add both scenes.

**Acceptance:** Brief scene shows mission details. Complete scene shows results. Retry works on failure.

---

## Prompt 3.5: MissionTracker & RadioDisplay

**Create:** `src/ui/MissionTracker.ts`, `src/ui/RadioDisplay.ts`

### MissionTracker
- Semi-transparent panel at top-left of HUD (below pause button area)
- Mission title in small bold text
- Each objective: "[ ] Description (0/1)" or "[X] Description (1/1)"
- Timer: "MM:SS" countdown, turns red under 30s
- Methods: setMission(), updateObjective(), updateTimer(), clear()

### RadioDisplay
- Small panel at top-center of HUD
- Radio icon (small circle) + message text with typewriter effect (30 chars/sec normal, 50 chars/sec urgent)
- Orange border for urgent messages, subtle for normal
- Auto-hides after message completes + 3 seconds
- Methods: showMessage(text, priority), update(delta), hide()

**Modify `src/scenes/HUDScene.ts`:** Create instances of both, update in HUDScene.update(). Listen for mission events from game registry/events to update tracker and radio.

**Acceptance:** Mission tracker shows objectives during missions. Radio shows dispatch messages with typewriter effect.

---

## Prompt 3.6: PursuitSystem & FareEvader

**Create:** `src/systems/PursuitSystem.ts`, `src/entities/FareEvader.ts`

### PursuitSystem
See phase-3.md for complete spec. Key details:
- startPursuit(target): activates, sets NPC to flee
- update(playerX, playerY, delta): updates flee direction with randomness, checks catch/escape conditions
- Flee AI: NPC runs away from player, prefers streets, adds 30-degree random deviation every 0.5s, slows 10% on corners
- Catch: distance < PLAYER_CATCH_RADIUS → NPC flashes, emits NPC_CAUGHT
- Escape: NPC reaches map edge → emits NPC_ESCAPED
- **Critical:** NPC_SPEED_FLEE (140) > PLAYER_SPEED (120), so player must sprint (180) to catch. Sprint drains stamina. This creates tension.

### FareEvader
- Extends NPC
- Initially stationary (loitering)
- spot() method: sets hasBeenSpotted, switches to flee, shows "!" indicator
- Spotted when player gets within detection range (100px base, modified by items)

**Acceptance:** Fare evader runs from player with intelligent pathfinding. Catchable when sprinting. Escapes if player is too slow.

---

## Prompt 3.7: PatrolSystem & SuspiciousNPC

**Create:** `src/systems/PatrolSystem.ts`, `src/entities/SuspiciousNPC.ts`

### PatrolSystem
- Manages checkpoint-based missions
- startPatrol(checkpoints): sets up waypoints with positions
- update(playerX, playerY): checks if player reached current checkpoint (within 30px)
- Renders pulsing orange circle at active checkpoint
- getActiveCheckpointPosition() for minimap/HUD marker

### SuspiciousNPC
- Extends NPC
- isEvidence: boolean — whether this is the correct investigation target
- investigated: boolean
- investigate() method: returns different text if evidence vs not, changes tint on interaction

**Acceptance:** Patrol checkpoints work. SuspiciousNPC returns different results for evidence vs non-evidence.

---

## Prompt 3.8: Police Mission Data

**Create:** `src/data/missions/police-missions.ts`

Export `POLICE_MISSIONS: MissionDefinition[]` with all 10 missions exactly as specified in phase-3.md:
1. "First Beat" — patrol 3 stations
2. "Fare Jumper" — chase 1 evader, 60s
3. "Rush Hour Patrol" — patrol + interact 3 NPCs, 120s
4. "The Runner" — chase across 2 stations, 90s
5. "Suspicious Package" — investigate 3 spots, 120s
6. "Platform Incident" — escort NPC to exit, 90s
7. "Night Shift" — patrol at night, interact suspects, 180s
8. "Double Trouble" — catch 2 evaders, 120s
9. "Underground Network" — collect evidence at 4 stations, 240s
10. "The Kingpin" — chase boss across all 5 stations, 300s

Copy mission definitions exactly from phase-3.md — all IDs, objectives, rewards, unlock conditions as specified.

**Acceptance:** `POLICE_MISSIONS.length === 10`. All missions have valid MissionDefinition structure. IDs match: police_m01 through police_m10.

---

## Prompt 3.9: GameScene Mission Integration

**Modify:** `src/scenes/GameScene.ts`

Add mission runtime logic to the existing GameScene:

1. **Import** PursuitSystem, PatrolSystem, MissionManager, FareEvader, SuspiciousNPC
2. **In create():** Get MissionManager from registry. Initialize PursuitSystem and PatrolSystem.
3. **Mission select:** When action pressed at station and no active mission:
   - Get available missions from MissionManager
   - Show a simple text menu listing available missions
   - On selection: launch MissionBriefScene
4. **In update():**
   - If mission active: call missionManager.update(delta)
   - If pursuit mission: call pursuitSystem.update(player.x, player.y, delta)
   - If patrol mission: call patrolSystem.update(player.x, player.y)
5. **Mission NPC spawning:** Listen for MISSION_STARTED event:
   - If pursuit type: spawn FareEvader at target position, start PursuitSystem
   - If investigate type: spawn SuspiciousNPCs and search spot indicators
   - If escort type: spawn escort NPC
   - If patrol type: start PatrolSystem with checkpoint positions
6. **Mission completion:** Listen for MISSION_COMPLETED/MISSION_FAILED:
   - Launch MissionCompleteScene with results
   - Clean up mission NPCs
7. **Night Shift special:** When mission police_m07 starts, force DayNightSystem.setTime(0.9)
8. **Objective tracking:** Wire up interactions (catch NPC, reach location, interact object) to MissionManager.updateObjective()

**Acceptance:** All 10 missions playable from start to finish within GameScene. Mission NPCs spawn and despawn correctly.

---

## Prompt 3.10: StationScene Mission Integration

**Modify:** `src/scenes/StationScene.ts`

Add mission-specific interactions inside stations:

1. **Patrol checkpoints:** If patrol mission active and current station is a checkpoint, trigger checkpoint reached on entry
2. **Investigation spots:** For investigate missions, render search spot indicators (pulsing circles) at positions within the station. On action press near a spot, trigger interact_object objective.
3. **Escort NPC:** For escort missions in stations, create the escort NPC that follows the player. When player reaches exit with escort NPC, trigger escort_npc objective.
4. **Evidence collection:** For mission 9 (Underground Network), place collectible evidence indicators at specific positions in each station. On interaction, trigger collect_item objective.

**Acceptance:** Mission objectives trackable inside stations. Patrol checkpoints register. Investigation spots interactive. Evidence collectible.

---

## Phase 3 Summary

| Prompt | Files | Description |
|--------|-------|-------------|
| 3.1 | 1 scene + mods | MainMenuScene — title screen |
| 3.2 | 1 scene + mods | CharacterSelectScene — class picker |
| 3.3 | 1 manager + mods | MissionManager — mission lifecycle |
| 3.4 | 2 scenes + mods | MissionBrief + MissionComplete scenes |
| 3.5 | 2 UI + mods | MissionTracker + RadioDisplay HUD |
| 3.6 | 1 system + 1 entity | PursuitSystem + FareEvader |
| 3.7 | 1 system + 1 entity | PatrolSystem + SuspiciousNPC |
| 3.8 | 1 data file | 10 police mission definitions |
| 3.9 | Modifications | GameScene mission runtime integration |
| 3.10 | Modifications | StationScene mission interactions |
