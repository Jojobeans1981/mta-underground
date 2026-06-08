import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { NPCManager } from '@/managers/NPCManager';
import { District } from '@/types/game.types';
import {
  AgentMood, AgentIntent, MOOD_LABEL,
  Needs, NeedKind, AmenityKind, NEED_TO_AMENITY,
  lowestNeed, moodFromNeeds,
} from '@/data/personas';
import { DialogueGenerator, DialogueContext, TimePhase, WeatherKind } from '@/systems/DialogueGenerator';
import { ResidentRegistry } from '@/systems/ResidentRegistry';
import { MAX_NPCS_VISIBLE } from '@/config/constants';

export interface CityContext {
  playerX: number;
  playerY: number;
  playerIsPolice: boolean;
  timeOfDay: number;          // 0..1 from DayNightSystem
  weather: WeatherKind;
  sirenActive: boolean;       // a pursuit / chase is happening nearby
}

interface Amenity { kind: AmenityKind; x: number; y: number; }

const ASSIGN_INTERVAL = 0.4;   // seconds between sim sweeps
const BUBBLE_INTERVAL = 1.4;   // seconds between ambient chatter bubbles
const BUBBLE_RANGE = 150;      // only NPCs this close to the player chatter
const REACT_RANGE = 46;        // police proximity that makes civilians react
const CONVO_INTERVAL = 3.2;    // seconds between attempts to start a chat
const CONVO_PAIR_RANGE = 26;   // how close two agents must be to chat
const TAG_INTERVAL = 0.6;      // seconds between name-tag refreshes
const TAG_RANGE = 120;         // agents this close to the player get a name tag
const MAX_TAGS = 4;            // cap on simultaneous name tags
const WITNESS_RANGE = 130;     // how close a chase must be to be witnessed

// Per-second need decay (scaled by the sweep interval). Tuned so a need slides
// into "urgent" territory over a couple of in-game minutes.
const DECAY: Needs = { hunger: 0.9, energy: 0.6, social: 0.8, fun: 0.7 };

/**
 * The "Living City" — a generative-agent + Sims-style simulation over the
 * street crowd.
 *
 * Each NPC borrows a persistent Resident (persona + memory of the player) and
 * runs a needs model (hunger / energy / social / fun) that decays over time and
 * drives autonomous behavior: hungry agents walk to a food cart, tired ones
 * rest, bored ones head to a park. The in-game clock still drives the commute
 * (rush-hour crowds stream into stations and board trains), bad weather sends
 * people scrambling for cover, and a nearby chase turns bystanders into
 * witnesses the police can question. All dialogue is generated client-side.
 */
export class LivingCitySystem {
  private scene: Phaser.Scene;
  private npcManager: NPCManager;
  private registry = new ResidentRegistry();
  private entrances: { x: number; y: number }[] = [];
  private amenities: Amenity[] = [];
  private assignTimer = 0;
  private bubbleTimer = 0;
  private convoTimer = CONVO_INTERVAL;
  private tagTimer = 0;

  constructor(scene: Phaser.Scene, npcManager: NPCManager) {
    this.scene = scene;
    this.npcManager = npcManager;
  }

  init(district: District): void {
    this.entrances = [];
    this.amenities = [];

    for (const s of district.stations) {
      for (const e of s.entrances) {
        this.entrances.push({ x: e.x, y: e.y });
        this.amenities.push({ kind: 'shelter', x: e.x, y: e.y });
      }
    }

    // Parks / landmarks become fun + social + rest spots
    for (const lm of district.landmarks) {
      const p = lm.position;
      this.amenities.push({ kind: 'fun', x: p.x, y: p.y });
      this.amenities.push({ kind: 'social', x: p.x, y: p.y });
      this.amenities.push({ kind: 'rest', x: p.x, y: p.y });
    }

    // Scatter food carts across the map — and render them so vendors are visible
    this.spawnFoodCarts(district, 7);
  }

