// Environment
export const COLOR_ASPHALT = '#2c2c2c';
export const COLOR_SIDEWALK = '#888888';
export const COLOR_BUILDING_1 = '#4a3728';
export const COLOR_BUILDING_2 = '#5c6670';
export const COLOR_BUILDING_3 = '#3d4f5f';
export const COLOR_BUILDING_4 = '#8b7355';
export const COLOR_GRASS = '#2d5a27';
export const COLOR_WATER = '#1a4a6e';
export const COLOR_TREE = '#1b4d2e';

// Station
export const COLOR_STATION_WALL = '#555555';
export const COLOR_STATION_FLOOR = '#444444';
export const COLOR_STATION_PLATFORM = '#666666';
export const COLOR_TRACK = '#333333';
export const COLOR_TRACK_RAIL = '#999999';
export const COLOR_TURNSTILE = '#888888';
export const COLOR_STATION_SIGN = '#003366';

// Subway lines
export const COLOR_LINE_RED = '#FF4444';
export const COLOR_LINE_BLUE = '#4444FF';
export const COLOR_LINE_GREEN = '#44FF44';
export const COLOR_LINE_YELLOW = '#FFFF44';

// Characters
export const COLOR_POLICE_UNIFORM = '#1a237e';
export const COLOR_POLICE_CAP = '#283593';
export const COLOR_POLICE_BADGE = '#ffd700';
export const COLOR_CIVILIAN_1 = '#795548';
export const COLOR_CIVILIAN_2 = '#607d8b';
export const COLOR_CIVILIAN_3 = '#ff7043';
export const COLOR_CIVILIAN_4 = '#ab47bc';
export const COLOR_FARE_EVADER = '#c62828';

// UI
export const COLOR_UI_PRIMARY = '#ff6f00';
export const COLOR_UI_SECONDARY = '#0d47a1';
export const COLOR_UI_BACKGROUND = '#1a1a2e';
export const COLOR_UI_SURFACE = '#252540';
export const COLOR_UI_TEXT = '#ffffff';
export const COLOR_UI_TEXT_DIM = '#aaaaaa';
export const COLOR_UI_SUCCESS = '#4caf50';
export const COLOR_UI_DANGER = '#f44336';
export const COLOR_UI_WARNING = '#ffeb3b';
export const COLOR_UI_XP = '#7c4dff';
export const COLOR_UI_MONEY = '#ffd700';

/** Convert a hex color string (e.g. '#FF4444') to a numeric value for Phaser */
export function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
