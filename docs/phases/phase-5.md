# Phase 5: Polish, Audio & Game Feel

## Current State (After Phase 4)
The full Metro Police MVP is functionally complete:
- Main menu, character select, 10 missions, all playable
- Economy: earn money, spend in shop, buy 5 items + 3 skins
- Progression: XP gain, level up (1–10), unlock missions/items/skins
- HUD: mission tracker, radio display, minimap, money display, XP bar, notification toasts
- World: Manhattan with 5 stations, subway travel, 15–20 ambient NPCs, dialogue
- Day/night cycle, collision, physics, pooling all working
- Save/load persists everything

### Existing Files
All Phase 0–4 files (see phase-4.md for complete list).

## Goal
Polish the game to release quality. Add procedural audio (SFX + music), weather effects, scene transitions, pause functionality, settings screen, and performance optimization. After this phase, the game is shippable as a web MVP.

## Tech Stack
Same as Phase 0.

## Coding Standards
Same as Phase 0.

## Deliverables

### 1. SFXGenerator

**`src/audio/SFXGenerator.ts`**

Generates all sound effects procedurally using the Web Audio API.

**Approach:** Each SFX is a function that creates an AudioContext graph (oscillators, noise, filters, envelopes) and plays immediately. Sounds are short (50ms–2s) and CPU-light.

**SFX catalog:**

| Name | Technique | Duration | When played |
|------|-----------|----------|-------------|
| `footstep_concrete` | White noise burst → bandpass filter (800Hz) → fast decay | 50ms | Player walking on sidewalk/road |
| `footstep_tile` | White noise burst → highpass filter (2000Hz) → fast decay | 40ms | Player walking in station |
| `radio_crackle` | White noise → bandpass (1200Hz) → amplitude modulation | 200ms | Radio message starts |
| `radio_beep` | Sine wave (1000Hz) → short envelope | 100ms | Radio message ends |
| `train_arrive` | Low sine sweep (80→200Hz) + white noise → slow crescendo | 2000ms | Train arriving at platform |
| `train_depart` | Reverse of arrive: 200→80Hz + noise → fade | 2000ms | Train leaving platform |
| `train_doors` | Noise burst → bandpass (400Hz) + metallic ring (sine 3000Hz) | 300ms | Train doors open/close |
| `catch_npc` | Rising sine sweep (400→800Hz) + short noise | 200ms | Catching a fare evader |
| `mission_start` | Three ascending tones (C4, E4, G4) | 500ms | Mission begins |
| `mission_complete` | Five ascending tones (C4, E4, G4, C5, E5) + shimmer noise | 1000ms | Mission success |
| `mission_fail` | Two descending tones (G4, C4) | 500ms | Mission failure |
| `levelup` | Arpeggio (C4→E4→G4→C5) + shimmer + sub bass hit | 1500ms | Level up |
| `money_earn` | Coin clink: metallic sine (4000Hz) → fast decay | 100ms | Money received |
| `money_spend` | Lower coin: sine (2000Hz) → fast decay | 100ms | Money spent |
| `ui_click` | Short sine pop (600Hz) → instant decay | 30ms | Button press |
| `ui_hover` | Very short sine (800Hz) → fade | 20ms | Button hover |
| `npc_interact` | Soft chime: sine (500Hz) → medium decay | 150ms | NPC dialogue opens |
| `ambient_crowd` | Layered noise with bandpass modulation | Loop 5s | Looping station ambiance |
| `step_sprint` | Faster, slightly louder footstep variant | 40ms | Player sprinting |
| `alert` | Two-tone alarm (800Hz/1000Hz alternating) | 400ms | Urgent dispatch |

**Implementation:**
- Each SFX is a method: `playFootstepConcrete()`, `playRadioCrackle()`, etc.
- Uses a shared AudioContext (created once, reused)
- Respects AudioManager volume settings (sfxVolume)
- Sounds that loop (ambient_crowd) return a reference to stop them

**Methods:**
- `init(): void` — creates AudioContext (must be called after user gesture for mobile autoplay policy)
- `play(name: string): void` — plays named SFX
- `playLoop(name: string): { stop: () => void }` — starts a looping SFX, returns stop handle
- `setVolume(vol: number): void` — 0–1
- `dispose(): void` — close AudioContext

### 2. MusicGenerator

**`src/audio/MusicGenerator.ts`**

Generates procedural ambient music loops.

**Approach:** Simple musical patterns using oscillators. Not trying to be a full composition — just atmosphere. Each "track" is a set of slowly evolving tones that loop seamlessly.