  update(delta: number, ctx: CityContext): void {
    const dt = delta / 1000;

    this.assignTimer -= dt;
    if (this.assignTimer <= 0) {
      this.assignTimer = ASSIGN_INTERVAL;
      this.adjustDensity(ctx);
      this.tickNeeds(ASSIGN_INTERVAL, ctx);
      this.assignPersonas(ctx);
      this.driveBehaviors(ctx);
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

  // ===== Needs simulation =====

  private tickNeeds(seconds: number, ctx: CityContext): void {
    const badWeather = ctx.weather === 'rain' || ctx.weather === 'snow';
    for (const npc of this.npcManager.getActiveNPCs()) {
      if (!npc.isActive || !npc.resident) continue;
      const n = npc.needs;
      n.hunger = clamp01to100(n.hunger - DECAY.hunger * seconds);
      n.energy = clamp01to100(n.energy - DECAY.energy * seconds * (badWeather ? 1.4 : 1));
      n.fun = clamp01to100(n.fun - DECAY.fun * seconds * (badWeather ? 1.3 : 1));
      // Social slowly recovers while chatting, decays otherwise
      n.social = clamp01to100(n.social + (npc.inConversation ? 6 * seconds : -DECAY.social * seconds));
      // Mood follows the needs once an agent has a needs model
      npc.mood = moodFromNeeds(n);
    }
  }

  // ===== Persona assignment =====

  private assignPersonas(ctx: CityContext): void {
    const phase = this.phaseOf(ctx.timeOfDay);
    for (const npc of this.npcManager.getActiveNPCs()) {
      if (!npc.isActive || npc.npcType !== 'civilian') continue;
      if (npc.hasPersona()) continue;

      // Borrow a persistent resident (recurring face + remembered needs)
      const resident = this.registry.acquire();
      npc.bindResident(resident);
      npc.onAgentRelease = (n) => {
        if (n.resident) this.registry.release(n.resident, n.needs);
      };

      const intent = this.rollIntent(phase, resident.persona.occupation);
      const mood = moodFromNeeds(npc.needs);
      npc.assignAgent(resident.persona, mood, intent, this.speedFor(intent, mood));

      // Commuters head for the nearest station and board a train
      if ((intent === 'commute_work' || intent === 'commute_home') && this.entrances.length > 0
          && Math.random() < 0.7) {
        const target = this.nearestEntrance(npc.x, npc.y);
        if (target) npc.setGoal(target.x, target.y, () => this.boardTrain(npc));
      }
    }
  }

  // ===== Autonomous behavior: needs, weather, errands =====

  private driveBehaviors(ctx: CityContext): void {
    const badWeather = ctx.weather === 'rain' || ctx.weather === 'snow';
    for (const npc of this.npcManager.getActiveNPCs()) {
      if (!npc.isActive || !npc.resident) continue;
      // Only redirect agents that are free (not commuting / chatting / boarding)
      if (npc.behaviorPattern === 'goal_seek' || npc.inConversation || npc.boarded) continue;

      // 1) Take cover in bad weather (occasionally)
      if (badWeather && Math.random() < 0.25) {
        const shelter = this.nearestAmenity('shelter', npc.x, npc.y);
        if (shelter) {
          npc.showBubble(DialogueGenerator.generate(this.dctx(npc, ctx, {})));
          npc.setGoal(shelter.x, shelter.y, () => {
            npc.needs.energy = clamp01to100(npc.needs.energy + 8);
            npc.startConversation(1.5); // wait it out briefly
          });
          continue;
        }
      }

      // 2) Satisfy the most urgent need at the matching amenity
      const low = lowestNeed(npc.needs, 32);
      if (low && Math.random() < 0.5) {
        const kind = NEED_TO_AMENITY[low.kind];
        const spot = this.nearestAmenity(kind, npc.x, npc.y);
        if (spot) {
          npc.showBubble(DialogueGenerator.needSeekLine(low.kind));
          const needKind = low.kind;
          npc.setGoal(spot.x, spot.y, () => this.useAmenity(npc, needKind));
        }
      }
    }
  }

  private useAmenity(npc: NPC, need: NeedKind): void {
    if (!npc.isActive) return;
    npc.needs[need] = clamp01to100(npc.needs[need] + 55);
    npc.startConversation(1.8); // linger at the spot
    this.scene.time.delayedCall(500, () => {
      if (npc.isActive) npc.showBubble(DialogueGenerator.needSatisfiedLine(need));
    });
  }

  private boardTrain(npc: NPC): void {
    if (!npc.isActive) return;
    npc.boarded = true;
    npc.showBubble('🚇');
    this.scene.tweens.add({
      targets: npc,
      alpha: 0,
      duration: 350,
      ease: 'Power2',
      onComplete: () => { if (npc.isActive) this.npcManager.despawn(npc); },
    });
  }

  // ===== Ambient chatter, reactions, witnesses =====

  private emitChatter(ctx: CityContext): void {
    const candidates = this.npcManager.getActiveNPCs().filter((n) =>
      n.isActive && n.hasPersona() && !n.boarded && !n.hasBubble() &&
      Math.hypot(n.x - ctx.playerX, n.y - ctx.playerY) < BUBBLE_RANGE
    );
    if (candidates.length === 0) return;

    const npc = candidates[Math.floor(Math.random() * candidates.length)];
    const dist = Math.hypot(npc.x - ctx.playerX, npc.y - ctx.playerY);

    // A nearby chase turns this bystander into a witness
    if (ctx.sirenActive && !npc.isWitness && dist < WITNESS_RANGE && Math.random() < 0.5) {
      npc.setWitness(true);
    }

    const dctx = this.dctx(npc, ctx, {
      reactToPlayer: ctx.playerIsPolice && dist < REACT_RANGE && Math.random() < 0.6,
      reactToSiren: ctx.sirenActive && Math.random() < 0.5,
    });
    npc.showBubble(DialogueGenerator.generate(dctx));
  }

  /** Explicit interaction: returns the agent's name + a generated line + mood. */
  talkTo(npc: NPC, ctx: CityContext): { name: string; line: string; moodLabel: string } {
    if (!npc.hasPersona()) {
      const resident = this.registry.acquire();
      npc.bindResident(resident);
      npc.onAgentRelease = (n) => { if (n.resident) this.registry.release(n.resident, n.needs); };
      const phase = this.phaseOf(ctx.timeOfDay);
      const intent = this.rollIntent(phase, resident.persona.occupation);
      npc.assignAgent(resident.persona, moodFromNeeds(npc.needs), intent, 1);
    }

    const known = npc.isKnownToPlayer();
    const line = DialogueGenerator.generate(this.dctx(npc, ctx, { reactToPlayer: true, knownToPlayer: known }));

    // Talking is social — it fills the need and warms the relationship
    npc.needs.social = clamp01to100(npc.needs.social + 30);
    if (npc.resident) this.registry.recordMeeting(npc.resident, 8);

    const persona = npc.persona!;
    const friend = npc.getRelationship() >= 30 ? ' (friendly)' : '';
    return {
      name: `${persona.name} · ${persona.occupation}${friend}`,
      line,
      moodLabel: MOOD_LABEL[npc.mood],
    };
  }

  /** Police questioning a witness — returns a clue line + a small reward. */
  questionWitness(npc: NPC, ctx: CityContext): { name: string; clue: string; reward: number } {
    npc.setWitness(false);
    if (npc.resident) this.registry.recordMeeting(npc.resident, 5);
    const persona = npc.persona;
    return {
      name: persona ? `${persona.name} · witness` : 'Witness',
      clue: DialogueGenerator.witnessClue(),
      reward: 40,
    };
  }

  isWitness(npc: NPC): boolean {
    return npc.isWitness;
  }

  // ===== NPC-to-NPC conversations =====

  private tryStartConversation(ctx: CityContext): void {
    const avail = this.npcManager.getActiveNPCs().filter((n) =>
      n.isActive && n.hasPersona() && !n.boarded && !n.inConversation &&
      n.behaviorPattern !== 'goal_seek' && !n.hasBubble() &&
      Math.hypot(n.x - ctx.playerX, n.y - ctx.playerY) < BUBBLE_RANGE
    );
    if (avail.length < 2) return;

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
    // Chatting satisfies the social need for both
    a.needs.social = clamp01to100(a.needs.social + 20);
    b.needs.social = clamp01to100(b.needs.social + 20);
    this.scene.time.delayedCall(1200, () => {
      if (b.isActive && b.inConversation) b.showBubble(exchange.response);
    });
  }

  // ===== Recognizable named residents =====

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
        const star = npc.getRelationship() >= 30 ? '★ ' : '';
        npc.showNameTag(star + npc.persona!.name);
      } else if (npc.hasNameTag()) {
        npc.hideNameTag();
      }
    }
  }

  // ===== Rush-hour crowd density =====

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

  // ===== Helpers =====

  private dctx(
    npc: NPC, ctx: CityContext,
    flags: { reactToPlayer?: boolean; reactToSiren?: boolean; reactToGraffiti?: boolean; knownToPlayer?: boolean }
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

  private spawnFoodCarts(district: District, count: number): void {
    const b = district.bounds;
    for (let i = 0; i < count; i++) {
      const x = b.x + 80 + Math.random() * (b.width - 160);
      const y = b.y + 80 + Math.random() * (b.height - 160);
      this.amenities.push({ kind: 'food', x, y });

      // Tiny vendor cart marker (umbrella + cart) — bloom gives it a little glow
      const cart = this.scene.add.container(x, y).setDepth(46);
      const umbrellaColor = [0xe53935, 0x43a047, 0x1e88e5, 0xff8f00][i % 4];
      cart.add(this.scene.add.rectangle(0, 1, 8, 4, 0x6d4c41));          // cart body
      cart.add(this.scene.add.rectangle(0, -2, 10, 2, umbrellaColor));    // umbrella
      cart.add(this.scene.add.rectangle(0, -1, 0.6, 3, 0x9e9e9e));        // pole
      const label = this.scene.add.text(0, -4, 'FOOD', {
        fontSize: '14px', color: '#ffe9a8',
      }).setOrigin(0.5, 1).setScale(0.07).setAlpha(0.8);
      cart.add(label);
    }
  }

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
      return r < 0.7 ? 'leisure' : 'errand';
    }
    switch (phase) {
      case 'morning': return r < 0.7 ? 'commute_work' : r < 0.9 ? 'errand' : 'leisure';
      case 'dawn':    return r < 0.5 ? 'commute_work' : r < 0.8 ? 'idle' : 'leisure';
      case 'midday':  return r < 0.5 ? 'errand' : r < 0.8 ? 'leisure' : 'idle';
      case 'evening': return r < 0.65 ? 'commute_home' : r < 0.85 ? 'errand' : 'leisure';
      case 'night':   return r < 0.45 ? 'nightlife' : r < 0.75 ? 'commute_home' : 'idle';
      default:        return 'idle';
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

  private nearestAmenity(kind: AmenityKind, x: number, y: number): Amenity | null {
    let best: Amenity | null = null;
    let bestD = Infinity;
    for (const a of this.amenities) {
      if (a.kind !== kind) continue;
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < bestD) { bestD = d; best = a; }
    }
    return best;
  }
}

function clamp01to100(v: number): number {
  return v < 0 ? 0 : v > 100 ? 100 : v;
}
