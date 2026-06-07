import Phaser from 'phaser';
import { NPC } from '@/entities/NPC';
import { SUSPICIOUS_PERSON_DEFINITION } from '@/data/npcs';

export class SuspiciousNPC extends NPC {
  isEvidence: boolean;
  investigated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, isEvidence: boolean) {
    super(scene, x, y, SUSPICIOUS_PERSON_DEFINITION, 'npc_suspicious');
    this.isEvidence = isEvidence;
  }

  investigate(): string {
    this.investigated = true;

    // Visual feedback: tint change
    if (this.entitySprite) {
      this.entitySprite.setTint(this.isEvidence ? 0xff4444 : 0x888888);
    }

    if (this.isEvidence) {
      return 'You found something! This looks like evidence.';
    } else {
      return 'Nothing suspicious here. Just a regular commuter.';
    }
  }

  getIsInvestigated(): boolean {
    return this.investigated;
  }
}
