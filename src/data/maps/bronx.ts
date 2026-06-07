import { District, Station, SubwayLine, Landmark, StreetSegment } from '@/types/game.types';

const stations: Station[] = [
  {
    id: 'bronx_yankee',
    name: 'Yankee Stadium',
    position: { x: 250, y: 200 },
    entrances: [{ x: 260, y: 215 }, { x: 240, y: 215 }],
    platforms: [{ id: 'bronx_yankee_platform', position: { x: 250, y: 200 }, width: 60, trackSide: 'south' }],
    connections: ['bronx_fordham', 'bronx_concourse'],
    lineIds: ['line_maroon', 'line_olive'],
  },
  {
    id: 'bronx_fordham',
    name: 'Fordham Rd',
    position: { x: 500, y: 300 },
    entrances: [{ x: 510, y: 315 }, { x: 490, y: 315 }],
    platforms: [{ id: 'bronx_fordham_platform', position: { x: 500, y: 300 }, width: 60, trackSide: 'south' }],
    connections: ['bronx_yankee', 'bronx_pelham'],
    lineIds: ['line_maroon'],
  },
  {
    id: 'bronx_concourse',
    name: 'Grand Concourse',
    position: { x: 200, y: 450 },
    entrances: [{ x: 210, y: 465 }, { x: 190, y: 465 }],
    platforms: [{ id: 'bronx_concourse_platform', position: { x: 200, y: 450 }, width: 60, trackSide: 'east' }],
    connections: ['bronx_yankee', 'bronx_hunts'],
    lineIds: ['line_olive'],
  },
  {
    id: 'bronx_pelham',
    name: 'Pelham Bay',
    position: { x: 750, y: 500 },
    entrances: [{ x: 760, y: 515 }, { x: 740, y: 515 }],
    platforms: [{ id: 'bronx_pelham_platform', position: { x: 750, y: 500 }, width: 60, trackSide: 'west' }],
    connections: ['bronx_fordham', 'bronx_hunts'],
    lineIds: ['line_maroon', 'line_slate'],
  },
  {
    id: 'bronx_hunts',
    name: 'Hunts Point',
    position: { x: 450, y: 700 },
    entrances: [{ x: 460, y: 715 }, { x: 440, y: 715 }],
    platforms: [{ id: 'bronx_hunts_platform', position: { x: 450, y: 700 }, width: 60, trackSide: 'north' }],
    connections: ['bronx_concourse', 'bronx_pelham'],
    lineIds: ['line_olive', 'line_slate'],
  },
];

export const BRONX_SUBWAY_LINES: SubwayLine[] = [
  { id: 'line_maroon', color: '#800000', stationIds: ['bronx_yankee', 'bronx_fordham', 'bronx_pelham'] },
  { id: 'line_olive', color: '#808000', stationIds: ['bronx_yankee', 'bronx_concourse', 'bronx_hunts'] },
  { id: 'line_slate', color: '#708090', stationIds: ['bronx_pelham', 'bronx_hunts'] },
];

const landmarks: Landmark[] = [
  { id: 'bx_stadium', name: 'The Stadium', position: { x: 250, y: 120 }, size: { width: 80, height: 60 }, spriteConfig: { shape: 'rect', primaryColor: '#1a237e', secondaryColor: '#0d47a1', size: 60 } },
  { id: 'bx_zoo', name: 'Wildlife Park', position: { x: 700, y: 350 }, size: { width: 90, height: 90 }, spriteConfig: { shape: 'rect', primaryColor: '#2d5a27', secondaryColor: '#1b4d2e', size: 90 } },
  { id: 'bx_garden', name: 'Botanical Garden', position: { x: 600, y: 150 }, size: { width: 70, height: 70 }, spriteConfig: { shape: 'circle', primaryColor: '#388e3c', secondaryColor: '#2e7d32', size: 70 } },
  { id: 'bx_market', name: 'The Market', position: { x: 350, y: 600 }, size: { width: 60, height: 40 }, spriteConfig: { shape: 'rect', primaryColor: '#e65100', secondaryColor: '#bf360c', size: 40 } },
];

function generateStreetGrid(): StreetSegment[] {
  const segments: StreetSegment[] = [];
  const hYs = [150, 270, 380, 500, 620, 750, 880];
  const vXs = [120, 300, 480, 660, 850];
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

export const BRONX_DISTRICT: District = {
  id: 'bronx',
  name: 'Bronx',
  bounds: { x: 0, y: 0, width: 1000, height: 1000 },
  stations,
  landmarks,
  streetGrid: generateStreetGrid(),
  unlockCondition: { type: 'always', value: 0 },
};
