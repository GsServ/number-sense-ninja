import type { UserProfile, ProblemAttempt, CategoryStats, GameSession, ProblemCategory, CategorySnapshot } from '@/types';
import { getLevelForXp, TIER_CATEGORIES } from '@/types';

export function updateCategoryStats(
  profile: UserProfile,
  attempt: ProblemAttempt,
): UserProfile {
  const stats = profile.categoryStats[attempt.category] ?? {
    totalAttempts: 0,
    correctLast20: 0,
    attemptsLast20: 0,
    avgTimeMs: 0,
    mastered: false,
  };

  stats.totalAttempts++;
  stats.attemptsLast20 = Math.min(stats.attemptsLast20 + 1, 20);

  // Recalculate last20 from recent sessions
  const recentAttempts = getRecentAttemptsForCategory(profile, attempt.category, 20);
  recentAttempts.push(attempt);
  const last20 = recentAttempts.slice(-20);
  stats.attemptsLast20 = last20.length;
  stats.correctLast20 = last20.filter(a => a.isCorrect).length;
  stats.avgTimeMs = last20.reduce((sum, a) => sum + a.timeMs, 0) / last20.length;
  stats.mastered = stats.attemptsLast20 >= 10 &&
    (stats.correctLast20 / stats.attemptsLast20) > 0.9 &&
    stats.avgTimeMs < 5000;

  return {
    ...profile,
    categoryStats: { ...profile.categoryStats, [attempt.category]: stats },
  };
}

function getRecentAttemptsForCategory(
  profile: UserProfile,
  category: ProblemCategory,
  limit: number,
): ProblemAttempt[] {
  const all: ProblemAttempt[] = [];
  // Go through sessions in reverse to get most recent
  for (let i = profile.sessions.length - 1; i >= 0 && all.length < limit; i--) {
    const session = profile.sessions[i];
    for (let j = session.attempts.length - 1; j >= 0 && all.length < limit; j--) {
      if (session.attempts[j].category === category) {
        all.unshift(session.attempts[j]);
      }
    }
  }
  return all;
}

export function updateDailyStreak(profile: UserProfile): UserProfile {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Take daily snapshot for long-term history
  let updated = takeDailySnapshot(profile);

  if (updated.lastPracticeDate === today) {
    return updated; // already practiced today
  }

  let newStreak = 1;
  if (updated.lastPracticeDate === yesterday) {
    newStreak = updated.dailyStreak + 1;
  }

  return {
    ...updated,
    dailyStreak: newStreak,
    lastPracticeDate: today,
  };
}

export function addXpToProfile(profile: UserProfile, xp: number): UserProfile {
  const newXp = profile.totalXp + xp;
  return {
    ...profile,
    totalXp: newXp,
    level: getLevelForXp(newXp),
  };
}

export function getTodayStats(profile: UserProfile): { problemsDone: number; accuracy: number } {
  const today = new Date().toISOString().split('T')[0];
  let total = 0;
  let correct = 0;

  for (const session of profile.sessions) {
    const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
    if (sessionDate === today) {
      for (const a of session.attempts) {
        total++;
        if (a.isCorrect) correct++;
      }
    }
  }

  return { problemsDone: total, accuracy: total > 0 ? correct / total : 0 };
}

export function getBestTestSimScore(profile: UserProfile): number {
  let best = 0;
  for (const session of profile.sessions) {
    if (session.mode === 'test_sim' && session.psiaScore != null && session.psiaScore > best) {
      best = session.psiaScore;
    }
  }
  return best;
}

export function getTestSimScores(profile: UserProfile): { date: string; score: number }[] {
  return profile.sessions
    .filter(s => s.mode === 'test_sim' && s.psiaScore != null)
    .map(s => ({
      date: new Date(s.startTime).toLocaleDateString(),
      score: s.psiaScore!,
    }));
}

/**
 * Take a daily snapshot of category stats for long-term trend tracking.
 * Only creates one snapshot per day per category. Keeps last 90 days.
 */
export function takeDailySnapshot(profile: UserProfile): UserProfile {
  const today = new Date().toISOString().split('T')[0];
  if (profile.lastSnapshotDate === today) return profile;

  const history = { ...profile.categoryHistory };
  const allCats: ProblemCategory[] = [
    ...TIER_CATEGORIES[1], ...TIER_CATEGORIES[2],
    ...TIER_CATEGORIES[3], ...TIER_CATEGORIES[4],
  ];

  for (const cat of allCats) {
    const stats = profile.categoryStats[cat];
    if (!stats || stats.totalAttempts === 0) continue;

    const snapshot: CategorySnapshot = {
      date: today,
      accuracy: stats.attemptsLast20 > 0 ? stats.correctLast20 / stats.attemptsLast20 : 0,
      avgTimeMs: stats.avgTimeMs,
      totalAttempts: stats.totalAttempts,
    };

    const catHistory = history[cat] ?? [];
    // Don't add duplicate for same day
    if (catHistory.length > 0 && catHistory[catHistory.length - 1].date === today) {
      catHistory[catHistory.length - 1] = snapshot;
    } else {
      catHistory.push(snapshot);
    }
    // Keep last 90 days
    if (catHistory.length > 90) {
      catHistory.splice(0, catHistory.length - 90);
    }
    history[cat] = catHistory;
  }

  return {
    ...profile,
    categoryHistory: history,
    lastSnapshotDate: today,
  };
}

/**
 * Get the history timeline for a specific category.
 */
export function getCategoryHistory(profile: UserProfile, category: ProblemCategory): CategorySnapshot[] {
  return profile.categoryHistory[category] ?? [];
}

/**
 * Get all attempts for a category across all sessions (not just last 20).
 */
export function getAllAttemptsForCategory(profile: UserProfile, category: ProblemCategory): ProblemAttempt[] {
  const all: ProblemAttempt[] = [];
  for (const session of profile.sessions) {
    for (const a of session.attempts) {
      if (a.category === category) all.push(a);
    }
  }
  return all;
}
