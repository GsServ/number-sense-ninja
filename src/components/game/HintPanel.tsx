import { useState } from 'react';
import { Lightbulb, BookOpen } from 'lucide-react';
import type { Problem } from '@/types';

interface HintPanelProps {
  problem: Problem;
  onUseHint: () => void;
}

export function HintPanel({ problem, onUseHint }: HintPanelProps) {
  const [showHint, setShowHint] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto space-y-2">
      {!showHint && (
        <button
          onClick={() => { setShowHint(true); onUseHint(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fbbf24]/20 text-[#b45309]
                     font-bold rounded-xl hover:bg-[#fbbf24]/30 active:scale-95 transition-all border border-[#fbbf24]/40"
        >
          <Lightbulb size={18} /> Show Hint
        </button>
      )}

      {showHint && (
        <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-3 animate-pop-in">
          <div className="font-bold text-[#b45309] text-sm mb-1">💡 {problem.trickName}</div>
          <div className="text-sm text-gray-700">{problem.hint}</div>
        </div>
      )}

      {showHint && !showSteps && (
        <button
          onClick={() => setShowSteps(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600
                     font-bold rounded-xl hover:bg-blue-100 active:scale-95 transition-all border border-blue-200"
        >
          <BookOpen size={18} /> Show Steps
        </button>
      )}

      {showSteps && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 animate-pop-in">
          <div className="font-bold text-[#1e3a5f] text-sm mb-2">📖 Step by step:</div>
          {problem.detailedSteps.map((step, i) => (
            <div key={i} className="text-sm text-gray-700 mb-1">
              {i + 1}. {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
