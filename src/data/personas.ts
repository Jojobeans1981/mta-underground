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
