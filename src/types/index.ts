export type ProblemTier = 1 | 2 | 3 | 4;

export type ProblemCategory =
  // Tier 1
  | 'single_digit_add' | 'single_digit_sub' | 'two_digit_add' | 'two_digit_add_carry'
  | 'two_digit_sub' | 'two_digit_sub_borrow' | 'money_conversion' | 'clock_reading'
  | 'unit_conversion' | 'geometry_facts' | 'place_value' | 'rounding'
  | 'comparing_numbers' | 'basic_multiplication' | 'number_ordering'
  | 'estimation_addition'
  // Tier 2
  | 'three_digit_add' | 'three_digit_sub_borrow' | 'four_digit_sub'
  | 'what_number_added_to' | 'mult_facts_789' | 'division_facts'
  | 'multi_step_ops' | 'sequences_patterns' | 'repeated_addition'
  | 'fraction_shaded_area' | 'estimation_subtraction' | 'estimation_large_addition'
  // Tier 3
  | 'multiply_by_11' | 'multiply_by_25' | 'multiply_by_50'
  | 'simplify_fractions' | 'perimeter_rectangle' | 'perimeter_square'
  | 'area_rectangle' | 'area_square' | 'area_triangle'
  | 'word_problems' | 'decimal_add_sub' | 'estimation_multiplication'
  // Tier 4
  | 'roman_to_arabic' | 'arabic_to_roman' | 'series_1_to_n'
  | 'series_odd_numbers' | 'series_arithmetic' | 'order_of_operations'
  | 'squaring' | 'division_remainder' | 'percentages' | 'prime_numbers';

export interface Problem {
  id: string;
  category: ProblemCategory;
  tier: ProblemTier;
  questionText: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  isEstimation: boolean;
  estimationRange?: {
    exact: number;
    low: number;
    high: number;
  };
  hint: string;
  detailedSteps: string[];
  trickName: string;
  visualData?: FractionVisualData;
}

export interface FractionVisualData {
  total: number;
  shaded: number;
  cols: number;
  rows: number;
}

export interface ProblemAttempt {
  problemId: string;
  category: ProblemCategory;
  tier: ProblemTier;
  questionText: string;
  correctAnswer: string;
  studentAnswer: string;
  isCorrect: boolean;
  isEstimation: boolean;
  timeMs: number;
  hintUsed: boolean;
  timestamp: number;
}

export type GameMode = 'practice' | 'speed_drill' | 'test_sim' | 'estimation' | 'ninja_race' | 'boss_battle' | 'daily_challenge' | 'tournament';

export interface GameSession {
  id: string;
  mode: GameMode;
  startTime: number;
  endTime?: number;
  category?: ProblemCategory;
  attempts: ProblemAttempt[];
  psiaScore?: number;
}

export type CategoryStats = {
  totalAttempts: number;
  correctLast20: number;
  attemptsLast20: number;
  avgTimeMs: number;
  mastered: boolean;
};

export interface CategorySnapshot {
  date: string; // ISO date
  accuracy: number; // 0-1
  avgTimeMs: number;
  totalAttempts: number;
}

// Belt system
export type Belt = 'white' | 'yellow' | 'orange' | 'green' | 'blue' | 'purple' | 'brown' | 'black' | 'gold';

export const BELT_ORDER: Belt[] = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'black', 'gold'];

export const BELT_COLORS: Record<Belt, string> = {
  white: '#e5e7eb', yellow: '#fbbf24', orange: '#f97316', green: '#22c55e',
  blue: '#3b82f6', purple: '#a855f7', brown: '#92400e', black: '#1e293b', gold: '#eab308',
};

export const BELT_REQUIREMENTS: Record<Belt, { totalProblems: number; accuracy: number; categoriesMastered: number }> = {
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

// Shop items
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  type: 'avatar' | 'theme' | 'powerup' | 'title';
  icon: string;
}

// Boss battle
export interface BossState {
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  playerHp: number;
  playerMaxHp: number;
  defeated: boolean;
}

// Daily challenge
export interface DailyChallenge {
  date: string; // ISO date
  seed: number;
  score: number;
  completed: boolean;
  attempts: ProblemAttempt[];
}

// Tournament
export interface TournamentEntry {
  weekId: string; // e.g. "2026-W11"
  score: number;
  time: number;
  completedAt: number;
}

// Problem bounties
export interface DailyBounty {
  date: string;
  categories: ProblemCategory[];
  completed: ProblemCategory[];
}

export interface UserProfile {
  name: string;
  totalXp: number;
  level: number;
  dailyStreak: number;
  lastPracticeDate: string;
  sessions: GameSession[];
  categoryStats: Partial<Record<ProblemCategory, CategoryStats>>;
  categoryHistory: Partial<Record<ProblemCategory, CategorySnapshot[]>>;
  lastSnapshotDate?: string;
  // Gamification
  coins: number;
  belt: Belt;
  streakFreezes: number;
  ownedItems: string[];
  equippedAvatar: string;
  equippedTheme: string;
  equippedTitle: string;
  bossesDefeated: number;
  dailyChallenge?: DailyChallenge;
  tournaments: TournamentEntry[];
  dailyBounty?: DailyBounty;
  ninjaRaceWins: number;
  ninjaRaceLosses: number;
  bestRaceStreak: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  coachPin: string;
}

export interface StoredData {
  profile: UserProfile;
  settings: AppSettings;
}

export type Screen = 'home' | 'practice' | 'speed_drill' | 'test_sim' | 'estimation' | 'stats' | 'review_mistakes' | 'ninja_race' | 'boss_battle' | 'daily_challenge' | 'shop' | 'tournament';

