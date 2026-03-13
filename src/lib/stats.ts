import type { UserProfile, ProblemAttempt, CategoryStats, GameSession, ProblemCategory } from '@/types';
import { getLevelForXp } from '@/types';

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

  if (profile.lastPracticeDate === today) {
    return profile; // already practiced today
  }

  let newStreak = 1;
  if (profile.lastPracticeDate === yesterday) {
    newStreak = profile.dailyStreak + 1;
  }

  return {
    ...profile,
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
