import type {
  UserProfile, Belt, ProblemCategory, ShopItem, DailyBounty, DailyChallenge,
  BELT_ORDER, BELT_REQUIREMENTS,
} from '@/types';
import { TIER_CATEGORIES } from '@/types';

// ── Belt System ──

export function calculateBelt(profile: UserProfile): Belt {
  const belts: Belt[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black', 'gold'];
  const reqs: Record<Belt, { totalProblems: number; accuracy: number; categoriesMastered: number }> = {
    white:  { totalProblems: 0, accuracy: 0, categoriesMastered: 0 },
    yellow: { totalProblems: 50, accuracy: 0.5, categoriesMastered: 2 },
    orange: { totalProblems: 150, accuracy: 0.55, categoriesMastered: 5 },
    green:  { totalProblems: 300, accuracy: 0.6, categoriesMastered: 8 },
    blue:   { totalProblems: 500, accuracy: 0.65, categoriesMastered: 12 },
    purple: { totalProblems: 800, accuracy: 0.7, categoriesMastered: 18 },
    brown:  { totalProblems: 1200, accuracy: 0.75, categoriesMastered: 25 },
    black:  { totalProblems: 2000, accuracy: 0.8, categoriesMastered: 35 },
    gold:   { totalProblems: 3500, accuracy: 0.85, categoriesMastered: 45 },
  };

  const totalProblems = getTotalProblems(profile);
  const overallAccuracy = getOverallAccuracy(profile);
  const mastered = getMasteredCount(profile);

  let currentBelt: Belt = 'white';
  for (const belt of belts) {
    const req = reqs[belt];
    if (totalProblems >= req.totalProblems && overallAccuracy >= req.accuracy && mastered >= req.categoriesMastered) {
      currentBelt = belt;
    }
  }
  return currentBelt;
}

function getTotalProblems(profile: UserProfile): number {
  let total = 0;
  for (const s of profile.sessions) total += s.attempts.length;
  return total;
}

function getOverallAccuracy(profile: UserProfile): number {
  let total = 0, correct = 0;
  for (const s of profile.sessions) {
    for (const a of s.attempts) {
      if (a.studentAnswer !== '') {
        total++;
        if (a.isCorrect) correct++;
      }
    }
  }
  return total > 0 ? correct / total : 0;
}

function getMasteredCount(profile: UserProfile): number {
  let count = 0;
  for (const stats of Object.values(profile.categoryStats)) {
    if (stats?.mastered) count++;
  }
  return count;
}

// ── Coin Economy ──

export function earnCoins(isCorrect: boolean, streak: number, isBounty: boolean): number {
  if (!isCorrect) return 0;
  let coins = 1;
  if (streak >= 3) coins += 1;
  if (streak >= 5) coins += 1;
  if (streak >= 10) coins += 2;
  if (isBounty) coins *= 3;
  return coins;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Avatars
  { id: 'avatar_dragon', name: 'Dragon Ninja', description: 'A fierce dragon avatar', cost: 50, type: 'avatar', icon: '🐉' },
  { id: 'avatar_robot', name: 'Math Robot', description: 'A calculating robot', cost: 50, type: 'avatar', icon: '🤖' },
  { id: 'avatar_wizard', name: 'Number Wizard', description: 'A magical math wizard', cost: 75, type: 'avatar', icon: '🧙' },
  { id: 'avatar_astronaut', name: 'Space Ninja', description: 'Math in outer space!', cost: 100, type: 'avatar', icon: '🧑‍🚀' },
  { id: 'avatar_cat', name: 'Math Cat', description: 'A purr-fect mathematician', cost: 40, type: 'avatar', icon: '🐱' },
  { id: 'avatar_dino', name: 'Dino Calculator', description: 'T-Rex at math!', cost: 60, type: 'avatar', icon: '🦖' },
  // Themes
  { id: 'theme_dark', name: 'Dark Mode', description: 'Sleek dark theme', cost: 80, type: 'theme', icon: '🌙' },
  { id: 'theme_ocean', name: 'Ocean', description: 'Deep sea vibes', cost: 60, type: 'theme', icon: '🌊' },
  { id: 'theme_fire', name: 'Fire', description: 'Blazing hot theme', cost: 60, type: 'theme', icon: '🔥' },
  { id: 'theme_galaxy', name: 'Galaxy', description: 'Stars and nebulas', cost: 100, type: 'theme', icon: '🌌' },
  // Power-ups
  { id: 'streak_freeze', name: 'Streak Freeze', description: 'Protects your daily streak for 1 day', cost: 30, type: 'powerup', icon: '🧊' },
  { id: 'double_xp', name: 'Double XP (1 session)', description: '2x XP for your next session', cost: 40, type: 'powerup', icon: '⚡' },
  { id: 'double_coins', name: 'Double Coins (1 session)', description: '2x coins for your next session', cost: 35, type: 'powerup', icon: '💰' },
  // Titles
  { id: 'title_champion', name: 'Champion', description: 'Display "Champion" title', cost: 120, type: 'title', icon: '🏆' },
  { id: 'title_legend', name: 'Legend', description: 'Display "Legend" title', cost: 200, type: 'title', icon: '⭐' },
  { id: 'title_sensei', name: 'Sensei', description: 'Display "Sensei" title', cost: 150, type: 'title', icon: '🥋' },
];

// ── Streak Powers ──

export type StreakPower = {
  threshold: number;
  name: string;
  emoji: string;
  color: string;
};

export const STREAK_POWERS: StreakPower[] = [
  { threshold: 3, name: 'On Fire!', emoji: '🔥', color: '#f59e0b' },
  { threshold: 5, name: 'BLAZING!', emoji: '💥', color: '#ef4444' },
  { threshold: 10, name: 'UNSTOPPABLE!', emoji: '⚡', color: '#a855f7' },
  { threshold: 15, name: 'GODLIKE!', emoji: '🌟', color: '#eab308' },
];

export function getStreakPower(streak: number): StreakPower | null {
  let best: StreakPower | null = null;
  for (const p of STREAK_POWERS) {
    if (streak >= p.threshold) best = p;
  }
  return best;
}

// ── Boss Battles ──

export const BOSSES = [
  { name: 'Digit Goblin', emoji: '👹', hp: 10, tier: 1 as const },
  { name: 'Fraction Phantom', emoji: '👻', hp: 12, tier: 2 as const },
  { name: 'Multiplication Monster', emoji: '🐙', hp: 15, tier: 2 as const },
  { name: 'Division Dragon', emoji: '🐲', hp: 18, tier: 3 as const },
  { name: 'Algebra Alien', emoji: '👽', hp: 20, tier: 3 as const },
  { name: 'The Final Ninja', emoji: '🥷', hp: 25, tier: 4 as const },
];

export function getBossForLevel(bossesDefeated: number) {
  return BOSSES[Math.min(bossesDefeated, BOSSES.length - 1)];
}

// ── Daily Challenge ──

export function getDailySeed(): number {
  const today = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

// Seeded random for daily challenge
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function getDailyCategories(seed: number): ProblemCategory[] {
  const rand = seededRandom(seed);
  const allCats: ProblemCategory[] = [
    ...TIER_CATEGORIES[1], ...TIER_CATEGORIES[2],
    ...TIER_CATEGORIES[3], ...TIER_CATEGORIES[4],
  ];
  // Shuffle with seed
  const shuffled = [...allCats];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10);
}

// ── Daily Bounties ──

export function getDailyBounties(profile: UserProfile): DailyBounty {
  const today = getTodayDateStr();
  if (profile.dailyBounty?.date === today) return profile.dailyBounty;

  const seed = getDailySeed() + 777;
  const rand = seededRandom(seed);
  const allCats: ProblemCategory[] = [
    ...TIER_CATEGORIES[1], ...TIER_CATEGORIES[2],
    ...TIER_CATEGORIES[3], ...TIER_CATEGORIES[4],
  ];
  const shuffled = [...allCats];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return {
    date: today,
    categories: shuffled.slice(0, 3),
    completed: [],
  };
}

export function isBountyCategory(profile: UserProfile, cat: ProblemCategory): boolean {
  const bounty = getDailyBounties(profile);
  return bounty.categories.includes(cat);
}

// ── Ninja Race ──

export function getNinjaSpeed(profile: UserProfile): number {
  // Ninja solves faster as player wins more
  const wins = profile.ninjaRaceWins;
  // Base: 8 seconds per problem, decreases with wins
  return Math.max(3000, 8000 - wins * 200);
}

// ── Weekly Tournament ──

export function getCurrentWeekId(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}
