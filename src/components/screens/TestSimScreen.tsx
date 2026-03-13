import { useState, useCallback, useRef, useEffect } from 'react';
import type { Screen, Problem, ProblemAttempt } from '@/types';
import { generateTestSimProblems } from '@/lib/problems/generator';
import { calculatePSIAScore, isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { MultipleChoice } from '../game/MultipleChoice';
import { Timer } from '../game/Timer';
import { ResultsSummary } from '../game/ResultsSummary';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak, getBestTestSimScore } from '@/lib/stats';
import { earnCoins, isBountyCategory } from '@/lib/gamification';
import { ArrowLeft, SkipForward, AlertTriangle } from 'lucide-react';
import { useTimer } from '@/hooks/useTimer';

const TEN_MINUTES = 10 * 60 * 1000;

interface TestSimScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function TestSimScreen({ onNavigate }: TestSimScreenProps) {
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [psiaScore, setPsiaScore] = useState(0);
  const [isPersonalBest, setIsPersonalBest] = useState(false);
  const problemStart = useRef(Date.now());

  const timer = useTimer({
    initialMs: TEN_MINUTES,
    countDown: true,
    onComplete: () => finishTest(),
  });

  const startTest = useCallback(() => {
    const generated = generateTestSimProblems();
    setProblems(generated);
    setCurrentIndex(0);
    setAttempts([]);
    setTotalXp(0);
    setStreak(0);
    setPhase('running');
    problemStart.current = Date.now();
    timer.reset(TEN_MINUTES);
    setTimeout(() => timer.start(), 100);
  }, [timer]);

  const finishTest = useCallback(() => {
    timer.stop();
    const totalAttempted = attempts.length;
    const score = calculatePSIAScore(attempts, totalAttempted);
    setPsiaScore(score);

    const data = loadData();
    const prevBest = getBestTestSimScore(data.profile);
    const newBest = score > prevBest;
    setIsPersonalBest(newBest);

    // Bonus XP
    let bonusXp = 100; // completion bonus
    if (newBest) bonusXp += 200;
    setTotalXp(prev => prev + bonusXp);
    data.profile = addXpToProfile(data.profile, bonusXp);

    const session = {
      id: `s_${Date.now()}`,
      mode: 'test_sim' as const,
      startTime: attempts.length > 0 ? attempts[0].timestamp : Date.now(),
      endTime: Date.now(),
      attempts,
      psiaScore: score,
    };
    data.profile.sessions.push(session);
    data.profile = updateDailyStreak(data.profile);
    saveData(data);

    setPhase('done');
  }, [attempts, timer]);

  const handleSubmit = useCallback((answer: string) => {
    const problem = problems[currentIndex];
    if (!problem) return;

    const timeMs = Date.now() - problemStart.current;
    let isCorrect = false;
    if (problem.isEstimation && problem.estimationRange) {
      const num = parseFloat(answer);
      isCorrect = !isNaN(num) && isEstimationCorrect(num, problem.estimationRange.exact);
    } else {
      isCorrect = answer.trim().toLowerCase() === problem.correctAnswer.trim().toLowerCase() ||
        (problem.acceptableAnswers?.some(a => a.toLowerCase() === answer.trim().toLowerCase()) ?? false);
    }

    const newStreak = isCorrect ? streak + 1 : 0;
    const xp = calculateXp(isCorrect, timeMs, false, newStreak);

    const attempt: ProblemAttempt = {
      problemId: problem.id,
      category: problem.category,
      tier: problem.tier,
      questionText: problem.questionText,
      correctAnswer: problem.correctAnswer,
      studentAnswer: answer,
      isCorrect,
      isEstimation: problem.isEstimation,
      timeMs,
      hintUsed: false,
      timestamp: Date.now(),
    };

    let data = loadData();
    const bounty = isBountyCategory(data.profile, problem.category);
    const coinEarned = earnCoins(isCorrect, newStreak, bounty);
    data.profile = updateCategoryStats(data.profile, attempt);
    data.profile = addXpToProfile(data.profile, xp);
    data.profile.coins = (data.profile.coins || 0) + coinEarned;
    saveData(data);

    setAttempts(prev => [...prev, attempt]);
    setStreak(newStreak);
    setTotalXp(prev => prev + xp);

    if (currentIndex + 1 >= 80) {
      finishTest();
    } else {
      setCurrentIndex(prev => prev + 1);
      problemStart.current = Date.now();
    }
  }, [problems, currentIndex, streak, finishTest]);

  const handleSkip = useCallback(() => {
    const problem = problems[currentIndex];
    if (!problem) return;

    const attempt: ProblemAttempt = {
      problemId: problem.id,
      category: problem.category,
      tier: problem.tier,
      questionText: problem.questionText,
      correctAnswer: problem.correctAnswer,
      studentAnswer: '',
      isCorrect: false,
      isEstimation: problem.isEstimation,
      timeMs: Date.now() - problemStart.current,
      hintUsed: false,
      timestamp: Date.now(),
    };

    setAttempts(prev => [...prev, attempt]);
    setStreak(0);

    if (currentIndex + 1 >= 80) {
      finishTest();
    } else {
      setCurrentIndex(prev => prev + 1);
      problemStart.current = Date.now();
    }
  }, [problems, currentIndex, finishTest]);

  // Ready screen
  if (phase === 'ready') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="text-5xl">⏱️</div>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">PSIA Number Sense Test</h2>
        <p className="text-gray-600">10 minutes. 80 problems. Mental math only!</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 text-left">
          <div className="font-bold mb-1">Scoring Rules:</div>
          <div>+5 correct, −2 wrong, −2 per skip between first and last attempted</div>
        </div>
        <button
          onClick={startTest}
          className="px-8 py-4 bg-[#ef4444] text-white font-extrabold rounded-xl text-xl
                     hover:bg-[#dc2626] active:scale-95 transition-all shadow-lg"
        >
          Start Test
        </button>
      </div>
    );
  }

  // Done screen
  if (phase === 'done') {
    return (
      <ResultsSummary
        attempts={attempts}
        xpEarned={totalXp}
        psiaScore={psiaScore}
        isPersonalBest={isPersonalBest}
        onBack={() => { setPhase('ready'); onNavigate('home'); }}
      />
    );
  }

  // Running
  const problem = problems[currentIndex];
  const progress = ((currentIndex) / 80) * 100;

  return (
    <div className="px-4 py-4 max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <Timer formatted={timer.formatted} ms={timer.ms} countDown totalMs={TEN_MINUTES} large />
        <button
          onClick={finishTest}
          className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
        >
          End Test
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-[#3b82f6] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="text-center text-sm font-bold text-gray-400">
        Q{currentIndex + 1} of 80
      </div>

      {problem && (
        <>
          <ProblemDisplay problem={problem} />
          <MultipleChoice problem={problem} onSubmit={handleSubmit} />
        </>
      )}

      <button
        onClick={handleSkip}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-400
                   hover:text-red-600 py-2 transition-colors"
      >
        <SkipForward size={16} />
        <AlertTriangle size={14} /> Skip (−2 pts)
      </button>
    </div>
  );
}
