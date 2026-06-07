# MTA Underground — Phase Index

## Pipeline Summary
- **Source:** User-provided game concept (NYC MTA-themed GTA-style game)
- **PRD:** `docs/PRD.md`
- **Phases:** 6 phases (0–5)
- **MVP Target:** Web-only (Capacitor native builds deferred)

## Phase Execution Order

| Phase | Name | New Files | Key Deliverables |
|-------|------|-----------|------------------|
| 0 | Project Scaffolding & Core Engine | 15 files | Vite+Phaser+TS project, InputManager, SaveManager, AudioManager shell, types, constants, HUD shell |
| 1 | World Map & Navigation | 8 files | Manhattan map data, TileRenderer, StationRenderer, Player entity, camera, minimap, day/night, subway travel |
| 2 | NPCs & Game World Population | 7 files | Entity base, NPC class, Civilian, NPCManager, DialogueSystem, NPC data, ambient population |
| 3 | Metro Police Class & Mission System | 12 files | CharacterSelect, MainMenu, MissionManager, PursuitSystem, PatrolSystem, FareEvader, SuspiciousNPC, RadioDisplay, MissionTracker, 10 missions, MissionBrief/Complete scenes |
| 4 | Economy, Progression & Shop | 8 files | EconomyManager, ProgressionManager, ShopScene, StatsScene, MoneyDisplay, XPBar, NotificationToast, items/skins data |
| 5 | Polish, Audio & Game Feel | 7 files | SFXGenerator, MusicGenerator, WeatherSystem, PauseScene, scene transitions, settings, performance pass |

## Cumulative State After Each Phase

| After Phase | Playable State |
|-------------|---------------|
| 0 | Empty screen with joystick, save/load works, builds and tests pass |
| 1 | Walk around Manhattan, enter stations, ride subway between 5 stops |
| 2 | World populated with NPCs, can interact and see dialogue |
| 3 | Full Metro Police gameplay — 10 missions playable start to finish |
| 4 | Money/XP/levels, shop, items, skins, stats — full progression loop |
| 5 | Audio, weather, polish — release-ready MVP |
