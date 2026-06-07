import { District, DistrictId, Station, SubwayLine } from '@/types/game.types';
import { MANHATTAN_DISTRICT, MANHATTAN_SUBWAY_LINES } from '@/data/maps/manhattan';
import { BROOKLYN_DISTRICT, BROOKLYN_SUBWAY_LINES } from '@/data/maps/brooklyn';
import { QUEENS_DISTRICT, QUEENS_SUBWAY_LINES } from '@/data/maps/queens';
import { BRONX_DISTRICT, BRONX_SUBWAY_LINES } from '@/data/maps/bronx';
import { STATION_ENTRANCE_SIZE } from '@/config/constants';

export class MapManager {
  currentDistrict: District | null = null;
  private stationMap: Map<string, Station> = new Map();
  subwayLines: SubwayLine[] = [];

  loadDistrict(id: DistrictId): District {
    switch (id) {
      case 'manhattan':
        this.currentDistrict = MANHATTAN_DISTRICT;
        this.subwayLines = MANHATTAN_SUBWAY_LINES;
        break;
      case 'brooklyn':
        this.currentDistrict = BROOKLYN_DISTRICT;
        this.subwayLines = BROOKLYN_SUBWAY_LINES;
        break;
      case 'queens':
        this.currentDistrict = QUEENS_DISTRICT;
        this.subwayLines = QUEENS_SUBWAY_LINES;
        break;
      case 'bronx':
        this.currentDistrict = BRONX_DISTRICT;
        this.subwayLines = BRONX_SUBWAY_LINES;
        break;
      default:
        throw new Error(`District "${id}" not available yet`);
    }

    this.stationMap.clear();
    for (const station of this.currentDistrict.stations) {
      this.stationMap.set(station.id, station);
    }

    return this.currentDistrict;
  }

  getStation(id: string): Station | null {
    return this.stationMap.get(id) ?? null;
  }

  getConnectedStations(stationId: string): Station[] {
    const station = this.getStation(stationId);
    if (!station) return [];

    return station.connections
      .map((connId) => this.getStation(connId))
      .filter((s): s is Station => s !== null);
  }

  getStationAtPosition(x: number, y: number, radius: number): Station | null {
    if (!this.currentDistrict) return null;

    for (const station of this.currentDistrict.stations) {
      for (const entrance of station.entrances) {
        const dist = Math.hypot(entrance.x - x, entrance.y - y);
        if (dist < radius) {
          return station;
        }
      }
    }
    return null;
  }

  getLinesBetweenStations(fromId: string, toId: string): SubwayLine[] {
    return this.subwayLines.filter(
      (line) => line.stationIds.includes(fromId) && line.stationIds.includes(toId)
    );
  }

  isWalkable(x: number, y: number): boolean {
    if (!this.currentDistrict) return false;

    // Check street grid (roads and sidewalks)
    for (const seg of this.currentDistrict.streetGrid) {
      const halfWidth = seg.width / 2;

      // Horizontal segment
      if (Math.abs(seg.start.y - seg.end.y) < 1) {
        const minX = Math.min(seg.start.x, seg.end.x);
        const maxX = Math.max(seg.start.x, seg.end.x);
        if (x >= minX && x <= maxX && Math.abs(y - seg.start.y) <= halfWidth) {
          return true;
        }
      }

      // Vertical segment
      if (Math.abs(seg.start.x - seg.end.x) < 1) {
        const minY = Math.min(seg.start.y, seg.end.y);
        const maxY = Math.max(seg.start.y, seg.end.y);
        if (y >= minY && y <= maxY && Math.abs(x - seg.start.x) <= halfWidth) {
          return true;
        }
      }
    }

    // Check station entrance areas
    for (const station of this.currentDistrict.stations) {
      for (const entrance of station.entrances) {
        if (Math.hypot(entrance.x - x, entrance.y - y) < STATION_ENTRANCE_SIZE) {
          return true;
        }
      }
    }

    // Check park areas (walkable green spaces)
    for (const landmark of this.currentDistrict.landmarks) {
      if (landmark.id === 'square_park') {
        const lx = landmark.position.x - landmark.size.width / 2;
        const ly = landmark.position.y - landmark.size.height / 2;
        if (x >= lx && x <= lx + landmark.size.width && y >= ly && y <= ly + landmark.size.height) {
          return true;
        }
      }
    }

    return false;
  }

  getDistrictBounds(): { x: number; y: number; width: number; height: number } | null {
    return this.currentDistrict?.bounds ?? null;
  }
}
