import { AgentPersona, Needs, makePersona, makeNeeds } from '@/data/personas';

/**
 * A persistent city resident. Unlike the transient NPC sprites (which spawn
 * and despawn around the player), a Resident's identity, needs and feelings
 * toward the player persist — so the same faces recur and remember you.
 */
export interface Resident {
  id: number;
  persona: AgentPersona;
  needs: Needs;
  relationship: number; // -100 (hostile) .. 100 (friend)
  metPlayer: boolean;
  timesMet: number;
  bound: boolean;       // currently attached to an active NPC sprite
}

const MAX_RESIDENTS = 26;

/**
 * Pool of persistent residents. NPC sprites "borrow" a resident when they
 * spawn and hand it back (with updated needs) when they despawn, so a recycled
 * sprite can carry the same person — including how they feel about the player.
 */
export class ResidentRegistry {
  private residents: Resident[] = [];
  private nextId = 1;

  /** Borrow a resident for a freshly personified NPC. Prefers recurring faces. */
  acquire(): Resident {
    const free = this.residents.filter((r) => !r.bound);

    // Reuse an existing resident most of the time so people recur; otherwise
    // mint a new one until the city's cast is full.
    const reuse = free.length > 0 && (this.residents.length >= MAX_RESIDENTS || Math.random() < 0.6);

    let resident: Resident;
    if (reuse) {
      resident = free[Math.floor(Math.random() * free.length)];
    } else {
      resident = {
        id: this.nextId++,
        persona: makePersona(),
        needs: makeNeeds(),
        relationship: 0,
        metPlayer: false,
        timesMet: 0,
        bound: false,
      };
      this.residents.push(resident);
    }

    resident.bound = true;
    return resident;
  }

  /** Hand a resident back to the pool with its latest needs preserved. */
  release(resident: Resident, needs: Needs): void {
    resident.needs = needs;
    resident.bound = false;
  }

  /** Record that the player spoke with / helped this resident. */
  recordMeeting(resident: Resident, relationshipDelta: number): void {
    resident.metPlayer = true;
    resident.timesMet += 1;
    resident.relationship = Math.max(-100, Math.min(100, resident.relationship + relationshipDelta));
  }

  /** A few stats for flavor / future UI. */
  getKnownCount(): number {
    return this.residents.filter((r) => r.metPlayer).length;
  }
}
