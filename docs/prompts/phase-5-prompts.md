# Phase 5 — Implementation Prompts

## Prompt 5.1: SFXGenerator

**Create:** `src/audio/SFXGenerator.ts`

Procedural sound effects using Web Audio API. See phase-5.md for the full SFX catalog (20 sounds).

**Export `class SFXGenerator`:**

**Properties:**
- `private ctx: AudioContext | null` = null
- `private volume: number` = 0.8
- `private gainNode: GainNode | null` = null

**Methods:**

`init(): void`:
- Create AudioContext (with webkit fallback for older mobile: `new (window.AudioContext || (window as any).webkitAudioContext)()`)
- Create master gain node, connect to destination

`play(name: string): void`:
- Switch on name, call the appropriate generator method
- Each generator creates oscillators/noise/filters, connects to gainNode, starts, and auto-stops

**Generator methods (implement each):**
- `playFootstepConcrete()`: white noise burst (50ms) → bandpass 800Hz → fast exponential decay
- `playFootstepTile()`: white noise burst (40ms) → highpass 2000Hz → fast decay
- `playStepSprint()`: same as concrete but louder, 40ms
- `playRadioCrackle()`: white noise (200ms) → bandpass 1200Hz → amplitude modulation via LFO
- `playRadioBeep()`: sine 1000Hz (100ms) → short linear ramp to 0
- `playTrainArrive()`: sine sweep 80→200Hz over 2000ms + white noise crescendo
- `playTrainDepart()`: sine sweep 200→80Hz over 2000ms + noise fade
- `playTrainDoors()`: noise burst (150ms) bandpass 400Hz + sine 3000Hz ring (150ms)
- `playCatchNPC()`: sine sweep 400→800Hz (200ms) + short noise
- `playMissionStart()`: three tones C4(262Hz), E4(330Hz), G4(392Hz) each 150ms
- `playMissionComplete()`: five ascending tones C4→E4→G4→C5(523Hz)→E5(659Hz) each 180ms + shimmer noise
- `playMissionFail()`: two descending tones G4(392Hz)→C4(262Hz) each 250ms
- `playLevelUp()`: arpeggio C4→E4→G4→C5 (100ms each) + shimmer + sub bass hit (50Hz, 200ms)
- `playMoneyEarn()`: sine 4000Hz (100ms) fast decay (metallic clink)
- `playMoneySpend()`: sine 2000Hz (100ms) fast decay
- `playUIClick()`: sine 600Hz (30ms) instant decay
- `playUIHover()`: sine 800Hz (20ms) fade
- `playNPCInteract()`: sine 500Hz (150ms) medium decay (soft chime)
- `playAlert()`: alternating 800Hz/1000Hz (200ms each, 2 cycles)

`playLoop(name: string): { stop: () => void }`:
- For 'ambient_crowd': layered noise with bandpass modulation, 5s loop. Return stop handle.

`setVolume(vol: number): void`:
- `this.volume = vol`
- Update gainNode gain value

`dispose(): void`:
- Close AudioContext

**White noise helper:**
```typescript
private createNoiseBuffer(duration: number): AudioBuffer {
  const sampleRate = this.ctx!.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = this.ctx!.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}
```

**Acceptance:** File compiles. Each SFX method produces audible sound when called with a valid AudioContext. Sounds are short and distinct.

---

## Prompt 5.2: MusicGenerator

**Create:** `src/audio/MusicGenerator.ts`

Procedural ambient music loops. See phase-5.md for 5 tracks.

**Export `class MusicGenerator`:**

**Properties:**
- `private ctx: AudioContext | null` = null
- `private volume: number` = 0.5
- `private masterGain: GainNode | null` = null
- `private currentTrack: string | null` = null
- `private currentNodes: AudioNode[]` = [] (for cleanup)
- `private intensity: number` = 0.5

**Methods:**

`init(): void`: create AudioContext, master gain

`play(trackName: string): void`:
- If same track already playing, return
- Stop current track
- Switch on trackName, call generator

`stop(): void`:
- Fade master gain to 0 over 500ms
- After fade: disconnect and clean up all currentNodes
- currentTrack = null

`crossfadeTo(trackName: string): void`:
- Fade out current (1s) while starting new track faded in (1s)

`setVolume(vol: number): void`
`setIntensity(intensity: number): void` — 0–1, modulates chase theme

**Track generators:**

