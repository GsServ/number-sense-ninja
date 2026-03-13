import { useState, useCallback } from 'react';
import type { Screen, Problem, ProblemAttempt } from '@/types';
import {
  generateEstimationAddition, generateEstimationSubtraction,
  generateEstimationLargeAddition, generateEstimationMultiplication,
} from '@/lib/problems/estimation';
import { generateProblem } from '@/lib/problems/generator';
import { selectNextCategory } from '@/lib/adaptive';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { AnswerInput } from '../game/AnswerInput';
import { Feedback } from '../game/Feedback';
import { EstimationNumberLine } from '../game/EstimationNumberLine';
import { ScoreBar } from '../game/ScoreBar';
import { ResultsSummary } from '../game/ResultsSummary';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { HINTS } from '@/lib/problems/hints';
import { ArrowLeft } from 'lucide-react';

interface EstimationScreenProps {
  onNavigate: (screen: Screen) => void;
}

type EstLevel = 1 | 2 | 3 | 4;

export function EstimationScreen({ onNavigate }: EstimationScreenProps) {
  const [level, setLevel] = useState<EstLevel | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; xp: number; studentAnswer: number } | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, xp: 0 });
  const [problemCount, setProblemCount] = useState(0);
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
  const [done, setDone] = useState(false);

  const MAX_PROBLEMS = 10;

  const generateForLevel = useCallback((lvl: EstLevel): Problem => {
    if (lvl === 1) {
      // Rounding basics - not real estimation, but rounding practice
      const num = Math.floor(Math.random() * 9 + 1) * 100 + Math.floor(Math.random() * 100);
      const rounded = Math.round(num / 100) * 100;
      return {
        id: `est_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        category: 'estimation_addition',
        tier: 1,
        questionText: `Round ${num} to the nearest hundred`,
        correctAnswer: String(rounded),
        isEstimation: false,
        hint: 'Look at the tens digit. 5+ rounds up, 0-4 rounds down.',
        trickName: 'Rounding',
        detailedSteps: [`Tens digit of ${num} is ${Math.floor((num % 100) / 10)}.`, `${num} rounds to ${rounded}.`],
      };
    }
    if (lvl === 2 || lvl === 3) {
      const generators = [generateEstimationAddition, generateEstimationSubtraction, generateEstimationLargeAddition, generateEstimationMultiplication];
      return generators[Math.floor(Math.random() * generators.length)]();
    }
    // Level 4: mixed - every 3rd is estimation
    if (problemCount % 3 === 2) {
      const generators = [generateEstimationAddition, generateEstimationSubtraction, generateEstimationMultiplication];
      return generators[Math.floor(Math.random() * generators.length)]();
    } else {
      const data = loadData();
      const cat = selectNextCategory(data.profile);
      return generateProblem(cat);
    }
  }, [problemCount]);

  const startLevel = useCallback((lvl: EstLevel) => {
    setLevel(lvl);
    setStats({ correct: 0, total: 0, streak: 0, xp: 0 });
    setProblemCount(0);
    setAttempts([]);
    setDone(false);
    setProblem(generateForLevel(lvl));
    setFeedback(null);
  }, [generateForLevel]);

  const handleSubmit = useCallback((answer: string) => {
    if (!problem) return;

    let isCorrect = false;
    const numAnswer = parseFloat(answer);

    if (problem.isEstimation && problem.estimationRange) {
      isCorrect = !isNaN(numAnswer) && isEstimationCorrect(numAnswer, problem.estimationRange.exact);
    } else {
      isCorrect = answer.trim().toLowerCase() === problem.correctAnswer.trim().toLowerCase();
    }

    const newStreak = isCorrect ? stats.streak + 1 : 0;
    const xp = calculateXp(isCorrect, 10000, false, newStreak);

    const attempt: ProblemAttempt = {
      problemId: problem.id,
      category: problem.category,
      tier: problem.tier,
      questionText: problem.questionText,
      correctAnswer: problem.correctAnswer,
      studentAnswer: answer,
      isCorrect,
      isEstimation: problem.isEstimation,
      timeMs: 10000,
      hintUsed: false,
      timestamp: Date.now(),
    };

    let data = loadData();
    data.profile = updateCategoryStats(data.profile, attempt);
    data.profile = addXpToProfile(data.profile, xp);
    data.profile = updateDailyStreak(data.profile);
    saveData(data);

    setAttempts(prev => [...prev, attempt]);
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: newStreak,
      xp: prev.xp + xp,
    }));
    setFeedback({ isCorrect, xp, studentAnswer: numAnswer });
  }, [problem, stats.streak]);

  const handleNext = useCallback(() => {
    if (!level) return;
    const nextCount = problemCount + 1;
    if (nextCount >= MAX_PROBLEMS) {
      setDone(true);
      return;
    }
    setProblemCount(nextCount);
    setProblem(generateForLevel(level));
    setFeedback(null);
  }, [level, problemCount, generateForLevel]);

  if (!level) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f] mb-2">⭐ Estimation Training</h2>
        <p className="text-sm text-gray-500 mb-6">Master the art of quick estimation!</p>

        <div className="space-y-3">
          {[
            { lvl: 1 as EstLevel, title: 'Level 1: Rounding Basics', desc: 'Practice rounding to the nearest hundred', color: 'bg-[#22c55e]' },
            { lvl: 2 as EstLevel, title: 'Level 2: Guided Estimation', desc: 'Full estimation problems with guidance', color: 'bg-[#3b82f6]' },
            { lvl: 3 as EstLevel, title: 'Level 3: Full Estimation', desc: 'Estimate directly — see your accuracy on a number line', color: 'bg-[#f59e0b]' },
            { lvl: 4 as EstLevel, title: 'Level 4: Mixed Reality', desc: 'Regular math mixed with starred estimation problems', color: 'bg-[#a855f7]' },
          ].map(({ lvl, title, desc, color }) => (
            <button
              key={lvl}
              onClick={() => startLevel(lvl)}
              className={`w-full text-left ${color} text-white rounded-xl p-4 active:scale-95 transition-all shadow-md`}
            >
              <div className="font-bold text-lg">{title}</div>
              <div className="text-sm opacity-90">{desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <ResultsSummary
        attempts={attempts}
        xpEarned={stats.xp}
        onBack={() => setLevel(null)}
      />
    );
  }

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setLevel(null)} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
          <ArrowLeft size={18} /> Levels
        </button>
        <div className="text-sm font-bold text-gray-400">{problemCount + 1}/{MAX_PROBLEMS}</div>
      </div>

      <ScoreBar correct={stats.correct} total={stats.total} streak={stats.streak} xp={stats.xp} />

      {problem && !feedback && (
        <>
          <ProblemDisplay problem={problem} />
          <AnswerInput onSubmit={handleSubmit} allowDecimal />
        </>
      )}

      {problem && feedback && (
        <>
          {problem.isEstimation && problem.estimationRange && !isNaN(feedback.studentAnswer) && (
            <EstimationNumberLine
              exact={problem.estimationRange.exact}
              low={problem.estimationRange.low}
              high={problem.estimationRange.high}
              studentAnswer={feedback.studentAnswer}
            />
          )}
          <Feedback
            isCorrect={feedback.isCorrect}
            correctAnswer={problem.correctAnswer}
            detailedSteps={problem.detailedSteps}
            commonMistake={HINTS[problem.category]?.commonMistake}
            xpEarned={feedback.xp}
            streak={stats.streak}
            onContinue={handleNext}
          />
        </>
      )}
    </div>
  );
}
