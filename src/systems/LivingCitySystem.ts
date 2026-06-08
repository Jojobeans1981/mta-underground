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

import { MAX_NPCS_VISIBLE } from '@/config/constants';

const ASSIGN_INTERVAL = 0.4;   // seconds between persona-assignment sweeps
const BUBBLE_INTERVAL = 1.4;   // seconds between ambient chatter bubbles
const BUBBLE_RANGE = 150;      // only NPCs this close to the player chatter
const REACT_RANGE = 46;        // police proximity that makes civilians react
const CONVO_INTERVAL = 3.2;    // seconds between attempts to start a chat
const CONVO_PAIR_RANGE = 26;   // how close two agents must be to chat
const TAG_INTERVAL = 0.6;      // seconds between name-tag refreshes
const TAG_RANGE = 120;         // agents this close to the player get a name tag
const MAX_TAGS = 4;            // cap on simultaneous name tags

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
  private convoTimer = CONVO_INTERVAL;
  private tagTimer = 0;

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
      this.adjustDensity(ctx);
      this.assignPersonas(ctx);
    }

    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = BUBBLE_INTERVAL;
      this.emitChatter(ctx);
    }

    this.convoTimer -= dt;
    if (this.convoTimer <= 0) {
      this.convoTimer = CONVO_INTERVAL;
      this.tryStartConversation(ctx);
    }

    this.tagTimer -= dt;
    if (this.tagTimer <= 0) {
      this.tagTimer = TAG_INTERVAL;
      this.refreshNameTags(ctx);
    }
  }

  // ===== Rush-hour crowd density =====

  /** Swell the crowd at rush hour, thin it out at night. */
  private adjustDensity(ctx: CityContext): void {
    const phase = this.phaseOf(ctx.timeOfDay);
    let mul: number;
    switch (phase) {
      case 'morning': mul = 1.4; break;
      case 'evening': mul = 1.35; break;
      case 'midday':  mul = 1.0; break;
      case 'dawn':    mul = 0.6; break;
      case 'night':   mul = 0.5; break;
      default:        mul = 1.0;
    }
    this.npcManager.setMaxActive(MAX_NPCS_VISIBLE * mul);
  }

  // ===== NPC-to-NPC conversations =====

  /** Occasionally pair two nearby idle agents into a brief chat. */
  private tryStartConversation(ctx: CityContext): void {
    const avail = this.npcManager.getActiveNPCs().filter((n) =>
      n.isActive && n.hasPersona() && !n.boarded && !n.inConversation &&
      n.behaviorPattern !== 'goal_seek' && !n.hasBubble() &&
      Math.hypot(n.x - ctx.playerX, n.y - ctx.playerY) < BUBBLE_RANGE
    );
    if (avail.length < 2) return;

    // Find a close pair
    for (let i = 0; i < avail.length; i++) {
      for (let j = i + 1; j < avail.length; j++) {
        const a = avail[i], b = avail[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) <= CONVO_PAIR_RANGE) {
          this.runConversation(a, b);
          return;
        }
      }
    }
  }

  private runConversation(a: NPC, b: NPC): void {
    const exchange = DialogueGenerator.socialExchange();
    a.startConversation(4.0, b.x);
    b.startConversation(4.0, a.x);
    a.showBubble(exchange.opener);

    // B replies a beat later, if both are still chatting
    this.scene.time.delayedCall(1200, () => {
      if (b.isActive && b.inConversation) {
        b.showBubble(exchange.response);
      }
    });
  }

  // ===== Recognizable named residents =====

  /** Keep name tags on the few nearest agents so the crowd has faces. */
  private refreshNameTags(ctx: CityContext): void {
    const all = this.npcManager.getActiveNPCs();
    const near = all
      .filter((n) => n.isActive && n.hasPersona() && !n.boarded &&
        Math.hypot(n.x - ctx.playerX, n.y - ctx.playerY) < TAG_RANGE)
      .sort((p, q) =>
        Math.hypot(p.x - ctx.playerX, p.y - ctx.playerY) -
        Math.hypot(q.x - ctx.playerX, q.y - ctx.playerY))
      .slice(0, MAX_TAGS);

    const tagged = new Set(near);
    for (const npc of all) {
      if (tagged.has(npc)) {
        npc.showNameTag(npc.persona!.name);
      } else if (npc.hasNameTag()) {
        npc.hideNameTag();
      }
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
