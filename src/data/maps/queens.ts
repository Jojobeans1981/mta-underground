import { District, Station, SubwayLine, Landmark, StreetSegment } from '@/types/game.types';

const stations: Station[] = [
  {
    id: 'queens_jamaica',
    name: 'Jamaica Center',
    position: { x: 800, y: 200 },
    entrances: [{ x: 810, y: 215 }, { x: 790, y: 215 }],
    platforms: [{ id: 'queens_jamaica_platform', position: { x: 800, y: 200 }, width: 70, trackSide: 'south' }],
    connections: ['queens_sutphin', 'queens_hillside'],
    lineIds: ['line_e', 'line_jz'],
  },
  {
    id: 'queens_sutphin',
    name: 'Sutphin Blvd',
    position: { x: 500, y: 300 },
    entrances: [{ x: 510, y: 315 }, { x: 490, y: 315 }],
    platforms: [{ id: 'queens_sutphin_platform', position: { x: 500, y: 300 }, width: 60, trackSide: 'south' }],
    connections: ['queens_jamaica', 'queens_roosevelt'],
    lineIds: ['line_e'],
  },
  {
    id: 'queens_roosevelt',
    name: 'Roosevelt Av–Jackson Hts',
    position: { x: 300, y: 450 },
    entrances: [{ x: 310, y: 465 }, { x: 290, y: 465 }],
    platforms: [{ id: 'queens_roosevelt_platform', position: { x: 300, y: 450 }, width: 60, trackSide: 'east' }],
    connections: ['queens_sutphin', 'queens_woodside'],
    lineIds: ['line_e', 'line_7'],
  },
  {
    id: 'queens_hillside',
    name: 'Hillside Av',
    position: { x: 700, y: 550 },
    entrances: [{ x: 710, y: 565 }, { x: 690, y: 565 }],
    platforms: [{ id: 'queens_hillside_platform', position: { x: 700, y: 550 }, width: 60, trackSide: 'west' }],
    connections: ['queens_jamaica', 'queens_woodside'],
    lineIds: ['line_jz'],
  },
  {
    id: 'queens_woodside',
    name: 'Woodside–61 St',
    position: { x: 400, y: 700 },
    entrances: [{ x: 410, y: 715 }, { x: 390, y: 715 }],
    platforms: [{ id: 'queens_woodside_platform', position: { x: 400, y: 700 }, width: 60, trackSide: 'north' }],
    connections: ['queens_roosevelt', 'queens_hillside'],
    lineIds: ['line_7', 'line_jz'],
  },
];

export const QUEENS_SUBWAY_LINES: SubwayLine[] = [
  { id: 'line_e', name: 'E', color: '#0039A6', stationIds: ['queens_jamaica', 'queens_sutphin', 'queens_roosevelt'] },
  { id: 'line_jz', name: 'J·Z', color: '#996633', stationIds: ['queens_jamaica', 'queens_hillside', 'queens_woodside'] },
  { id: 'line_7', name: '7', color: '#B933AD', stationIds: ['queens_roosevelt', 'queens_woodside'] },
];

const landmarks: Landmark[] = [
  { id: 'q_stadium', name: 'The Stadium', position: { x: 200, y: 350 }, size: { width: 80, height: 80 }, spriteConfig: { shape: 'circle', primaryColor: '#1565c0', secondaryColor: '#0d47a1', size: 80 } },
  { id: 'q_mall', name: 'Queens Mall', position: { x: 600, y: 400 }, size: { width: 70, height: 50 }, spriteConfig: { shape: 'rect', primaryColor: '#8e24aa', secondaryColor: '#6a1b9a', size: 50 } },
  { id: 'q_depot', name: 'Bus Depot', position: { x: 850, y: 500 }, size: { width: 90, height: 60 }, spriteConfig: { shape: 'rect', primaryColor: '#37474f', secondaryColor: '#263238', size: 60 } },
  { id: 'q_park', name: 'Flushing Green', position: { x: 150, y: 700 }, size: { width: 80, height: 80 }, spriteConfig: { shape: 'rect', primaryColor: '#2d5a27', secondaryColor: '#1b4d2e', size: 80 } },
];

function generateStreetGrid(): StreetSegment[] {
  const segments: StreetSegment[] = [];
  const hYs = [150, 280, 400, 520, 650, 780, 900];
  const vXs = [100, 250, 450, 650, 850];
  for (const y of hYs) {
    segments.push({ start: { x: 50, y }, end: { x: 950, y }, width: 40, type: 'road' });
    segments.push({ start: { x: 50, y: y - 25 }, end: { x: 950, y: y - 25 }, width: 10, type: 'sidewalk' });
    segments.push({ start: { x: 50, y: y + 25 }, end: { x: 950, y: y + 25 }, width: 10, type: 'sidewalk' });
  }
  for (const x of vXs) {
    segments.push({ start: { x, y: 50 }, end: { x, y: 950 }, width: 40, type: 'road' });
    segments.push({ start: { x: x - 25, y: 50 }, end: { x: x - 25, y: 950 }, width: 10, type: 'sidewalk' });
    segments.push({ start: { x: x + 25, y: 50 }, end: { x: x + 25, y: 950 }, width: 10, type: 'sidewalk' });
  }
  return segments;
}

export const QUEENS_DISTRICT: District = {
  id: 'queens',
  name: 'Queens',
  bounds: { x: 0, y: 0, width: 1000, height: 1000 },
  stations,
  landmarks,
  streetGrid: generateStreetGrid(),
  unlockCondition: { type: 'always', value: 0 },
};
