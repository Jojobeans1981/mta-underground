# MTA Underground — Implementation Prompt Index

## Pipeline Summary
- **Source:** User-provided game concept (NYC MTA-themed GTA-style 2D game)
- **PRD:** `docs/PRD.md`
- **Phases:** 6 phases (0–5) in `docs/phases/`
- **Total Prompts:** 44 across all phases

## Execution Order

### Phase 0: Project Scaffolding & Core Engine (10 prompts)
File: `docs/prompts/phase-0-prompts.md`

| Prompt | File Target | Description |
|--------|-------------|-------------|
| 0.1 | package.json, tsconfig.json, vite.config.ts, public/index.html | Project config + npm install |
| 0.2 | src/types/game.types.ts, src/types/events.types.ts | All TypeScript interfaces + event constants |
| 0.3 | src/config/constants.ts, balance.ts, game-config.ts | Game constants, XP formula, Phaser config |
| 0.4 | src/graphics/colors.ts | Color palette + hex converter |
| 0.5 | src/graphics/SpriteFactory.ts | Programmatic texture generation |
| 0.6 | src/managers/SaveManager.ts | localStorage persistence |
| 0.7 | src/managers/InputManager.ts | Virtual joystick + keyboard input |
| 0.8 | src/managers/AudioManager.ts | Audio shell (no-op) |
| 0.9 | src/scenes/BootScene.ts, HUDScene.ts, src/main.ts | Boot + HUD + entry point |
| 0.10 | src/managers/__tests__/SaveManager.test.ts | Unit tests |

### Phase 1: World Map & Navigation (10 prompts)
File: `docs/prompts/phase-1-prompts.md`

| Prompt | File Target | Description |
|--------|-------------|-------------|
| 1.1 | src/data/maps/manhattan.ts | Manhattan district data |
| 1.2 | src/managers/MapManager.ts | District/station loading + queries |
| 1.3 | src/graphics/TileRenderer.ts | Overworld map rendering |
| 1.4 | src/graphics/StationRenderer.ts | Station interior + train animations |
| 1.5 | src/entities/Player.ts | Player character with physics |
| 1.6 | src/scenes/GameScene.ts | Main overworld scene |
| 1.7 | src/scenes/StationScene.ts | Station interior scene |
| 1.8 | src/ui/MiniMap.ts | Corner minimap |
| 1.9 | src/systems/DayNightSystem.ts | Day/night tint cycle |
| 1.10 | Multiple (BootScene, HUDScene, main.ts) | Phase 1 integration |

### Phase 2: NPCs & Game World Population (6 prompts)
File: `docs/prompts/phase-2-prompts.md`

| Prompt | File Target | Description |
|--------|-------------|-------------|
| 2.1 | src/entities/Entity.ts | Abstract entity base class |
| 2.2 | src/entities/NPC.ts | NPC with behavior patterns |
| 2.3 | src/entities/Civilian.ts, src/data/npcs.ts | Civilian NPC + NPC definitions |
| 2.4 | src/managers/NPCManager.ts | NPC spawning, pooling, lifecycle |
| 2.5 | src/systems/DialogueSystem.ts | NPC dialogue display |
| 2.6 | Multiple (Player, GameScene, StationScene, BootScene) | Phase 2 integration |

### Phase 3: Metro Police Class & Mission System (10 prompts)
File: `docs/prompts/phase-3-prompts.md`

| Prompt | File Target | Description |
|--------|-------------|-------------|
| 3.1 | src/scenes/MainMenuScene.ts + mods | Title screen |
| 3.2 | src/scenes/CharacterSelectScene.ts + mods | Class selection |
| 3.3 | src/managers/MissionManager.ts + mods | Mission lifecycle |
| 3.4 | src/scenes/MissionBriefScene.ts, MissionCompleteScene.ts | Mission flow UI |
| 3.5 | src/ui/MissionTracker.ts, RadioDisplay.ts | HUD mission components |
| 3.6 | src/systems/PursuitSystem.ts, src/entities/FareEvader.ts | Chase mechanics |
| 3.7 | src/systems/PatrolSystem.ts, src/entities/SuspiciousNPC.ts | Patrol + investigation |
| 3.8 | src/data/missions/police-missions.ts | 10 police mission definitions |
| 3.9 | GameScene modifications | Mission runtime integration |
| 3.10 | StationScene modifications | Station mission interactions |

### Phase 4: Economy, Progression & Shop (7 prompts)
File: `docs/prompts/phase-4-prompts.md`

| Prompt | File Target | Description |
|--------|-------------|-------------|
| 4.1 | src/managers/EconomyManager.ts + mods | Money transactions |
| 4.2 | src/managers/ProgressionManager.ts + mods | XP, levels, items, skins |
| 4.3 | src/scenes/ShopScene.ts + mods | Item/skin store |
| 4.4 | src/scenes/StatsScene.ts + mods | Player statistics |
| 4.5 | src/ui/MoneyDisplay.ts, XPBar.ts, NotificationToast.ts | HUD economy components |
| 4.6 | src/data/items/police-items.ts, src/data/skins.ts | Item + skin definitions |
| 4.7 | Multiple | Reward wiring, item effects, skin rendering |

### Phase 5: Polish, Audio & Game Feel (7 prompts)
File: `docs/prompts/phase-5-prompts.md`

| Prompt | File Target | Description |
|--------|-------------|-------------|
| 5.1 | src/audio/SFXGenerator.ts | 20 procedural sound effects |
| 5.2 | src/audio/MusicGenerator.ts | 5 ambient music tracks |
| 5.3 | src/managers/AudioManager.ts (modify) | Real audio implementation |
| 5.4 | Multiple (all scenes + managers) | Audio trigger hooks |
| 5.5 | src/systems/WeatherSystem.ts + mods | Rain/snow/fog particles |
| 5.6 | src/scenes/PauseScene.ts + mods | Pause overlay + settings |
| 5.7 | Multiple | Transitions, shake, touch polish, FPS, perf |

## Total File Count

| Category | New Files | Modified Files |
|----------|-----------|---------------|
| Phase 0 | 18 | 0 |
| Phase 1 | 9 | 4 |
| Phase 2 | 6 | 4 |
| Phase 3 | 12 | 6 |
| Phase 4 | 9 | 8 |
| Phase 5 | 4 | 15+ |
| **Total** | **58** | **37+** |