**Tracks:**

| Name | Style | Tempo | When played |
|------|-------|-------|-------------|
| `menu_theme` | Mellow pad: two detuned sine waves (C3, G3) with slow amplitude LFO | None (drone) | MainMenuScene |
| `street_theme` | Urban ambient: low sine drone (E2) + filtered noise (city hum) + occasional higher tone pings | Slow | Walking overworld |
| `station_theme` | Reverb-heavy: sine pad (A2, E3) + echoing metallic pings (simulating station acoustics) | None | Inside station |
| `chase_theme` | Tense: fast pulsing low tone (C2 at 160BPM gate) + rising filtered noise + higher staccato pattern | 160 BPM | Active pursuit mission |
| `night_theme` | Dark: lower version of street_theme with more noise, slower modulation | Very slow | Night time / Night Shift mission |

**Implementation:**
- Each track is a function that builds an AudioContext graph
- Tracks loop seamlessly (careful envelope timing)
- `crossfadeTo(trackName)` — fades current track out (1s) while fading new track in (1s)
- Chase theme intensity scales with distance to target (closer = louder high tones)

**Methods:**
- `init(): void` — creates AudioContext
- `play(trackName: string): void` — starts track
- `stop(): void` — fades out and stops current track
- `crossfadeTo(trackName: string): void` — smooth transition
- `setVolume(vol: number): void` — 0–1
- `setIntensity(intensity: number): void` — 0–1, modulates chase theme
- `dispose(): void`

### 3. AudioManager Integration

**Modify `src/managers/AudioManager.ts`** — Replace the no-op shell with real implementation:

- `init(scene: Phaser.Scene): void`:
  1. Create SFXGenerator and MusicGenerator instances
  2. Load volume settings from SaveManager
  3. Set up AudioContext resume on first user gesture (tap/click)

- `playSFX(name: string): void` — delegates to SFXGenerator.play()
- `playMusic(name: string): void` — delegates to MusicGenerator.play() or crossfadeTo()
- `stopMusic(): void` — delegates to MusicGenerator.stop()
- `setMusicVolume(vol: number): void` — updates MusicGenerator + saves to settings
- `setSFXVolume(vol: number): void` — updates SFXGenerator + saves to settings

### 4. Audio Triggers

Add audio calls throughout existing code:

| Location | Trigger | Sound |
|----------|---------|-------|
| Player.update() | Each step (every ~0.3s of movement) | footstep_concrete or footstep_tile based on isInStation |
| Player.update() | Sprinting step | step_sprint |
| GameScene.create() | Scene enters | street_theme music |
| StationScene.create() | Scene enters | station_theme music, ambient_crowd loop |
| MainMenuScene.create() | Scene enters | menu_theme music |
| MissionManager.startMission() | Mission starts | mission_start SFX, radio_crackle |
| MissionManager.completeMission() | Mission success | mission_complete SFX |
| MissionManager.failMission() | Mission failed | mission_fail SFX |
| PursuitSystem.startPursuit() | Chase begins | crossfade to chase_theme |
| PursuitSystem.caught() | NPC caught | catch_npc SFX |
| PursuitSystem (active) | Each frame | setIntensity based on distance |
| EconomyManager.earn() | Money received | money_earn SFX |
| EconomyManager.spend() | Money spent | money_spend SFX |
| ProgressionManager.addXP() | Level up | levelup SFX |
| RadioDisplay.showMessage() | Radio dispatch | radio_crackle + radio_beep |
| DialogueSystem.show() | NPC interaction | npc_interact SFX |
| All UI buttons | On press | ui_click SFX |
| DayNightSystem | Night begins | crossfade to night_theme |
| StationRenderer.renderTrainArrival() | Train arrives | train_arrive SFX + train_doors |
| StationRenderer.renderTrainDeparture() | Train departs | train_doors + train_depart SFX |

### 5. WeatherSystem

**`src/systems/WeatherSystem.ts`**

Visual weather effects overlaid on the game world.

**Properties:**
- `currentWeather: 'clear' | 'rain' | 'snow' | 'fog'`
- `particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null`
- `fogOverlay: Phaser.GameObjects.Rectangle | null`

**Weather effects:**

**Rain:**
- Phaser ParticleEmitter with small blue-gray rectangles (2x6px)
- Falling diagonally (slight wind angle)
- 200 particles active, speed 300–500 px/s downward
- Semi-transparent (alpha 0.3–0.5)
- Only on overworld (not inside stations)