`private playMenuTheme()`:
- Two detuned oscillators: sine C3 (131Hz) and sine G3 (196Hz)
- Slow amplitude LFO (0.2Hz) on both
- Very quiet (gain 0.15)
- Loops by not stopping — drones continuously

`private playStreetTheme()`:
- Low sine drone E2 (82Hz), gain 0.1
- Filtered noise (bandpass 400Hz, gain 0.05) for city hum
- Occasional higher ping: sine at random pitch (400–800Hz), very short (50ms), every 3–5s via setInterval

`private playStationTheme()`:
- Sine pad: A2 (110Hz) + E3 (165Hz), gain 0.08
- "Echo" effect: delayed copies of a short sine ping (delay 0.3s, 0.6s) with decreasing gain

`private playChaseTheme()`:
- Pulsing low tone: C2 (65Hz), gated at 160 BPM (on 100ms, off 275ms repeating)
- Rising filtered noise: highpass with frequency modulated by `this.intensity` (higher intensity = higher cutoff = more tense)
- Higher staccato: short sine pings at eighth-note intervals (187ms)

`private playNightTheme()`:
- Same as street theme but with lower frequency noise (bandpass 200Hz), slower LFO, and slight detuning for unease

`dispose(): void`: stop and close

**Acceptance:** Each track produces distinct ambient audio. Crossfade transitions smoothly. Chase theme intensity adjustable.

---

## Prompt 5.3: AudioManager Real Implementation

**Modify:** `src/managers/AudioManager.ts`

Replace the no-op shell with real implementation:

**Imports:** SFXGenerator, MusicGenerator from `'@/audio/'`

**Properties:** Add sfxGen (SFXGenerator), musicGen (MusicGenerator)

**init(scene):**
1. Create SFXGenerator and MusicGenerator
2. Set up "resume on user gesture" pattern:
   ```typescript
   const resumeAudio = () => {
     this.sfxGen.init();
     this.musicGen.init();
     scene.input.off('pointerdown', resumeAudio);
   };
   scene.input.on('pointerdown', resumeAudio);
   ```
3. Load volume from SaveManager settings

**playSFX(name):** `this.sfxGen?.play(name)`
**playMusic(name):** `this.musicGen?.play(name)` or crossfadeTo
**stopMusic():** `this.musicGen?.stop()`
**setMusicVolume(vol):** update musicGen + save
**setSFXVolume(vol):** update sfxGen + save

**Acceptance:** AudioManager delegates to real generators. Audio context resumes on first tap.

---

## Prompt 5.4: Audio Triggers Integration

**Modify multiple files** to add audio calls. See phase-5.md for the full trigger table.

### GameScene
- create(): `audioManager.playMusic('street_theme')`
- Player footstep: every ~0.3s of movement, play 'footstep_concrete' (or 'footstep_tile' if in station)
- On night: crossfade to 'night_theme'
- On pursuit start: crossfade to 'chase_theme'
- On pursuit end: crossfade back to street/station theme

### StationScene
- create(): `audioManager.playMusic('station_theme')`

### MainMenuScene
- create(): `audioManager.playMusic('menu_theme')`

### MissionManager
- startMission: play 'mission_start'
- completeMission: play 'mission_complete'
- failMission: play 'mission_fail'

### PursuitSystem
- startPursuit: play 'alert'
- caught: play 'catch_npc'
- update: `audioManager.musicGen.setIntensity(1 - distance/300)` (clamped 0-1)

### EconomyManager
- earn: play 'money_earn'
- spend: play 'money_spend'

### ProgressionManager
- level up: play 'levelup'

### RadioDisplay
- showMessage: play 'radio_crackle' at start, 'radio_beep' at end

### DialogueSystem
- show: play 'npc_interact'

### All UI buttons (across all scenes)
- On press: play 'ui_click'

### StationRenderer
- renderTrainArrival: play 'train_arrive', then 'train_doors'
- renderTrainDeparture: play 'train_doors', then 'train_depart'

**Acceptance:** Every gameplay moment has appropriate audio. Music transitions between scenes. Chase music intensifies near target.

---

## Prompt 5.5: WeatherSystem

**Create:** `src/systems/WeatherSystem.ts`

See phase-5.md for complete spec.

**Properties:** currentWeather, particle emitter, fog overlay, scene, changeTimer

