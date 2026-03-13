import { useState, useCallback } from 'react';
import type { ProblemCategory, Screen } from '@/types';
import { TIER_CATEGORIES, CATEGORY_DISPLAY_NAMES, WEAK_CATEGORIES } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { AnswerInput } from '../game/AnswerInput';
import { Feedback } from '../game/Feedback';
import { HintPanel } from '../game/HintPanel';
import { ScoreBar } from '../game/ScoreBar';
import { HINTS } from '@/lib/problems/hints';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { ArrowLeft } from 'lucide-react';

interface PracticeScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function PracticeScreen({ onNavigate }: PracticeScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | null>(null);
  const [problem, setProblem] = useState<ReturnType<typeof generateProblem> | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; xp: number } | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, xp: 0 });

  const startCategory = useCallback((cat: ProblemCategory) => {
    setSelectedCategory(cat);
    setProblem(generateProblem(cat));
    setFeedback(null);
    setHintUsed(false);
    setStats({ correct: 0, total: 0, streak: 0, xp: 0 });
  }, []);

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
    const xp = calculateXp(isCorrect, 10000, hintUsed, newStreak);

    // Save to profile
    let data = loadData();
    const attempt = {
      problemId: problem.id,
      category: problem.category,
      tier: problem.tier,
      questionText: problem.questionText,
      correctAnswer: problem.correctAnswer,
      studentAnswer: answer,
      isCorrect,
      isEstimation: problem.isEstimation,
      timeMs: 10000,
      hintUsed,
      timestamp: Date.now(),
    };
    data.profile = updateCategoryStats(data.profile, attempt);
    data.profile = addXpToProfile(data.profile, xp);
    data.profile = updateDailyStreak(data.profile);
    saveData(data);

    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
      streak: newStreak,
      xp: prev.xp + xp,
    }));
    setFeedback({ isCorrect, xp });
  }, [problem, hintUsed, stats.streak]);

  const handleNext = useCallback(() => {
    if (!selectedCategory) return;
    setProblem(generateProblem(selectedCategory));
    setFeedback(null);
    setHintUsed(false);
  }, [selectedCategory]);

  // Topic selection view
  if (!selectedCategory) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f] mb-4">Practice Mode</h2>
        <p className="text-sm text-gray-500 mb-4">Choose a topic to practice. No timer pressure!</p>

        {([1, 2, 3, 4] as const).map(tier => (
          <div key={tier} className="mb-4">
            <div className={`text-sm font-bold mb-2 ${
              tier === 1 ? 'text-[#22c55e]' : tier === 2 ? 'text-[#3b82f6]' : tier === 3 ? 'text-[#f59e0b]' : 'text-[#a855f7]'
            }`}>
              Tier {tier}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {TIER_CATEGORIES[tier].map(cat => (
                <button
                  key={cat}
                  onClick={() => startCategory(cat)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all active:scale-95
                    ${WEAK_CATEGORIES.includes(cat)
                      ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border-gray-200 bg-white text-[#1e3a5f] hover:border-[#1e3a5f]'
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

  // Practice view
  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
          <ArrowLeft size={18} /> Topics
        </button>
        <ScoreBar correct={stats.correct} total={stats.total} streak={stats.streak} xp={stats.xp} />
      </div>

      <div className="text-center text-sm font-bold text-gray-400">
        {CATEGORY_DISPLAY_NAMES[selectedCategory]}
      </div>

      {problem && !feedback && (
        <>
          <ProblemDisplay problem={problem} />
          <AnswerInput
            onSubmit={handleSubmit}
            allowSlash={problem.category.includes('fraction')}
            allowDecimal={problem.category.includes('decimal')}
            allowText={problem.category === 'prime_numbers' || problem.category === 'arabic_to_roman'}
          />
          <HintPanel problem={problem} onUseHint={() => setHintUsed(true)} />
        </>
      )}

      {problem && feedback && (
        <Feedback
          isCorrect={feedback.isCorrect}
          correctAnswer={problem.correctAnswer}
          detailedSteps={problem.detailedSteps}
          commonMistake={HINTS[problem.category].commonMistake}
          xpEarned={feedback.xp}
          streak={stats.streak}
          onContinue={handleNext}
          autoAdvance={feedback.isCorrect}
          autoAdvanceMs={1500}
        />
      )}
    </div>
  );
}
