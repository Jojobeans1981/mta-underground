import { District, Station, SubwayLine, Landmark, StreetSegment } from '@/types/game.types';

const stations: Station[] = [
  {
    id: 'brooklyn_atlantic',
    name: 'Atlantic Ave',
    position: { x: 300, y: 200 },
    entrances: [{ x: 310, y: 215 }, { x: 290, y: 215 }],
    platforms: [{ id: 'brooklyn_atlantic_platform', position: { x: 300, y: 200 }, width: 60, trackSide: 'south' }],
    connections: ['brooklyn_dekalb', 'brooklyn_prospect'],
    lineIds: ['line_orange', 'line_purple'],
  },
  {
    id: 'brooklyn_dekalb',
    name: 'DeKalb Ave',
    position: { x: 500, y: 300 },
    entrances: [{ x: 510, y: 315 }, { x: 490, y: 315 }],
    platforms: [{ id: 'brooklyn_dekalb_platform', position: { x: 500, y: 300 }, width: 60, trackSide: 'south' }],
    connections: ['brooklyn_atlantic', 'brooklyn_fulton'],
    lineIds: ['line_orange'],
  },
  {
    id: 'brooklyn_fulton',
    name: 'Fulton St',
    position: { x: 700, y: 400 },
    entrances: [{ x: 710, y: 415 }, { x: 690, y: 415 }],
    platforms: [{ id: 'brooklyn_fulton_platform', position: { x: 700, y: 400 }, width: 60, trackSide: 'east' }],
    connections: ['brooklyn_dekalb', 'brooklyn_nostrand'],
    lineIds: ['line_orange', 'line_teal'],
  },
  {
    id: 'brooklyn_prospect',
    name: 'Prospect Park',
    position: { x: 200, y: 500 },
    entrances: [{ x: 210, y: 515 }, { x: 190, y: 515 }],
    platforms: [{ id: 'brooklyn_prospect_platform', position: { x: 200, y: 500 }, width: 60, trackSide: 'west' }],
    connections: ['brooklyn_atlantic', 'brooklyn_nostrand'],
    lineIds: ['line_purple'],
  },
  {
    id: 'brooklyn_nostrand',
    name: 'Nostrand Ave',
    position: { x: 500, y: 650 },
    entrances: [{ x: 510, y: 665 }, { x: 490, y: 665 }],
    platforms: [{ id: 'brooklyn_nostrand_platform', position: { x: 500, y: 650 }, width: 60, trackSide: 'north' }],
    connections: ['brooklyn_fulton', 'brooklyn_prospect'],
    lineIds: ['line_purple', 'line_teal'],
  },
];

export const BROOKLYN_SUBWAY_LINES: SubwayLine[] = [
  { id: 'line_orange', color: '#FF8C00', stationIds: ['brooklyn_atlantic', 'brooklyn_dekalb', 'brooklyn_fulton'] },
  { id: 'line_purple', color: '#9C27B0', stationIds: ['brooklyn_atlantic', 'brooklyn_prospect', 'brooklyn_nostrand'] },
  { id: 'line_teal', color: '#009688', stationIds: ['brooklyn_fulton', 'brooklyn_nostrand'] },
];

const landmarks: Landmark[] = [
  { id: 'bk_bridge_view', name: 'Bridge View', position: { x: 400, y: 100 }, size: { width: 100, height: 30 }, spriteConfig: { shape: 'rect', primaryColor: '#8d6e63', secondaryColor: '#6d4c41', size: 30 } },
  { id: 'bk_park', name: 'Prospect Green', position: { x: 200, y: 420 }, size: { width: 90, height: 90 }, spriteConfig: { shape: 'rect', primaryColor: '#2d5a27', secondaryColor: '#1b4d2e', size: 90 } },
  { id: 'bk_market', name: 'Market Row', position: { x: 600, y: 250 }, size: { width: 70, height: 25 }, spriteConfig: { shape: 'rect', primaryColor: '#e65100', secondaryColor: '#bf360c', size: 25 } },
  { id: 'bk_warehouse', name: 'The Warehouse', position: { x: 750, y: 600 }, size: { width: 60, height: 60 }, spriteConfig: { shape: 'rect', primaryColor: '#546e7a', secondaryColor: '#37474f', size: 60 } },
];

function generateStreetGrid(): StreetSegment[] {
  const segments: StreetSegment[] = [];
  const horizontalYs = [150, 250, 350, 450, 550, 700, 800];
  const verticalXs = [100, 300, 500, 700, 900];

  for (const y of horizontalYs) {
    segments.push({ start: { x: 50, y }, end: { x: 950, y }, width: 40, type: 'road' });
    segments.push({ start: { x: 50, y: y - 25 }, end: { x: 950, y: y - 25 }, width: 10, type: 'sidewalk' });
    segments.push({ start: { x: 50, y: y + 25 }, end: { x: 950, y: y + 25 }, width: 10, type: 'sidewalk' });
  }
  for (const x of verticalXs) {
    segments.push({ start: { x, y: 50 }, end: { x, y: 950 }, width: 40, type: 'road' });
    segments.push({ start: { x: x - 25, y: 50 }, end: { x: x - 25, y: 950 }, width: 10, type: 'sidewalk' });
    segments.push({ start: { x: x + 25, y: 50 }, end: { x: x + 25, y: 950 }, width: 10, type: 'sidewalk' });
  }
  return segments;
}

export const BROOKLYN_DISTRICT: District = {
  id: 'brooklyn',
  name: 'Brooklyn',
  bounds: { x: 0, y: 0, width: 1000, height: 1000 },
  stations,
  landmarks,
  streetGrid: generateStreetGrid(),
  unlockCondition: { type: 'always', value: 0 },
};
