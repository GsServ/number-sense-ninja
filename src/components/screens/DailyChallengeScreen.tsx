import { useState, useCallback, useMemo } from 'react';
import type { Screen, Problem, ProblemAttempt, ProblemCategory } from '@/types';
import { CATEGORY_DISPLAY_NAMES } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { getDailySeed, getDailyCategories, getTodayDateStr, earnCoins, getDailyBounties, isBountyCategory } from '@/lib/gamification';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { MultipleChoice } from '../game/MultipleChoice';
import { Feedback } from '../game/Feedback';
import { ScoreBar } from '../game/ScoreBar';
import { StreakEffect } from '../game/StreakEffect';
import { HINTS } from '@/lib/problems/hints';
import { ArrowLeft, Calendar, Gift, Star } from 'lucide-react';

interface DailyChallengeScreenProps {
  onNavigate: (screen: Screen) => void;
}

const DAILY_COUNT = 10;

export function DailyChallengeScreen({ onNavigate }: DailyChallengeScreenProps) {
  const today = getTodayDateStr();
  const seed = getDailySeed();
  const categories = useMemo(() => getDailyCategories(seed), [seed]);

  const data = loadData();
  const alreadyDone = data.profile.dailyChallenge?.date === today && data.profile.dailyChallenge?.completed;

  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>(alreadyDone ? 'done' : 'intro');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; xp: number } | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, xp: 0, coins: 0 });
  const [problemIndex, setProblemIndex] = useState(0);

  // Bounties for today
  const bounties = useMemo(() => getDailyBounties(data.profile), []);

  const startChallenge = useCallback(() => {
    const cat = categories[0];
    setProblem(generateProblem(cat));
    setFeedback(null);
    setStats({ correct: 0, total: 0, streak: 0, xp: 0, coins: 0 });
    setProblemIndex(0);
    setPhase('playing');
  }, [categories]);

  const handleSubmit = useCallback((answer: string) => {
    if (!problem) return;

    let isCorrect = false;
    if (problem.isEstimation && problem.estimationRange) {
      const num = parseFloat(answer);
      isCorrect = !isNaN(num) && isEstimationCorrect(num, problem.estimationRange.exact);
    } else {
      isCorrect = answer.trim().toLowerCase() === problem.correctAnswer.trim().toLowerCase() ||
        (problem.acceptableAnswers?.some(a => a.toLowerCase() === answer.trim().toLowerCase()) ?? false);
    }

    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const xp = calculateXp(isCorrect, 8000, false, newStreak);

    let d = loadData();
    const bounty = isBountyCategory(d.profile, problem.category);
    const coins = earnCoins(isCorrect, newStreak, bounty);

    const attempt: ProblemAttempt = {
      problemId: problem.id, category: problem.category, tier: problem.tier,
      questionText: problem.questionText, correctAnswer: problem.correctAnswer,
      studentAnswer: answer, isCorrect, isEstimation: problem.isEstimation,
      timeMs: 8000, hintUsed: false, timestamp: Date.now(),
    };

    d.profile = updateCategoryStats(d.profile, attempt);
    d.profile = addXpToProfile(d.profile, xp);
    d.profile = updateDailyStreak(d.profile);
    d.profile.coins = (d.profile.coins || 0) + coins;
    saveData(d);

    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: newStreak,
      xp: prev.xp + xp,
      coins: prev.coins + coins,
    }));
    setFeedback({ isCorrect, xp });
  }, [problem, stats.streak]);

  const handleNext = useCallback(() => {
    const next = problemIndex + 1;
    if (next >= DAILY_COUNT) {
      // Save daily challenge result
      let d = loadData();
      d.profile.dailyChallenge = {
        date: today,
        seed,
        score: stats.correct + (feedback?.isCorrect ? 1 : 0),
        completed: true,
        attempts: [],
      };
      // Completion bonus
      d.profile.coins = (d.profile.coins || 0) + 5;
      d.profile = addXpToProfile(d.profile, 25);
      saveData(d);
      setPhase('done');
      return;
    }
    setProblemIndex(next);
    setProblem(generateProblem(categories[next % categories.length]));
    setFeedback(null);
  }, [problemIndex, categories, today, seed, stats.correct, feedback]);

  // Intro
  if (phase === 'intro') {
    return (
      <div className="px-4 py-8 max-w-md mx-auto text-center space-y-5">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="text-5xl">📅</div>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Daily Challenge</h2>
        <p className="text-gray-600">{DAILY_COUNT} problems. Same for everyone today!</p>

        <div className="bg-white border border-gray-200 rounded-xl p-4 text-left">
          <div className="text-xs font-bold text-gray-400 mb-2">TODAY'S TOPICS</div>
          <div className="flex flex-wrap gap-1.5">
            {categories.slice(0, 5).map(cat => (
              <span key={cat} className="px-2 py-0.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded-full text-xs font-bold">
                {CATEGORY_DISPLAY_NAMES[cat]}
              </span>
            ))}
          </div>
        </div>

        {/* Daily Bounties */}
        <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-4 text-left">
          <div className="flex items-center gap-1 text-xs font-bold text-[#b45309] mb-2">
            <Gift size={14} /> TODAY'S BOUNTIES (3x COINS!)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {bounties.categories.map(cat => (
              <span key={cat} className="px-2 py-0.5 bg-[#fbbf24]/20 text-[#b45309] rounded-full text-xs font-bold">
                {CATEGORY_DISPLAY_NAMES[cat]}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={startChallenge}
          className="px-8 py-4 bg-[#3b82f6] text-white font-extrabold rounded-xl text-xl
                     hover:bg-[#2563eb] active:scale-95 transition-all shadow-lg"
        >
          Start Challenge
        </button>
      </div>
    );
  }

  // Done
  if (phase === 'done') {
    const finalScore = stats.correct;
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">{finalScore >= 8 ? '🌟' : finalScore >= 5 ? '✨' : '💪'}</div>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Daily Challenge Complete!</h2>
        <div className="text-4xl font-black text-[#3b82f6]">{finalScore}/{DAILY_COUNT}</div>
        <div className="flex justify-center gap-4 text-sm">
          <span className="font-bold text-[#f59e0b]">+{stats.xp + 25} XP</span>
          <span className="font-bold text-[#eab308]">+{stats.coins + 5} coins</span>
        </div>
        <button onClick={() => onNavigate('home')}
          className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all">
          Home
        </button>
      </div>
    );
  }

  // Playing
  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <StreakEffect streak={stats.streak} />
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-1 text-sm font-bold text-gray-400">
          <Calendar size={14} /> {problemIndex + 1}/{DAILY_COUNT}
        </div>
      </div>

      <ScoreBar correct={stats.correct} total={stats.total} streak={stats.streak} xp={stats.xp} />

      {problem && !feedback && (
        <>
          <ProblemDisplay problem={problem} />
          <MultipleChoice problem={problem} onSubmit={handleSubmit} />
        </>
      )}

      {problem && feedback && (
        <Feedback
          isCorrect={feedback.isCorrect}
          correctAnswer={problem.correctAnswer}
          detailedSteps={problem.detailedSteps}
          commonMistake={HINTS[problem.category]?.commonMistake}
          xpEarned={feedback.xp}
          streak={stats.streak}
          onContinue={handleNext}
        />
      )}
    </div>
  );
}
