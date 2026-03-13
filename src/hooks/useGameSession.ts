import { useState, useCallback, useRef } from 'react';
import type { Problem, ProblemAttempt, GameSession, GameMode, ProblemCategory, UserProfile } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { selectNextCategory } from '@/lib/adaptive';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { loadData, saveData } from '@/lib/storage';

interface UseGameSessionOptions {
  mode: GameMode;
  problems?: Problem[];
  category?: ProblemCategory;
  totalProblems?: number;
  onSessionEnd?: (session: GameSession) => void;
}

export function useGameSession({
  mode,
  problems: presetProblems,
  category,
  totalProblems = 20,
  onSessionEnd,
}: UseGameSessionOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(
    presetProblems?.[0] ?? null,
  );
  const [streak, setStreak] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const problemStartTime = useRef(Date.now());
  const sessionId = useRef(`s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

  const allProblems = useRef<Problem[]>(presetProblems ?? []);

  const getNextProblem = useCallback((): Problem | null => {
    const nextIdx = currentIndex + 1;
    if (presetProblems && nextIdx < presetProblems.length) {
      return presetProblems[nextIdx];
    }
    if (!presetProblems && nextIdx < totalProblems) {
      const data = loadData();
      const cat = category ?? selectNextCategory(data.profile);
      return generateProblem(cat);
    }
    return null;
  }, [currentIndex, presetProblems, totalProblems, category]);

  const initSession = useCallback(() => {
    if (!presetProblems && !currentProblem) {
      const data = loadData();
      const cat = category ?? selectNextCategory(data.profile);
      const prob = generateProblem(cat);
      setCurrentProblem(prob);
      allProblems.current = [prob];
    }
    problemStartTime.current = Date.now();
  }, [presetProblems, currentProblem, category]);

  const submitAnswer = useCallback((studentAnswer: string) => {
    if (!currentProblem || sessionComplete) return null;

    const timeMs = Date.now() - problemStartTime.current;
    let isCorrect = false;

    if (currentProblem.isEstimation && currentProblem.estimationRange) {
      const numAnswer = parseFloat(studentAnswer);
      isCorrect = !isNaN(numAnswer) && isEstimationCorrect(numAnswer, currentProblem.estimationRange.exact);
    } else {
      const normalized = studentAnswer.trim().toLowerCase();
      const correctNormalized = currentProblem.correctAnswer.trim().toLowerCase();
      isCorrect = normalized === correctNormalized ||
        (currentProblem.acceptableAnswers?.some(a => a.toLowerCase() === normalized) ?? false);
    }

    const attempt: ProblemAttempt = {
      problemId: currentProblem.id,
      category: currentProblem.category,
      tier: currentProblem.tier,
      questionText: currentProblem.questionText,
      correctAnswer: currentProblem.correctAnswer,
      studentAnswer,
      isCorrect,
      isEstimation: currentProblem.isEstimation,
      timeMs,
      hintUsed,
      timestamp: Date.now(),
    };

    const newStreak = isCorrect ? streak + 1 : 0;
    const xp = calculateXp(isCorrect, timeMs, hintUsed, newStreak);

    setAttempts(prev => [...prev, attempt]);
    setStreak(newStreak);
    setTotalXpEarned(prev => prev + xp);

    // Update profile
    let data = loadData();
    data.profile = updateCategoryStats(data.profile, attempt);
    data.profile = addXpToProfile(data.profile, xp);
    data.profile = updateDailyStreak(data.profile);
    saveData(data);

    return { attempt, xp, isCorrect, newStreak };
  }, [currentProblem, sessionComplete, hintUsed, streak]);

  const nextProblem = useCallback(() => {
    const next = getNextProblem();
    if (next) {
      setCurrentIndex(prev => prev + 1);
      setCurrentProblem(next);
      setHintUsed(false);
      problemStartTime.current = Date.now();
      allProblems.current.push(next);
    } else {
      finishSession();
    }
  }, [getNextProblem]);

  const skipProblem = useCallback(() => {
    if (!currentProblem || sessionComplete) return;

    const attempt: ProblemAttempt = {
      problemId: currentProblem.id,
      category: currentProblem.category,
      tier: currentProblem.tier,
      questionText: currentProblem.questionText,
      correctAnswer: currentProblem.correctAnswer,
      studentAnswer: '',
      isCorrect: false,
      isEstimation: currentProblem.isEstimation,
      timeMs: Date.now() - problemStartTime.current,
      hintUsed: false,
      timestamp: Date.now(),
    };

    setAttempts(prev => [...prev, attempt]);
    setStreak(0);
    nextProblem();
  }, [currentProblem, sessionComplete, nextProblem]);

  const finishSession = useCallback(() => {
    const session: GameSession = {
      id: sessionId.current,
      mode,
      startTime: attempts.length > 0 ? attempts[0].timestamp : Date.now(),
      endTime: Date.now(),
      category,
      attempts: [...attempts],
    };

    // Save session
    const data = loadData();
    data.profile.sessions.push(session);
    saveData(data);

    setSessionComplete(true);
    onSessionEnd?.(session);
    return session;
  }, [mode, category, attempts, onSessionEnd]);

  const useHint = useCallback(() => {
    setHintUsed(true);
  }, []);

  return {
    currentProblem,
    currentIndex,
    attempts,
    streak,
    totalXpEarned,
    sessionComplete,
    hintUsed,
    initSession,
    submitAnswer,
    nextProblem,
    skipProblem,
    finishSession,
    useHint,
    totalProblems: presetProblems?.length ?? totalProblems,
  };
}
