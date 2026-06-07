const LEADERBOARD_KEY = 'mta_underground_leaderboard';
const MAX_ENTRIES = 50;

export interface LeaderboardEntry {
  playerName: string;
  characterClass: string;
  score: number;
  missionsCompleted: number;
  level: number;
  timestamp: number;
}

export class LeaderboardSystem {
  private entries: LeaderboardEntry[] = [];

  init(): void {
    this.load();
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) {
        this.entries = JSON.parse(raw) as LeaderboardEntry[];
      }
    } catch {
      this.entries = [];
    }
  }

  private save(): void {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
  }

  addEntry(entry: LeaderboardEntry): number {
    this.entries.push(entry);
    this.entries.sort((a, b) => b.score - a.score);

    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }

    this.save();

    // Return rank (1-based)
    return this.entries.findIndex(
      (e) => e.timestamp === entry.timestamp && e.playerName === entry.playerName
    ) + 1;
  }

  getTopEntries(count: number = 10): LeaderboardEntry[] {
    return this.entries.slice(0, count);
  }

  getEntriesForClass(characterClass: string, count: number = 10): LeaderboardEntry[] {
    return this.entries
      .filter((e) => e.characterClass === characterClass)
      .slice(0, count);
  }

  getPlayerBest(playerName: string): LeaderboardEntry | null {
    return this.entries.find((e) => e.playerName === playerName) ?? null;
  }

  getTotalEntries(): number {
    return this.entries.length;
  }

  /** Calculate a score from game stats */
  static calculateScore(stats: {
    level: number;
    missionsCompleted: number;
    moneyEarned: number;
    npcsCaught: number;
  }): number {
    return (
      stats.level * 1000 +
      stats.missionsCompleted * 500 +
      Math.floor(stats.moneyEarned / 10) +
      stats.npcsCaught * 200
    );
  }

  clearAll(): void {
    this.entries = [];
    localStorage.removeItem(LEADERBOARD_KEY);
  }
}