**Snow:**
- ParticleEmitter with small white circles (3x3px)
- Falling slowly, slight horizontal drift (sine wave)
- 100 particles, speed 50–100 px/s
- Alpha 0.5–0.8

**Fog:**
- Full-screen semi-transparent white rectangle (alpha 0.15)
- Subtle alpha oscillation (0.1–0.2) for a "breathing" effect
- Reduces visibility slightly

**Clear:**
- No particles, no overlay

**Methods:**
- `init(scene: Phaser.Scene): void`
- `setWeather(weather: 'clear' | 'rain' | 'snow' | 'fog'): void` — transitions to new weather with 2s crossfade
- `update(delta: number): void` — updates particles
- `getWeather(): string`
- `randomizeWeather(): void` — picks random weather (60% clear, 20% rain, 10% snow, 10% fog), called every 5 game-minutes

Weather is purely cosmetic — no gameplay effect in MVP.

### 6. PauseScene

**`src/scenes/PauseScene.ts`** — Phaser.Scene (key: `'PauseScene'`):

Pause overlay that freezes gameplay.

**Trigger:** Pause button in HUD (top-left hamburger icon) or pressing Escape key.

**Visual layout:**
- Semi-transparent dark overlay covering full screen
- "PAUSED" title centered
- Menu options (vertical list of buttons):
  - "RESUME" → close pause, resume GameScene
  - "SHOP" → open ShopScene (if no active mission)
  - "STATS" → open StatsScene
  - "SETTINGS" → open settings panel (inline, not separate scene)
  - "MAIN MENU" → confirmation dialog → return to MainMenuScene (auto-saves)

**Settings panel (inline):**
- Music Volume slider (0–100%)
- SFX Volume slider (0–100%)
- Vibration toggle (on/off)
- Show FPS toggle (on/off)
- All changes saved immediately to PlayerSave.settings

**Pause behavior:**
- `this.scene.pause('GameScene')` freezes all GameScene update() calls
- `this.scene.pause('HUDScene')` freezes HUD updates
- MissionManager timer is also paused (it runs in GameScene update)
- On resume: `this.scene.resume('GameScene')`, `this.scene.resume('HUDScene')`

### 7. Scene Transitions

Add smooth transitions between all scene changes:

**Transition types:**
- **Fade:** Camera fades to black (500ms) → switch scene → fade from black (500ms)
- **Slide:** Current scene slides out left, new scene slides in from right (500ms)

**Where applied:**
| From | To | Transition |
|------|----|-----------|
| BootScene | MainMenuScene | Fade |
| MainMenuScene | CharacterSelectScene | Slide |
| CharacterSelectScene | GameScene | Fade (longer: 1000ms, dramatic entrance) |
| GameScene | StationScene | Fade (quick: 300ms) |
| StationScene | GameScene | Fade (quick: 300ms) |
| GameScene | MissionBriefScene | None (overlay) |
| MissionBriefScene | GameScene | None (overlay closes) |
| GameScene | MissionCompleteScene | Fade (500ms) |
| MissionCompleteScene | GameScene | Fade (500ms) |
| Any | PauseScene | None (overlay) |
| Any | ShopScene | Slide |
| Any | StatsScene | Slide |

**Implementation:** Use Phaser camera fade effects (`this.cameras.main.fadeOut(500)` + `this.cameras.main.once('camerafadeoutcomplete', () => ...)`)

### 8. Screen Shake

Add screen shake for impactful moments:

**`camera.shake(duration, intensity)`**

| Event | Duration | Intensity |
|-------|----------|-----------|
| NPC caught | 100ms | 0.005 |
| Mission failed (time out) | 200ms | 0.01 |
| Train arriving | 300ms | 0.003 (subtle rumble) |

### 9. Performance Optimization

Final optimization pass:

1. **Object pool audit:** Verify NPCManager pool is working (no unbounded object creation). Add logging: total objects created, pool size, active count.

2. **Texture atlas:** If individual textures are causing too many draw calls, batch all small textures into a single atlas using Phaser's texture manager.

3. **Camera culling:** Verify NPCs outside camera view are not being updated. Add distance check in NPCManager.update() — skip NPC.update() for NPCs outside camera bounds + buffer.

