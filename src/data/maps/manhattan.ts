import { District, Station, SubwayLine, Landmark, StreetSegment } from '@/types/game.types';

const stations: Station[] = [
  {
    id: 'manhattan_grand_central',
    name: 'Grand Central–42 St',
    position: { x: 500, y: 200 },
    entrances: [{ x: 510, y: 215 }, { x: 490, y: 215 }],
    platforms: [
      { id: 'manhattan_grand_central_platform', position: { x: 500, y: 200 }, width: 60, trackSide: 'south' },
    ],
    connections: ['manhattan_times_sq', 'manhattan_union_sq'],
    lineIds: ['line_456', 'line_7'],
  },
  {
    id: 'manhattan_times_sq',
    name: 'Times Sq–42 St',
    position: { x: 300, y: 300 },
    entrances: [{ x: 310, y: 315 }, { x: 290, y: 315 }],
    platforms: [
      { id: 'manhattan_times_sq_platform', position: { x: 300, y: 300 }, width: 60, trackSide: 'south' },
    ],
    connections: ['manhattan_grand_central', 'manhattan_penn'],
    lineIds: ['line_123', 'line_7'],
  },
  {
    id: 'manhattan_penn',
    name: '34 St–Penn Station',
    position: { x: 200, y: 400 },
    entrances: [{ x: 210, y: 415 }, { x: 190, y: 415 }],
    platforms: [
      { id: 'manhattan_penn_platform', position: { x: 200, y: 400 }, width: 60, trackSide: 'east' },
    ],
    connections: ['manhattan_times_sq'],
    lineIds: ['line_123'],
  },
  {
    id: 'manhattan_union_sq',
    name: '14 St–Union Sq',
    position: { x: 500, y: 500 },
    entrances: [{ x: 510, y: 515 }, { x: 490, y: 515 }],
    platforms: [
      { id: 'manhattan_union_sq_platform', position: { x: 500, y: 500 }, width: 60, trackSide: 'west' },
    ],
    connections: ['manhattan_grand_central', 'manhattan_city_hall'],
    lineIds: ['line_456', 'line_nqr'],
  },
  {
    id: 'manhattan_city_hall',
    name: 'Brooklyn Bridge–City Hall',
    position: { x: 350, y: 700 },
    entrances: [{ x: 360, y: 715 }, { x: 340, y: 715 }],
    platforms: [
      { id: 'manhattan_city_hall_platform', position: { x: 350, y: 700 }, width: 60, trackSide: 'north' },
    ],
    connections: ['manhattan_union_sq'],
    lineIds: ['line_nqr'],
  },
];

// Real MTA lines + authentic trunk-line colors
export const MANHATTAN_SUBWAY_LINES: SubwayLine[] = [
  { id: 'line_7', name: '7', color: '#B933AD', stationIds: ['manhattan_grand_central', 'manhattan_times_sq'] },
  { id: 'line_123', name: '1·2·3', color: '#EE352E', stationIds: ['manhattan_times_sq', 'manhattan_penn'] },
  { id: 'line_456', name: '4·5·6', color: '#00933C', stationIds: ['manhattan_grand_central', 'manhattan_union_sq'] },
  { id: 'line_nqr', name: 'N·Q·R', color: '#FCCC0A', stationIds: ['manhattan_union_sq', 'manhattan_city_hall'] },
];

const landmarks: Landmark[] = [
  {
    id: 'central_tower',
    name: 'Central Tower',
    position: { x: 500, y: 100 },
    size: { width: 40, height: 80 },
    spriteConfig: { shape: 'rect', primaryColor: '#777777', secondaryColor: '#555555', size: 40 },
  },
  {
    id: 'theater_row',
    name: 'Theater Row',
    position: { x: 250, y: 280 },
    size: { width: 80, height: 30 },
    spriteConfig: { shape: 'rect', primaryColor: '#ff5722', secondaryColor: '#e64a19', size: 30 },
  },
  {
    id: 'garden_arena',
    name: 'Garden Arena',
    position: { x: 150, y: 380 },
    size: { width: 60, height: 60 },
    spriteConfig: { shape: 'circle', primaryColor: '#9e9e9e', secondaryColor: '#757575', size: 60 },
  },
  {
    id: 'square_park',
    name: 'The Square Park',
    position: { x: 500, y: 450 },
    size: { width: 80, height: 80 },
    spriteConfig: { shape: 'rect', primaryColor: '#2d5a27', secondaryColor: '#1b4d2e', size: 80 },
  },
  {
    id: 'bridge_approach',
    name: 'Bridge Approach',
    position: { x: 400, y: 850 },
    size: { width: 100, height: 40 },
    spriteConfig: { shape: 'rect', primaryColor: '#616161', secondaryColor: '#424242', size: 40 },
  },
];

// Generate street grid programmatically
function generateStreetGrid(): StreetSegment[] {
  const segments: StreetSegment[] = [];

  // Horizontal roads at y = 150, 250, 350, 450, 550, 650, 750
  const horizontalYs = [150, 250, 350, 450, 550, 650, 750];
  for (const y of horizontalYs) {
    // Road
    segments.push({
      start: { x: 50, y },
      end: { x: 950, y },
      width: 40,
      type: 'road',
    });
    // Sidewalks
    segments.push({
      start: { x: 50, y: y - 25 },
      end: { x: 950, y: y - 25 },
      width: 10,
      type: 'sidewalk',
    });
    segments.push({
      start: { x: 50, y: y + 25 },
      end: { x: 950, y: y + 25 },
      width: 10,
      type: 'sidewalk',
    });
  }

  // Vertical avenues at x = 150, 300, 500, 700, 850
  const verticalXs = [150, 300, 500, 700, 850];
  for (const x of verticalXs) {
    // Road
    segments.push({
      start: { x, y: 50 },
      end: { x, y: 950 },
      width: 40,
      type: 'road',
    });
    // Sidewalks
    segments.push({
      start: { x: x - 25, y: 50 },
      end: { x: x - 25, y: 950 },
      width: 10,
      type: 'sidewalk',
    });
    segments.push({
      start: { x: x + 25, y: 50 },
      end: { x: x + 25, y: 950 },
      width: 10,
      type: 'sidewalk',
    });
  }

  return segments;
}

const streetGrid = generateStreetGrid();

export const MANHATTAN_DISTRICT: District = {
  id: 'manhattan',
  name: 'Manhattan',
  bounds: { x: 0, y: 0, width: 1000, height: 1000 },
  stations,
  landmarks,
  streetGrid,
  unlockCondition: { type: 'always', value: 0 },
};
