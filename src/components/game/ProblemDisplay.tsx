import type { Problem } from '@/types';
import { FractionGrid } from './FractionGrid';
import { Star } from 'lucide-react';

interface ProblemDisplayProps {
  problem: Problem;
  index?: number;
  total?: number;
}

export function ProblemDisplay({ problem, index, total }: ProblemDisplayProps) {
  return (
    <div className="text-center animate-pop-in">
      {index != null && total != null && (
        <div className="text-sm font-semibold text-gray-400 mb-1">
          Q{index + 1} of {total}
        </div>
      )}

      {problem.isEstimation && (
        <div className="inline-flex items-center gap-1 bg-[#fbbf24]/20 text-[#b45309] px-3 py-1 rounded-full text-sm font-bold mb-2">
          <Star size={14} fill="currentColor" /> Estimation — within 5% is correct!
        </div>
      )}

      <div className="text-3xl md:text-4xl font-extrabold text-[#1e3a5f] leading-relaxed px-4">
        {problem.questionText}
      </div>

      {problem.visualData && (
        <div className="mt-4 flex justify-center">
          <FractionGrid
            total={problem.visualData.total}
            shaded={problem.visualData.shaded}
            cols={problem.visualData.cols}
            rows={problem.visualData.rows}
          />
        </div>
      )}
    </div>
  );
}
