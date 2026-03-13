import { useState, useCallback, useMemo } from 'react';
import type { Screen, ProblemAttempt, ProblemCategory, UserProfile } from '@/types';
import { CATEGORY_DISPLAY_NAMES } from '@/types';
import { detectErrorPatterns, getRecentMistakes, type ErrorPattern } from '@/lib/errorPatterns';
import { generateProblem } from '@/lib/problems/generator';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { HINTS } from '@/lib/problems/hints';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { AnswerInput } from '../game/AnswerInput';
import { Feedback } from '../game/Feedback';
import { HintPanel } from '../game/HintPanel';
import { ScoreBar } from '../game/ScoreBar';
import { ArrowLeft, AlertTriangle, Repeat, TrendingDown, ChevronRight, Brain } from 'lucide-react';

interface ReviewMistakesScreenProps {
  profile: UserProfile;
  onNavigate: (screen: Screen) => void;
}

type ReviewView = 'overview' | 'pattern_detail' | 'retry_session';

export function ReviewMistakesScreen({ profile, onNavigate }: ReviewMistakesScreenProps) {
  const [view, setView] = useState<ReviewView>('overview');
  const [selectedPattern, setSelectedPattern] = useState<ErrorPattern | null>(null);
  const [retryCategory, setRetryCategory] = useState<ProblemCategory | null>(null);

  // Retry session state
  const [problem, setProblem] = useState<ReturnType<typeof generateProblem> | null>(null);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; xp: number } | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, xp: 0 });
  const [retryCount, setRetryCount] = useState(0);

  const RETRY_TOTAL = 10;

  const mistakes = useMemo(() => getRecentMistakes(profile.sessions, 100), [profile]);
  const patterns = useMemo(() => detectErrorPatterns(mistakes), [mistakes]);

  // Group mistakes by category
  const mistakesByCategory = useMemo(() => {
    const map: Record<string, ProblemAttempt[]> = {};
    for (const m of mistakes) {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    }
    return Object.entries(map)
      .map(([cat, attempts]) => ({ category: cat as ProblemCategory, attempts, count: attempts.length }))
      .sort((a, b) => b.count - a.count);
  }, [mistakes]);

  const startRetry = useCallback((cat: ProblemCategory) => {
    setRetryCategory(cat);
    setProblem(generateProblem(cat));
    setFeedback(null);
    setHintUsed(false);
    setStats({ correct: 0, total: 0, streak: 0, xp: 0 });
    setRetryCount(0);
    setView('retry_session');
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

    let data = loadData();
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
    if (!retryCategory) return;
    const next = retryCount + 1;
    if (next >= RETRY_TOTAL) {
      setView('overview');
      return;
    }
    setRetryCount(next);
    setProblem(generateProblem(retryCategory));
    setFeedback(null);
    setHintUsed(false);
  }, [retryCategory, retryCount]);

  // ── Retry Session View ──
  if (view === 'retry_session' && retryCategory) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('overview')} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
            <ArrowLeft size={18} /> Back
          </button>
          <div className="text-sm font-bold text-gray-400">{retryCount + 1}/{RETRY_TOTAL}</div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1 bg-[#ef4444]/10 text-[#ef4444] px-3 py-1 rounded-full text-xs font-bold">
            <Repeat size={12} /> Retry: {CATEGORY_DISPLAY_NAMES[retryCategory]}
          </div>
        </div>

        <ScoreBar correct={stats.correct} total={stats.total} streak={stats.streak} xp={stats.xp} />

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
            commonMistake={HINTS[problem.category]?.commonMistake}
            xpEarned={feedback.xp}
            streak={stats.streak}
            onContinue={handleNext}
          />
        )}
      </div>
    );
  }

  // ── Pattern Detail View ──
  if (view === 'pattern_detail' && selectedPattern) {
    return (
      <div className="px-4 py-6 max-w-md mx-auto space-y-4">
        <button onClick={() => setView('overview')} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={20} className="text-red-500" />
            <div className="font-extrabold text-red-700 text-lg">{selectedPattern.name}</div>
          </div>
          <div className="text-sm text-red-600 mb-1">{selectedPattern.description}</div>
          <div className="text-xs text-gray-500">
            In: {CATEGORY_DISPLAY_NAMES[selectedPattern.category]} — happened {selectedPattern.count} time{selectedPattern.count !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="font-bold text-[#1e3a5f] text-sm mb-3">Examples</div>
          {selectedPattern.examples.map((ex, i) => (
            <div key={i} className="py-2 border-b border-gray-100 last:border-0">
              <div className="text-sm font-semibold text-[#1e3a5f]">{ex.question}</div>
              <div className="flex gap-4 mt-1 text-sm">
                <span className="text-red-500">Wrote: <span className="font-bold">{ex.studentAnswer}</span></span>
                <span className="text-[#22c55e]">Correct: <span className="font-bold">{ex.correctAnswer}</span></span>
              </div>
            </div>
          ))}
        </div>

        {/* Hint/Trick for this category */}
        <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-4">
          <div className="font-bold text-[#b45309] text-sm mb-1">
            💡 {HINTS[selectedPattern.category]?.trickName ?? 'Tip'}
          </div>
          <div className="text-sm text-gray-700">{HINTS[selectedPattern.category]?.hint}</div>
          {HINTS[selectedPattern.category]?.commonMistake && (
            <div className="mt-2 text-sm text-red-600">
              ⚠️ {HINTS[selectedPattern.category].commonMistake}
            </div>
          )}
        </div>

        <button
          onClick={() => startRetry(selectedPattern.category)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#ef4444] text-white
                     font-bold rounded-xl text-lg hover:bg-[#dc2626] active:scale-95 transition-all"
        >
          <Repeat size={20} /> Practice This ({RETRY_TOTAL} problems)
        </button>
      </div>
    );
  }

  // ── Overview ──
  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-5">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center gap-2">
        <Brain size={24} className="text-[#ef4444]" />
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Review Mistakes</h2>
      </div>

      {mistakes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">🎉</div>
          <div className="font-bold text-lg">No mistakes yet!</div>
          <div className="text-sm">Go practice and come back here to review any wrong answers.</div>
        </div>
      ) : (
        <>
          {/* Error Patterns */}
          {patterns.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-sm font-bold text-red-600 mb-2">
                <TrendingDown size={16} /> Error Patterns Detected
              </div>
              <div className="space-y-2">
                {patterns.slice(0, 8).map((pattern, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedPattern(pattern); setView('pattern_detail'); }}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between
                               hover:border-red-300 active:scale-[0.98] transition-all"
                  >
                    <div>
                      <div className="font-bold text-[#1e3a5f] text-sm">{pattern.name}</div>
                      <div className="text-xs text-gray-500">
                        {CATEGORY_DISPLAY_NAMES[pattern.category]} — {pattern.count}x
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        pattern.count >= 5 ? 'bg-red-100 text-red-600' :
                        pattern.count >= 3 ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      }`}>
                        {pattern.count}
                      </div>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mistakes by Category */}
          <div>
            <div className="text-sm font-bold text-[#1e3a5f] mb-2">Mistakes by Topic</div>
            <div className="space-y-2">
              {mistakesByCategory.slice(0, 10).map(({ category, count }) => (
                <div
                  key={category}
                  className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#1e3a5f] text-sm">{CATEGORY_DISPLAY_NAMES[category]}</div>
                    <div className="text-xs text-gray-400">{count} recent mistake{count !== 1 ? 's' : ''}</div>
                  </div>
                  <button
                    onClick={() => startRetry(category)}
                    className="px-3 py-1.5 bg-[#ef4444] text-white text-xs font-bold rounded-lg
                               hover:bg-[#dc2626] active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Repeat size={12} /> Retry
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Wrong Answers */}
          <div>
            <div className="text-sm font-bold text-[#1e3a5f] mb-2">Recent Wrong Answers</div>
            <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
              {mistakes.slice(0, 15).map((m, i) => (
                <div key={i} className="p-3">
                  <div className="text-sm font-semibold text-[#1e3a5f]">{m.questionText}</div>
                  <div className="flex gap-4 mt-1 text-xs">
                    <span className="text-red-500">Wrote: <span className="font-bold">{m.studentAnswer}</span></span>
                    <span className="text-[#22c55e]">Correct: <span className="font-bold">{m.correctAnswer}</span></span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {CATEGORY_DISPLAY_NAMES[m.category]} — {new Date(m.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