**Methods:**
- init(scene): store scene, start with 'clear'
- setWeather(weather): transition particles/fog, 2s crossfade
- update(delta): update particles. Every 5 game-minutes (50 real seconds at 10min cycle), randomize weather (60% clear, 20% rain, 10% snow, 10% fog)
- Rain: 200 small blue-gray rect particles falling diagonally, alpha 0.3–0.5
- Snow: 100 white circle particles drifting slowly, alpha 0.5–0.8
- Fog: full-screen white rect alpha 0.15, oscillating 0.1–0.2
- Particles only on overworld (disable in stations)

**Modify `src/scenes/GameScene.ts`:** Create WeatherSystem in create(), call update(delta), hide when entering station.

**Acceptance:** Weather changes randomly. Rain, snow, fog all visually distinct. No frame drops.

---

## Prompt 5.6: PauseScene

**Create:** `src/scenes/PauseScene.ts`

Scene key: `'PauseScene'`. See phase-5.md.

- Semi-transparent dark overlay
- "PAUSED" title
- Buttons: RESUME, SHOP (if no mission), STATS, SETTINGS, MAIN MENU
- Settings panel (inline): Music/SFX volume sliders, Vibration toggle, FPS toggle
- Volume sliders: horizontal bars, draggable thumb, 0–100%
- Pause freezes GameScene + HUDScene: `this.scene.pause('GameScene')`, `this.scene.pause('HUDScene')`
- Resume: `this.scene.resume('GameScene')`, `this.scene.resume('HUDScene')`, stop PauseScene
- Main Menu: confirmation dialog, then save and go to MainMenuScene

**Modify `src/scenes/HUDScene.ts`:** Add pause button (top-left, two vertical bars icon). On tap: launch PauseScene.
**Modify `src/main.ts`:** Add PauseScene.

**Acceptance:** Pause freezes game completely. Resume continues exactly. Settings changes persist. Volume sliders work.

---

## Prompt 5.7: Polish Pass

**Modify multiple files for final polish:**

### Scene Transitions
Add camera fade effects between all scene changes as specified in phase-5.md:
- Fade for most transitions (300–1000ms)
- No transition for overlays (pause, mission brief)
- Use `camera.fadeOut(duration)` + `camera.once('camerafadeoutcomplete', callback)` + `camera.fadeIn(duration)`

### Screen Shake
- GameScene: on NPC caught → `camera.shake(100, 0.005)`
- GameScene: on mission failed → `camera.shake(200, 0.01)`
- StationScene: on train arrive → `camera.shake(300, 0.003)`

### Touch Control Polish (InputManager)
- Dead zone: 15% of radius (already implemented in 0.7, verify)
- Sensitivity curve: `const curved = Math.pow(normalizedDist, 1.3)` — small moves precise, large moves fast
- Action button: scale tween on press (0.9 for 100ms, back to 1.0)
- Joystick snap-back: tween thumb to center over 50ms on release
- Double-tap sprint: detect two taps within 300ms → toggle sprint mode

### FPS Counter
- In HUDScene: if settings.showFps, show `Math.round(scene.game.loop.actualFps)` text in top-left corner, updated every 500ms

### Performance Audit
- Verify NPC pool works: log `npcManager.getActiveCount()` + pool size in debug mode
- Verify camera culling: NPCs outside camera bounds skip update
- Run `npm run build`: confirm dist/ under 2MB
- Test on Chrome DevTools 4x CPU throttle: verify 30+ fps

**Acceptance:**
1. All transitions smooth
2. Screen shakes feel impactful but not disorienting
3. Touch controls refined with no drift
4. FPS counter toggleable
5. Build under 2MB
6. 30+ fps on 4x throttle
7. Full game playable end-to-end: menu → select → 10 missions → shop → level up → pause → everything saves

---

## Phase 5 Summary

| Prompt | Files | Description |
|--------|-------|-------------|
| 5.1 | 1 audio file | SFXGenerator — 20 procedural sound effects |
| 5.2 | 1 audio file | MusicGenerator — 5 ambient music tracks |
| 5.3 | Modification | AudioManager — real implementation replacing shell |
| 5.4 | Modifications (many) | Audio trigger hooks across all game files |
| 5.5 | 1 system + mods | WeatherSystem — rain/snow/fog particles |
| 5.6 | 1 scene + mods | PauseScene + HUD pause button |
| 5.7 | Modifications (many) | Transitions, screen shake, touch polish, FPS, perf audit |
