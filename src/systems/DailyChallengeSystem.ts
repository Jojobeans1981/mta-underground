const DAILY_KEY = 'mta_daily_challenge';

export interface DailyChallenge {
  id: string;
  description: string;
  type: 'missions' | 'money' | 'npcs' | 'stations' | 'distance';
  target: number;
  current: number;
  completed: boolean;
  reward: { money: number; xp: number };
}

interface DailySave {
  date: string; // YYYY-MM-DD
  challenges: DailyChallenge[];
  streak: number; // Consecutive days completed
}

const CHALLENGE_TEMPLATES = [
  { desc: 'Complete {n} missions', type: 'missions' as const, targets: [2, 3, 5], rewards: [200, 350, 600] },
  { desc: 'Earn ${n}', type: 'money' as const, targets: [300, 500, 1000], rewards: [150, 250, 500] },
  { desc: 'Catch {n} NPCs', type: 'npcs' as const, targets: [2, 4, 6], rewards: [200, 400, 700] },
  { desc: 'Visit {n} stations', type: 'stations' as const, targets: [3, 5, 8], rewards: [150, 300, 500] },
];

export class DailyChallengeSystem {
  private challenges: DailyChallenge[] = [];
  private streak: number = 0;
  private today: string = '';

  init(): void {
    this.today = new Date().toISOString().split('T')[0];
    const saved = this.load();

    if (saved && saved.date === this.today) {
      this.challenges = saved.challenges;
      this.streak = saved.streak;
    } else {
      // New day — generate fresh challenges
      const yesterday = saved?.date;
      const wasYesterday = yesterday && this.isConsecutiveDay(yesterday, this.today);
      this.streak = wasYesterday ? (saved?.streak ?? 0) : 0;
      this.generateChallenges();
      this.save();
    }
  }

  private generateChallenges(): void {
    this.challenges = [];
    // Pick 3 random challenge types
    const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, 3);

    picked.forEach((tmpl, i) => {
      // Difficulty scales with streak
      const diffIdx = Math.min(Math.floor(this.streak / 3), 2);
      const target = tmpl.targets[diffIdx];
      const reward = tmpl.rewards[diffIdx];
      // Streak bonus: +10% per streak day
      const streakBonus = 1 + this.streak * 0.1;

      this.challenges.push({
        id: `daily_${i}_${this.today}`,
        description: tmpl.desc.replace('{n}', target.toString()),
        type: tmpl.type,
        target,
        current: 0,
        completed: false,
        reward: {
          money: Math.floor(reward * streakBonus),
          xp: Math.floor(reward * 0.5 * streakBonus),
        },
      });
    });
  }

  updateProgress(type: string, amount: number = 1): DailyChallenge | null {
    for (const ch of this.challenges) {
      if (ch.type === type && !ch.completed) {
        ch.current = Math.min(ch.current + amount, ch.target);
        if (ch.current >= ch.target) {
          ch.completed = true;
          // Check if all completed
          if (this.challenges.every(c => c.completed)) {
            this.streak++;
          }
          this.save();
          return ch;
        }
        this.save();
      }
    }
    return null;
  }

  getChallenges(): DailyChallenge[] {
    return this.challenges;
  }

  getStreak(): number {
    return this.streak;
  }

  allCompleted(): boolean {
    return this.challenges.length > 0 && this.challenges.every(c => c.completed);
  }

  private isConsecutiveDay(prev: string, curr: string): boolean {
    const prevDate = new Date(prev + 'T00:00:00');
    const currDate = new Date(curr + 'T00:00:00');
    const diff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff === 1;
  }

  private save(): void {
    const data: DailySave = { date: this.today, challenges: this.challenges, streak: this.streak };
    localStorage.setItem(DAILY_KEY, JSON.stringify(data));
  }

  private load(): DailySave | null {
    try {
      const raw = localStorage.getItem(DAILY_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
