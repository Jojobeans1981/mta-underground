import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { CIVILIAN_DEFINITIONS, getCivilianTextureKey } from '@/data/npcs';

export class Civilian extends NPC {
  constructor(scene: Phaser.Scene, x: number, y: number, variant?: number) {
    const idx = variant ?? Math.floor(Math.random() * CIVILIAN_DEFINITIONS.length);
    const def = CIVILIAN_DEFINITIONS[idx % CIVILIAN_DEFINITIONS.length];
    const textureKey = getCivilianTextureKey(def.id);

    super(scene, x, y, def, textureKey);
  }
}
