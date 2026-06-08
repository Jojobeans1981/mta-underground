/**
 * Living-City agent definitions.
 *
 * Every street NPC is promoted to an "agent" with a persistent persona,
 * a mood that shifts with context, and an intent driven by the time of day.
 * These types are shared between the NPC entity and the LivingCitySystem.
 */

export type AgentMood = 'cheerful' | 'content' | 'stressed' | 'tired' | 'annoyed' | 'nervous';

export type AgentIntent =
  | 'commute_work'   // morning rush — heading to a station to catch a train
  | 'commute_home'   // evening rush — heading to a station to go home
  | 'errand'         // midday — wandering between shops
  | 'leisure'        // strolling, no urgency
  | 'nightlife'      // out late
  | 'idle';          // standing around / loitering

export type AgentTrait = 'cheerful' | 'grumpy' | 'anxious' | 'chill' | 'chatty' | 'weary';

export interface AgentPersona {
  name: string;
  occupation: string;
  trait: AgentTrait;
}

export const FIRST_NAMES: string[] = [
  'Marcus', 'Aisha', 'Tony', 'Mei', 'Diego', 'Priya', 'Jamal', 'Sofia',
  'Kevin', 'Fatima', 'Liam', 'Yuki', 'Carlos', 'Nina', 'Omar', 'Grace',
  'Andre', 'Lena', 'Hassan', 'Rosa', 'Devon', 'Chloe', 'Malik', 'Ivy',
  'Sal', 'Tanya', 'Rashid', 'Bianca', 'Eli', 'Noor',
];

export const OCCUPATIONS: string[] = [
  'banker', 'nurse', 'student', 'barista', 'construction worker', 'artist',
  'teacher', 'chef', 'delivery rider', 'retiree', 'lawyer', 'street vendor',
  'musician', 'nurse', 'office temp', 'dog walker', 'bartender', 'electrician',
];

export const TRAITS: AgentTrait[] = ['cheerful', 'grumpy', 'anxious', 'chill', 'chatty', 'weary'];

/** Tourists get their own flavor — confused, camera-toting visitors. */
export const TOURIST_OCCUPATIONS = ['tourist', 'visitor', 'out-of-towner'];

/** Pick a random element. */
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Build a fresh random persona. */
export function makePersona(): AgentPersona {
  // ~12% chance of being a tourist
  const isTourist = Math.random() < 0.12;
  return {
    name: pick(FIRST_NAMES),
    occupation: isTourist ? pick(TOURIST_OCCUPATIONS) : pick(OCCUPATIONS),
    trait: pick(TRAITS),
  };
}

/** Human-readable label for a mood (used in the interaction panel). */
export const MOOD_LABEL: Record<AgentMood, string> = {
  cheerful: 'cheerful',
  content: 'content',
  stressed: 'stressed',
  tired: 'tired',
  annoyed: 'annoyed',
  nervous: 'nervous',
};

// ===== The Sims layer: needs / motives =====

/** Four core motives, 0 (desperate) .. 100 (fully satisfied). */
export interface Needs {
  hunger: number;
  energy: number;
  social: number;
  fun: number;
}

export type NeedKind = keyof Needs;

/** City amenities an agent can walk to in order to satisfy a need. */
export type AmenityKind = 'food' | 'rest' | 'social' | 'fun' | 'shelter';

/** Which amenity satisfies which need. */
export const NEED_TO_AMENITY: Record<NeedKind, AmenityKind> = {
  hunger: 'food',
  energy: 'rest',
  social: 'social',
  fun: 'fun',
};

/** Fresh, mostly-satisfied needs with a little random spread. */
export function makeNeeds(): Needs {
  const j = () => 55 + Math.random() * 40;
  return { hunger: j(), energy: j(), social: j(), fun: j() };
}

/** The most urgent (lowest) need, or null if everything is comfortable. */
export function lowestNeed(n: Needs, threshold = 35): { kind: NeedKind; value: number } | null {
  let kind: NeedKind = 'hunger';
  let value = n.hunger;
  (['energy', 'social', 'fun'] as NeedKind[]).forEach((k) => {
    if (n[k] < value) { value = n[k]; kind = k; }
  });
  return value <= threshold ? { kind, value } : null;
}

/** Derive a mood from the current needs (used when an agent has a needs model). */
export function moodFromNeeds(n: Needs): AgentMood {
  if (n.energy < 25) return 'tired';
  if (n.hunger < 25) return 'annoyed';
  if (n.fun < 25) return 'annoyed';
  if (n.social < 25) return 'content';
  const avg = (n.hunger + n.energy + n.social + n.fun) / 4;
  if (avg > 75) return 'cheerful';
  if (avg < 45) return 'stressed';
  return 'content';
}
