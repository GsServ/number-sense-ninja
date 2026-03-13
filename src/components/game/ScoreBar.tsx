import { Flame, Zap } from 'lucide-react';

interface ScoreBarProps {
  correct: number;
  total: number;
  streak: number;
  xp: number;
}

export function ScoreBar({ correct, total, streak, xp }: ScoreBarProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex items-center justify-between gap-3 text-sm font-bold px-2">
      <div className="flex items-center gap-1 text-[#22c55e]">
        {correct}/{total}
        <span className="text-gray-400 font-normal">({accuracy}%)</span>
      </div>

      {streak >= 2 && (
        <div className="flex items-center gap-1 text-[#f59e0b]">
          <Flame size={16} className={streak >= 5 ? 'animate-flame' : ''} />
          {streak}
        </div>
      )}

      <div className="flex items-center gap-1 text-[#a855f7]">
        <Zap size={16} />
        {xp} XP
      </div>
    </div>
  );
}
