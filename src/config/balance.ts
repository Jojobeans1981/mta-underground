export const BASE_XP = 200;
export const XP_GROWTH = 1.2;
export const MAX_LEVEL = 10;
export const STARTING_MONEY = 0;
export const MISSION_MONEY_BASE = 100;
export const MISSION_XP_BASE = 50;

export function calculateXPRequired(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP * Math.pow(XP_GROWTH, level - 2));
}
