const ACH_KEY = 'mta_achievements';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  unlocked: boolean;
  unlockedAt: number | null;
  category: 'combat' | 'exploration' | 'economy' | 'mastery';
}

const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // Combat
  { id: 'first_catch', name: 'First Collar', description: 'Catch your first fare evader', icon: '🚨', category: 'combat' },
  { id: 'catch_10', name: 'Beat Cop', description: 'Catch 10 fare evaders', icon: '👮', category: 'combat' },
  { id: 'catch_50', name: 'Top Detective', description: 'Catch 50 fare evaders', icon: '🕵️', category: 'combat' },
  { id: 'speed_catch', name: 'Lightning Hands', description: 'Catch an evader in under 15 seconds', icon: '⚡', category: 'combat' },
  { id: 'double_catch', name: 'Double Take', description: 'Complete the Double Trouble mission', icon: '👥', category: 'combat' },

  // Exploration
  { id: 'first_station', name: 'Tourist', description: 'Enter your first station', icon: '🚇', category: 'exploration' },
  { id: 'all_manhattan', name: 'Manhattan Master', description: 'Visit all 5 Manhattan stations', icon: '🗽', category: 'exploration' },
  { id: 'all_brooklyn', name: 'Brooklyn Native', description: 'Visit all 5 Brooklyn stations', icon: '🌉', category: 'exploration' },
  { id: 'all_queens', name: 'Queens Champion', description: 'Visit all 5 Queens stations', icon: '👑', category: 'exploration' },
  { id: 'night_rider', name: 'Night Owl', description: 'Play during the night cycle', icon: '🌙', category: 'exploration' },

  // Economy
  { id: 'earn_1000', name: 'Paid Up', description: 'Earn $1,000 total', icon: '💵', category: 'economy' },
  { id: 'earn_5000', name: 'Big Spender', description: 'Earn $5,000 total', icon: '💰', category: 'economy' },
  { id: 'buy_first', name: 'Shopping Spree', description: 'Buy your first item', icon: '🛒', category: 'economy' },
  { id: 'all_items', name: 'Fully Equipped', description: 'Own all items for a class', icon: '🎒', category: 'economy' },

  // Mastery
  { id: 'level_5', name: 'Veteran', description: 'Reach level 5', icon: '⭐', category: 'mastery' },
  { id: 'level_10', name: 'Legend', description: 'Reach level 10', icon: '🏆', category: 'mastery' },
  { id: 'all_police', name: 'Police Captain', description: 'Complete all police missions', icon: '🎖️', category: 'mastery' },
  { id: 'streak_7', name: 'Weekly Grinder', description: '7-day daily challenge streak', icon: '🔥', category: 'mastery' },
  { id: 'kingpin', name: 'Kingpin Hunter', description: 'Complete The Kingpin mission', icon: '👑', category: 'mastery' },
  { id: 'three_classes', name: 'Triple Threat', description: 'Play all 3 character classes', icon: '🎭', category: 'mastery' },
];

export class AchievementSystem {
  private achievements: Achievement[] = [];

  init(): void {
    const saved = this.load();
    this.achievements = ACHIEVEMENT_DEFS.map(def => {
      const existing = saved?.find(a => a.id === def.id);
      return {
        ...def,
        unlocked: existing?.unlocked ?? false,
        unlockedAt: existing?.unlockedAt ?? null,
      };
    });
  }

  /** Try to unlock an achievement. Returns it if newly unlocked, null if already unlocked or doesn't exist. */
  tryUnlock(id: string): Achievement | null {
    const ach = this.achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return null;

    ach.unlocked = true;
    ach.unlockedAt = Date.now();
    this.save();
    return ach;
  }

  /** Check stat-based achievements against current stats */
  checkStats(stats: {
    npcsCaught: number;
    totalMoneyEarned: number;
    highestLevel: number;
    completedMissions: string[];
    dailyStreak: number;
  }): Achievement[] {
    const newlyUnlocked: Achievement[] = [];

    const checks: [string, boolean][] = [
      ['first_catch', stats.npcsCaught >= 1],
      ['catch_10', stats.npcsCaught >= 10],
      ['catch_50', stats.npcsCaught >= 50],
      ['earn_1000', stats.totalMoneyEarned >= 1000],
      ['earn_5000', stats.totalMoneyEarned >= 5000],
      ['level_5', stats.highestLevel >= 5],
      ['level_10', stats.highestLevel >= 10],
      ['all_police', stats.completedMissions.filter(m => m.startsWith('police_')).length >= 10],
      ['kingpin', stats.completedMissions.includes('police_m10')],
      ['double_catch', stats.completedMissions.includes('police_m08')],
      ['streak_7', stats.dailyStreak >= 7],
    ];

    for (const [id, condition] of checks) {
      if (condition) {
        const result = this.tryUnlock(id);
        if (result) newlyUnlocked.push(result);
      }
    }

    return newlyUnlocked;
  }

  getAll(): Achievement[] {
    return this.achievements;
  }

  getUnlocked(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  getLocked(): Achievement[] {
    return this.achievements.filter(a => !a.unlocked);
  }

  getByCategory(category: string): Achievement[] {
    return this.achievements.filter(a => a.category === category);
  }

  getProgress(): { unlocked: number; total: number; percent: number } {
    const unlocked = this.getUnlocked().length;
    const total = this.achievements.length;
    return { unlocked, total, percent: Math.round((unlocked / total) * 100) };
  }

  private save(): void {
    localStorage.setItem(ACH_KEY, JSON.stringify(this.achievements));
  }

  private load(): Achievement[] | null {
    try {
      const raw = localStorage.getItem(ACH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