4. **FPS counter:** When settings.showFps is true, display FPS counter in top-left corner (Phaser's built-in `scene.game.loop.actualFps` rounded to integer).

5. **Build size check:** Run `npm run build`, verify dist/ is under 2MB. If over: check for accidentally large data files, unused code, or unoptimized Phaser import (use tree-shaking).

6. **Mobile throttle test:** In Chrome DevTools, set CPU throttling to 4x slowdown, verify game still runs at 30+ fps (acceptable mobile floor).

### 10. Touch Control Polish

Final tuning of touch input:

1. **Dead zone:** Joystick ignores movement under 15% of radius (prevents drift from resting thumb)
2. **Sensitivity curve:** Apply a slight exponential curve to joystick distance — small movements are precise, large movements are fast
3. **Action button feedback:** Button scales down 10% on press, springs back on release (100ms tween)
4. **Joystick snap-back:** When released, thumb snaps back to center with a 50ms tween (not instant)
5. **Double-tap sprint:** Detect two taps within 300ms on joystick area → toggle sprint mode (so player doesn't have to hold)
6. **One-hand mode:** All critical controls (joystick + action) reachable with right thumb on a phone held in portrait. Joystick bottom-left, action bottom-right, pause top-right. No required controls in top-left zone.

### 11. HUD Pause Button

Add a pause button to HUDScene:
- Position: top-left corner
- Visual: 16x16 two vertical bars icon (classic pause symbol) in white
- On tap: launch PauseScene

## Files Created in This Phase

| File | Purpose |
|------|---------|
| `src/audio/SFXGenerator.ts` | Procedural sound effects |
| `src/audio/MusicGenerator.ts` | Procedural ambient music |
| `src/systems/WeatherSystem.ts` | Rain/snow/fog visual effects |
| `src/scenes/PauseScene.ts` | Pause overlay with settings |

## Files Modified in This Phase

| File | Change |
|------|--------|
| `src/managers/AudioManager.ts` | Replace no-op shell with real SFX/Music integration |
| `src/scenes/GameScene.ts` | Add audio triggers, weather system init/update, screen shake |
| `src/scenes/StationScene.ts` | Add audio triggers (train sounds, station ambiance) |
| `src/scenes/MainMenuScene.ts` | Add menu music, button SFX |
| `src/scenes/MissionBriefScene.ts` | Add UI click SFX |
| `src/scenes/MissionCompleteScene.ts` | Add success/fail SFX |
| `src/scenes/CharacterSelectScene.ts` | Add UI SFX |
| `src/scenes/ShopScene.ts` | Add purchase SFX, UI SFX |
| `src/scenes/HUDScene.ts` | Add pause button, FPS counter |
| `src/managers/MissionManager.ts` | Add audio triggers for mission events |
| `src/managers/EconomyManager.ts` | Add audio triggers for earn/spend |
| `src/managers/ProgressionManager.ts` | Add audio trigger for level up |
| `src/managers/InputManager.ts` | Polish: dead zone tuning, sensitivity curve, snap-back tween, double-tap sprint |
| `src/ui/RadioDisplay.ts` | Add radio crackle SFX |
| `src/systems/DayNightSystem.ts` | Add night_theme music crossfade |
| `src/config/game-config.ts` | Register PauseScene |
| `src/graphics/StationRenderer.ts` | Add train arrival/departure SFX triggers |
| All scene transitions | Add fade/slide transitions |

## Acceptance Criteria

1. Walking produces footstep sounds (different on street vs station)
2. Music plays on menu, overworld, in stations, during chases — crossfades between them
3. Chase music gets more intense as player gets closer to target
4. All mission events produce appropriate SFX (start, complete, fail)
5. Radio dispatch crackles and beeps on message display
6. Money earn/spend, level up, purchase all have SFX
7. UI buttons produce click sounds on press
8. Volume sliders in settings work (0 = silent, 100 = full volume)
9. Rain particles fall diagonally on overworld, stop inside stations
10. Snow drifts slowly, fog reduces visibility slightly
11. Weather changes randomly, transitions smoothly
12. Pause button freezes game, resume continues exactly where left off
13. Mission timer is frozen while paused
14. Settings changes (volume, vibration, FPS) persist across sessions
15. Scene transitions are smooth fades/slides — no jarring cuts
16. Screen shakes on NPC catch, mission fail, train arrive
17. Touch joystick has proper dead zone — no drift when thumb rests
18. Action button has visual press feedback
19. Sprint toggles on double-tap (not hold)
20. FPS counter shows when enabled in settings
21. Game runs at 60fps on desktop, 30+ fps on 4x CPU throttle
22. Production build is under 2MB
23. No TypeScript errors, no console errors
24. Game is fully playable end-to-end: boot → menu → select police → play all 10 missions → buy items → level up → use shop → pause/resume → everything saves
