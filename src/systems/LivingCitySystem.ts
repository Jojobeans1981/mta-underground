import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { NPCManager } from '@/managers/NPCManager';
import { Station } from '@/types/game.types';
import {
  AgentMood, AgentIntent, makePersona, MOOD_LABEL,
} from '@/data/personas';
import { DialogueGenerator, DialogueContext, TimePhase, WeatherKind } from '@/systems/DialogueGenerator';

export interface CityContext {
  playerX: number;
  playerY: number;
  playerIsPolice: boolean;
  timeOfDay: number;          // 0..1 from DayNightSystem
  weather: WeatherKind;
  sirenActive: boolean;       // a pursuit / chase is happening nearby
}

const ASSIGN_INTERVAL = 0.4;   // seconds between persona-assignment sweeps
const BUBBLE_INTERVAL = 1.4;   // seconds between ambient chatter bubbles
const BUBBLE_RANGE = 150;      // only NPCs this close to the player chatter
const REACT_RANGE = 46;        // police proximity that makes civilians react

/**
 * The "Living City" — a generative-agent layer over the existing NPC crowd.
 *
 * Each street NPC is promoted to an agent with a persona, a mood, and an
 * intent driven by the in-game clock: at the morning rush they stream toward
 * stations and board trains; midday they run errands; evening they head home;
 * at night the crowd thins to night-owls. They chatter with context-aware,
 * procedurally generated dialogue and react to the player and to events.
 */
export class LivingCitySystem {
  private scene: Phaser.Scene;
  private npcManager: NPCManager;
  private entrances: { x: number; y: number }[] = [];
  private assignTimer = 0;
  private bubbleTimer = 0;

  constructor(scene: Phaser.Scene, npcManager: NPCManager) {
    this.scene = scene;
    this.npcManager = npcManager;
  }

  init(stations: Station[]): void {
    this.entrances = [];
    for (const s of stations) {
      for (const e of s.entrances) {
        this.entrances.push({ x: e.x, y: e.y });
      }
    }
  }

