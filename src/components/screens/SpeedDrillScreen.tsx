import { useState, useCallback, useRef, useEffect } from 'react';
import type { ProblemCategory, Screen, Problem, ProblemAttempt } from '@/types';
import { TIER_CATEGORIES, CATEGORY_DISPLAY_NAMES, WEAK_CATEGORIES } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { selectNextCategory } from '@/lib/adaptive';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { MultipleChoice } from '../game/MultipleChoice';
import { ScoreBar } from '../game/ScoreBar';
import { ResultsSummary } from '../game/ResultsSummary';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak, getBestTestSimScore } from '@/lib/stats';
import { ArrowLeft, Clock } from 'lucide-react';

interface SpeedDrillScreenProps {
  onNavigate: (screen: Screen) => void;
}

const DRILL_COUNT = 20;

export function SpeedDrillScreen({ onNavigate }: SpeedDrillScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | 'adaptive' | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<ProblemAttempt[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [done, setDone] = useState(false);
  const [flashState, setFlashState] = useState<'correct' | 'wrong' | null>(null);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);
  const problemStart = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (selectedCategory && !done) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - problemStart.current);
      }, 100);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [selectedCategory, done, currentIndex]);

  const startDrill = useCallback((cat: ProblemCategory | 'adaptive') => {
    const data = loadData();
    const generated: Problem[] = [];
    for (let i = 0; i < DRILL_COUNT; i++) {
      if (cat === 'adaptive') {
        const chosen = selectNextCategory(data.profile);
        generated.push(generateProblem(chosen));
      } else {
        generated.push(generateProblem(cat));
      }
    }
    setSelectedCategory(cat);
    setProblems(generated);
    setCurrentIndex(0);
    setAttempts([]);
    setStreak(0);
    setTotalXp(0);
    setDone(false);
    problemStart.current = Date.now();
  }, []);

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
    data.profile = updateCategoryStats(data.profile, attempt);
    data.profile = addXpToProfile(data.profile, xp);
    data.profile = updateDailyStreak(data.profile);

    const newAttempts = [...attempts, attempt];
    setAttempts(newAttempts);
    setStreak(newStreak);
    setTotalXp(prev => prev + xp);

    // Flash feedback
    setFlashState(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect) setWrongAnswer(problem.correctAnswer);

    const advanceDelay = isCorrect ? 300 : 1500;
    setTimeout(() => {
      setFlashState(null);
      setWrongAnswer(null);

      if (currentIndex + 1 >= DRILL_COUNT) {
        // Save session
        const session = {
          id: `s_${Date.now()}`,
          mode: 'speed_drill' as const,
          startTime: newAttempts[0].timestamp,
          endTime: Date.now(),
          category: selectedCategory === 'adaptive' ? undefined : selectedCategory ?? undefined,
          attempts: newAttempts,
        };
        data.profile.sessions.push(session);
        saveData(data);
        setDone(true);
      } else {
        saveData(data);
        setCurrentIndex(prev => prev + 1);
        problemStart.current = Date.now();
      }
    }, advanceDelay);
  }, [problems, currentIndex, streak, attempts, selectedCategory]);

  // Topic selection
  if (!selectedCategory) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f] mb-2">Speed Drill</h2>
        <p className="text-sm text-gray-500 mb-4">20 problems, as fast as you can!</p>

        <button
          onClick={() => startDrill('adaptive')}
          className="w-full mb-4 px-4 py-4 bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] text-white
                     font-bold rounded-xl text-lg active:scale-95 transition-all shadow-md"
        >
          🎯 All Topics (Adaptive)
        </button>

        {([1, 2, 3, 4] as const).map(tier => (
          <div key={tier} className="mb-3">
            <div className={`text-xs font-bold mb-1.5 ${
              tier === 1 ? 'text-[#22c55e]' : tier === 2 ? 'text-[#3b82f6]' : tier === 3 ? 'text-[#f59e0b]' : 'text-[#a855f7]'
            }`}>
              Tier {tier}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIER_CATEGORIES[tier].map(cat => (
                <button
                  key={cat}
                  onClick={() => startDrill(cat)}
                  className={`text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all active:scale-95
                    ${WEAK_CATEGORIES.includes(cat)
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-[#1e3a5f]'
                    }`}
                >
                  {CATEGORY_DISPLAY_NAMES[cat]}
                  {WEAK_CATEGORIES.includes(cat) && <span className="text-red-500 ml-1">●</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Done
  if (done) {
    return (
      <ResultsSummary
        attempts={attempts}
        xpEarned={totalXp + 50}
        onBack={() => { setSelectedCategory(null); setDone(false); }}
      />
    );
  }

  // Drill view
  const problem = problems[currentIndex];
  const correct = attempts.filter(a => a.isCorrect).length;
  const secs = (elapsed / 1000).toFixed(1);

  return (
    <div className={`px-4 py-6 max-w-md mx-auto space-y-4 transition-colors duration-200 ${
      flashState === 'correct' ? 'bg-[#22c55e]/10' : flashState === 'wrong' ? 'bg-[#ef4444]/10' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-400">
          {currentIndex + 1} / {DRILL_COUNT}
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-gray-500">
          <Clock size={14} /> {secs}s
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-[#22c55e] h-2 rounded-full transition-all"
          style={{ width: `${(currentIndex / DRILL_COUNT) * 100}%` }}
        />
      </div>

      <ScoreBar correct={correct} total={attempts.length} streak={streak} xp={totalXp} />

      {problem && (
        <>
          <ProblemDisplay problem={problem} />

          {wrongAnswer && (
            <div className="text-center text-lg font-bold text-[#ef4444] animate-pop-in">
              Answer: {wrongAnswer}
            </div>
          )}

          {!flashState && (
            <MultipleChoice problem={problem} onSubmit={handleSubmit} />
          )}
        </>
      )}
    </div>
  );
}