export const TIER_CATEGORIES: Record<ProblemTier, ProblemCategory[]> = {
  1: [
    'single_digit_add', 'single_digit_sub', 'two_digit_add', 'two_digit_add_carry',
    'two_digit_sub', 'two_digit_sub_borrow', 'money_conversion', 'clock_reading',
    'unit_conversion', 'geometry_facts', 'place_value', 'rounding',
    'comparing_numbers', 'basic_multiplication', 'number_ordering',
  ],
  2: [
    'three_digit_add', 'three_digit_sub_borrow', 'four_digit_sub',
    'what_number_added_to', 'mult_facts_789', 'division_facts',
    'multi_step_ops', 'sequences_patterns', 'repeated_addition',
    'fraction_shaded_area',
  ],
  3: [
    'multiply_by_11', 'multiply_by_25', 'multiply_by_50',
    'simplify_fractions', 'perimeter_rectangle', 'perimeter_square',
    'area_rectangle', 'area_square', 'area_triangle',
    'word_problems', 'decimal_add_sub',
  ],
  4: [
    'roman_to_arabic', 'arabic_to_roman', 'series_1_to_n',
    'series_odd_numbers', 'series_arithmetic', 'order_of_operations',
    'squaring', 'division_remainder', 'percentages', 'prime_numbers',
  ],
};

export const ESTIMATION_CATEGORIES: ProblemCategory[] = [
  'estimation_addition', 'estimation_subtraction', 'estimation_large_addition', 'estimation_multiplication',
];

export const CATEGORY_DISPLAY_NAMES: Record<ProblemCategory, string> = {
  single_digit_add: 'Single Digit +',
  single_digit_sub: 'Single Digit −',
  two_digit_add: '2-Digit +',
  two_digit_add_carry: '2-Digit + (carry)',
  two_digit_sub: '2-Digit −',
  two_digit_sub_borrow: '2-Digit − (borrow)',
  money_conversion: 'Money',
  clock_reading: 'Clock/Time',
  unit_conversion: 'Units',
  geometry_facts: 'Geometry Facts',
  place_value: 'Place Value',
  rounding: 'Rounding',
  comparing_numbers: 'Comparing',
  basic_multiplication: 'Basic ×',
  number_ordering: 'Number Order',
  estimation_addition: '★ Est. Addition',
  three_digit_add: '3-Digit +',
  three_digit_sub_borrow: '3-Digit − (borrow)',
  four_digit_sub: '4-Digit −',
  what_number_added_to: '? + X = Y',
  mult_facts_789: '× Facts 7,8,9',
  division_facts: 'Division Facts',
  multi_step_ops: 'Multi-Step',
  sequences_patterns: 'Sequences',
  repeated_addition: 'Repeated +',
  fraction_shaded_area: 'Fraction Shaded',
  estimation_subtraction: '★ Est. Subtraction',
  estimation_large_addition: '★ Est. Large +',
  multiply_by_11: '× 11 Trick',
  multiply_by_25: '× 25 Trick',
  multiply_by_50: '× 50 Trick',
  simplify_fractions: 'Simplify Fractions',
  perimeter_rectangle: 'Perimeter Rect.',
  perimeter_square: 'Perimeter Sq.',
  area_rectangle: 'Area Rect.',
  area_square: 'Area Sq.',
  area_triangle: 'Area Triangle',
  word_problems: 'Word Problems',
  decimal_add_sub: 'Decimal ±',
  estimation_multiplication: '★ Est. ×',
  roman_to_arabic: 'Roman → Number',
  arabic_to_roman: 'Number → Roman',
  series_1_to_n: 'Series 1+2+...+n',
  series_odd_numbers: 'Odd Number Series',
  series_arithmetic: 'Arithmetic Series',
  order_of_operations: 'Order of Ops',
  squaring: 'Squaring',
  division_remainder: 'Division Remainder',
  percentages: 'Percentages',
  prime_numbers: 'Prime Numbers',
};

export const WEAK_CATEGORIES: ProblemCategory[] = [
  'three_digit_sub_borrow', 'four_digit_sub', 'what_number_added_to',
  'mult_facts_789', 'fraction_shaded_area', 'money_conversion',
  'clock_reading',
];

export function getTierForCategory(cat: ProblemCategory): ProblemTier {
  for (const [tier, cats] of Object.entries(TIER_CATEGORIES)) {
    if (cats.includes(cat)) return Number(tier) as ProblemTier;
  }
  if (ESTIMATION_CATEGORIES.includes(cat)) {
    if (cat === 'estimation_addition') return 1;
    if (cat === 'estimation_subtraction' || cat === 'estimation_large_addition') return 2;
    return 3;
  }
  return 1;
}

export const LEVEL_NAMES: string[] = [
  'Number Newbie',       // 0
  'Math Mouse',          // 1 - 100
  'Addition Ace',        // 2 - 300
  'Subtraction Star',    // 3 - 600
  'Multiplication Master',// 4 - 1000
  'Division Dynamo',     // 5 - 1500
  'Speed Sprinter',      // 6 - 2200
  'Trick Trickster',     // 7 - 3000
  'Estimation Expert',   // 8 - 4000
  'Number Ninja',        // 9 - 5200
  'Mental Math Warrior', // 10 - 6600
  'Calculation Champion',// 11 - 8200
  'Brain Blaster',       // 12 - 10000
  'Lightning Calculator',// 13 - 12000
  'Ultra Ninja',         // 14 - 14500
  'Grandmaster',         // 15 - 17500
  'Legendary Ninja',     // 16 - 21000
  'Number Sense God',    // 17 - 25000
];

export const LEVEL_THRESHOLDS: number[] = [
  0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200,
  6600, 8200, 10000, 12000, 14500, 17500, 21000, 25000,
];

export function getLevelForXp(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}