  update(delta: number, ctx: CityContext): void {
    const dt = delta / 1000;

    this.assignTimer -= dt;
    if (this.assignTimer <= 0) {
      this.assignTimer = ASSIGN_INTERVAL;
      this.assignPersonas(ctx);
    }

    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = BUBBLE_INTERVAL;
      this.emitChatter(ctx);
    }
  }

  // ===== Persona assignment & intent =====

  private assignPersonas(ctx: CityContext): void {
    const phase = this.phaseOf(ctx.timeOfDay);
    for (const npc of this.npcManager.getActiveNPCs()) {
      if (!npc.isActive || npc.npcType !== 'civilian') continue;
      if (npc.hasPersona()) continue;

      const persona = makePersona();
      const intent = this.rollIntent(phase, persona.occupation);
      const mood = this.deriveMood(persona.trait, intent, ctx);
      const speedMul = this.speedFor(intent, mood);

      npc.assignAgent(persona, mood, intent, speedMul);

      // Commuters head for the nearest station and board a train
      if ((intent === 'commute_work' || intent === 'commute_home') && this.entrances.length > 0
          && Math.random() < 0.7) {
        const target = this.nearestEntrance(npc.x, npc.y);
        if (target) {
          npc.setGoal(target.x, target.y, () => this.boardTrain(npc));
        }
      }
    }
  }

  private boardTrain(npc: NPC): void {
    if (!npc.isActive) return;
    npc.boarded = true;
    npc.showBubble('🚇');
    // Descend into the station — shrink + fade, then recycle
    this.scene.tweens.add({
      targets: npc,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => {
        if (npc.isActive) this.npcManager.despawn(npc);
      },
    });
  }

  // ===== Ambient chatter & reactions =====

  private emitChatter(ctx: CityContext): void {
    const candidates = this.npcManager.getActiveNPCs().filter((n) =>
      n.isActive && n.hasPersona() && !n.boarded && !n.hasBubble() &&
      Math.hypot(n.x - ctx.playerX, n.y - ctx.playerY) < BUBBLE_RANGE
    );
    if (candidates.length === 0) return;

    // Prefer NPCs that have something to react to (police nearby / siren)
    const npc = candidates[Math.floor(Math.random() * candidates.length)];
    const dist = Math.hypot(npc.x - ctx.playerX, npc.y - ctx.playerY);

    const dctx = this.buildDialogueContext(npc, ctx, {
      reactToPlayer: ctx.playerIsPolice && dist < REACT_RANGE && Math.random() < 0.6,
      reactToSiren: ctx.sirenActive && Math.random() < 0.5,
    });
    npc.showBubble(DialogueGenerator.generate(dctx));
  }

  /** Build a full line + persona label for an explicit player interaction. */
  talkTo(npc: NPC, ctx: CityContext): { name: string; line: string; moodLabel: string } {
    // Ensure the NPC has been promoted to an agent
    if (!npc.hasPersona()) {
      const phase = this.phaseOf(ctx.timeOfDay);
      const persona = makePersona();
      const intent = this.rollIntent(phase, persona.occupation);
      const mood = this.deriveMood(persona.trait, intent, ctx);
      npc.assignAgent(persona, mood, intent, this.speedFor(intent, mood));
    }
    const dctx = this.buildDialogueContext(npc, ctx, {
      reactToPlayer: ctx.playerIsPolice && Math.random() < 0.5,
    });
    const persona = npc.persona!;
    return {
      name: `${persona.name} · ${persona.occupation}`,
      line: DialogueGenerator.generate(dctx),
      moodLabel: MOOD_LABEL[npc.mood],
    };
  }

  private buildDialogueContext(
    npc: NPC, ctx: CityContext,
    flags: { reactToPlayer?: boolean; reactToSiren?: boolean; reactToGraffiti?: boolean }
  ): DialogueContext {
    return {
      persona: npc.persona!,
      mood: npc.mood,
      intent: npc.intent,
      timePhase: this.phaseOf(ctx.timeOfDay),
      weather: ctx.weather,
      playerIsPolice: ctx.playerIsPolice,
      ...flags,
    };
  }

  // ===== Helpers =====

  private phaseOf(timeOfDay: number): TimePhase {
    if (timeOfDay < 0.18) return 'night';
    if (timeOfDay < 0.28) return 'dawn';
    if (timeOfDay < 0.42) return 'morning';
    if (timeOfDay < 0.60) return 'midday';
    if (timeOfDay < 0.80) return 'evening';
    return 'night';
  }

  private rollIntent(phase: TimePhase, occupation: string): AgentIntent {
    const r = Math.random();
    if (occupation === 'tourist' || occupation === 'visitor' || occupation === 'out-of-towner') {
      // Tourists mostly sightsee
      return r < 0.7 ? 'leisure' : 'errand';
    }
    switch (phase) {
      case 'morning':
        return r < 0.7 ? 'commute_work' : r < 0.9 ? 'errand' : 'leisure';
      case 'dawn':
        return r < 0.5 ? 'commute_work' : r < 0.8 ? 'idle' : 'leisure';
      case 'midday':
        return r < 0.5 ? 'errand' : r < 0.8 ? 'leisure' : 'idle';
      case 'evening':
        return r < 0.65 ? 'commute_home' : r < 0.85 ? 'errand' : 'leisure';
      case 'night':
        return r < 0.45 ? 'nightlife' : r < 0.75 ? 'commute_home' : 'idle';
      default:
        return 'idle';
    }
  }

  private deriveMood(trait: string, intent: AgentIntent, ctx: CityContext): AgentMood {
    const rushing = intent === 'commute_work' || intent === 'commute_home';
    const badWeather = ctx.weather !== 'clear';
    const night = ctx.timeOfDay > 0.80 || ctx.timeOfDay < 0.18;

    switch (trait) {
      case 'anxious':
        return rushing ? 'stressed' : 'nervous';
      case 'grumpy':
        return badWeather ? 'annoyed' : 'annoyed';
      case 'weary':
        return night ? 'tired' : 'tired';
      case 'cheerful':
        return badWeather ? 'content' : 'cheerful';
      case 'chatty':
        return 'cheerful';
      case 'chill':
      default:
        if (badWeather && rushing) return 'stressed';
        if (night) return 'tired';
        return 'content';
    }
  }

  private speedFor(intent: AgentIntent, mood: AgentMood): number {
    let mul = 1.0;
    if (intent === 'commute_work' || intent === 'commute_home') mul = 1.3;
    if (intent === 'leisure' || intent === 'idle') mul = 0.85;
    if (mood === 'stressed') mul += 0.15;
    if (mood === 'tired') mul -= 0.15;
    return mul;
  }

  private nearestEntrance(x: number, y: number): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestD = Infinity;
    for (const e of this.entrances) {
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }
}
