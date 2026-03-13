import type { ProblemAttempt } from '@/types';
import { CATEGORY_DISPLAY_NAMES } from '@/types';
import { Trophy, Target, Clock, TrendingUp, ArrowLeft } from 'lucide-react';

interface ResultsSummaryProps {
  attempts: ProblemAttempt[];
  xpEarned: number;
  psiaScore?: number;
  isPersonalBest?: boolean;
  onBack: () => void;
  onPracticeCategory?: (cat: string) => void;
}

export function ResultsSummary({
  attempts,
  xpEarned,
  psiaScore,
  isPersonalBest,
  onBack,
}: ResultsSummaryProps) {
  const correct = attempts.filter(a => a.isCorrect).length;
  const wrong = attempts.filter(a => !a.isCorrect && a.studentAnswer !== '').length;
  const skipped = attempts.filter(a => a.studentAnswer === '').length;
  const total = attempts.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const avgTime = total > 0 ? Math.round(attempts.reduce((s, a) => s + a.timeMs, 0) / total / 100) / 10 : 0;

  // Find weakest category
  const catMap: Record<string, { correct: number; total: number }> = {};
  for (const a of attempts) {
    if (!catMap[a.category]) catMap[a.category] = { correct: 0, total: 0 };
    catMap[a.category].total++;
    if (a.isCorrect) catMap[a.category].correct++;
  }
  const weakest = Object.entries(catMap)
    .map(([cat, s]) => ({ cat, accuracy: s.total > 0 ? s.correct / s.total : 1, ...s }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="px-4 py-6 space-y-5 max-w-md mx-auto">
      {isPersonalBest && (
        <div className="text-center animate-pop-in">
          <div className="text-4xl mb-2">🏆</div>
          <div className="text-xl font-extrabold text-[#f59e0b]">New Personal Best!</div>
        </div>
      )}

      {psiaScore != null && (
        <div className="text-center">
          <div className="text-sm font-semibold text-gray-400 uppercase">PSIA Score</div>
          <div className="text-6xl font-black text-[#1e3a5f] animate-count-up">{psiaScore}</div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Target size={20} />} label="Accuracy" value={`${accuracy}%`} color="text-[#22c55e]" />
        <StatCard icon={<Clock size={20} />} label="Avg Time" value={`${avgTime}s`} color="text-[#3b82f6]" />
        <StatCard icon={<TrendingUp size={20} />} label="Correct" value={`${correct}/${total}`} color="text-[#22c55e]" />
        <StatCard icon={<Trophy size={20} />} label="XP Earned" value={`+${xpEarned}`} color="text-[#a855f7]" />
      </div>

      {psiaScore != null && (
        <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
          <div className="font-bold text-[#1e3a5f] mb-2">Score Breakdown</div>
          <div className="text-[#22c55e]">+{correct * 5} from {correct} correct</div>
          <div className="text-[#ef4444]">−{wrong * 2} from {wrong} wrong</div>
          {skipped > 0 && <div className="text-[#ef4444]">−{skipped * 2} from {skipped} skipped</div>}
        </div>
      )}

      {weakest.length > 0 && weakest[0].accuracy < 1 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="font-bold text-red-600 text-sm mb-2">Areas to Practice</div>
          {weakest.slice(0, 3).filter(w => w.accuracy < 0.8).map(w => (
            <div key={w.cat} className="text-sm text-red-700">
              {CATEGORY_DISPLAY_NAMES[w.cat as keyof typeof CATEGORY_DISPLAY_NAMES] ?? w.cat}: {w.correct}/{w.total} correct
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white
                   font-bold rounded-xl text-lg hover:bg-[#2a5a8f] active:scale-95 transition-all"
      >
        <ArrowLeft size={20} /> Back to Menu
      </button>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
      <div className={`flex items-center justify-center gap-1 mb-1 ${color}`}>{icon}</div>
      <div className="text-xs text-gray-400 uppercase">{label}</div>
      <div className={`text-xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
