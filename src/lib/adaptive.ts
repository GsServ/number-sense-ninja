import type { ProblemCategory, CategoryStats, UserProfile } from '@/types';
import { TIER_CATEGORIES, WEAK_CATEGORIES, ESTIMATION_CATEGORIES } from '@/types';

export function selectNextCategory(profile: UserProfile, allowedCategories?: ProblemCategory[]): ProblemCategory {
  const allCats: ProblemCategory[] = allowedCategories ?? [
    ...TIER_CATEGORIES[1], ...TIER_CATEGORIES[2],
    ...TIER_CATEGORIES[3], ...TIER_CATEGORIES[4],
  ];

  const weights: { cat: ProblemCategory; weight: number }[] = allCats.map(cat => {
    let weight = 1;
    const stats = profile.categoryStats[cat];

    if (WEAK_CATEGORIES.includes(cat)) {
      weight *= 2; // base elevation for known weak areas
    }

    if (stats && stats.attemptsLast20 >= 5) {
      const accuracy = stats.correctLast20 / stats.attemptsLast20;
      if (accuracy < 0.6) weight *= 5;
      else if (accuracy < 0.8) weight *= 3;
      if (stats.mastered) weight *= 0.5;
    } else {
      // Not enough data — slight boost to encourage exploration
      weight *= 1.5;
    }

    return { cat, weight };
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const { cat, weight } of weights) {
    rand -= weight;
    if (rand <= 0) return cat;
  }

  return allCats[0];
}

export function getWeakestCategories(profile: UserProfile, count = 5): ProblemCategory[] {
  const allCats: ProblemCategory[] = [
    ...TIER_CATEGORIES[1], ...TIER_CATEGORIES[2],
    ...TIER_CATEGORIES[3], ...TIER_CATEGORIES[4],
  ];

  const scored = allCats.map(cat => {
    const stats = profile.categoryStats[cat];
    if (!stats || stats.attemptsLast20 < 3) {
      return { cat, score: WEAK_CATEGORIES.includes(cat) ? 0 : 0.5 };
    }
    return { cat, score: stats.correctLast20 / stats.attemptsLast20 };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, count).map(s => s.cat);
}
