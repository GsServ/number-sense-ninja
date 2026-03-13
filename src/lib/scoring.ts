import type { ProblemAttempt } from '@/types';

export function calculatePSIAScore(attempts: ProblemAttempt[], totalAttempted: number): number {
  let score = 0;
  const lastIdx = totalAttempted - 1;

  for (let i = 0; i <= lastIdx; i++) {
    const attempt = attempts[i];
    if (!attempt || attempt.studentAnswer === '') {
      score -= 2; // skipped
    } else if (attempt.isCorrect) {
      score += 5;
    } else {
      score -= 2;
    }
  }

  return score;
}

export function isEstimationCorrect(studentAnswer: number, exactAnswer: number): boolean {
  const low = Math.floor(exactAnswer * 0.95);
  const high = Math.ceil(exactAnswer * 1.05);
  return studentAnswer >= low && studentAnswer <= high;
}

export function calculateXp(
  isCorrect: boolean,
  timeMs: number,
  hintUsed: boolean,
  streak: number,
): number {
  if (!isCorrect) return 0;
  let xp = 10;
  if (timeMs < 5000) xp += 5; // speed bonus
  if (!hintUsed) xp += 3;     // no hint bonus
  xp += Math.min(streak * 2, 20); // streak bonus capped at 20
  return xp;
}
