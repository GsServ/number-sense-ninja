import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FeedbackProps {
  isCorrect: boolean;
  correctAnswer: string;
  detailedSteps?: string[];
  commonMistake?: string;
  xpEarned: number;
  streak: number;
  onContinue: () => void;
  autoAdvance?: boolean;
  autoAdvanceMs?: number;
}

export function Feedback({
  isCorrect,
  correctAnswer,
  detailedSteps,
  commonMistake,
  xpEarned,
  streak,
  onContinue,
  autoAdvance = false,
  autoAdvanceMs = 1500,
}: FeedbackProps) {
  const hasConfettied = useRef(false);

  useEffect(() => {
    if (isCorrect && !hasConfettied.current) {
      hasConfettied.current = true;
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#fbbf24', '#3b82f6'],
      });
    }
  }, [isCorrect]);

  useEffect(() => {
    if (autoAdvance && isCorrect) {
      const timer = setTimeout(onContinue, autoAdvanceMs);
      return () => clearTimeout(timer);
    }
  }, [autoAdvance, isCorrect, onContinue, autoAdvanceMs]);

  if (isCorrect) {
    return (
      <div className="animate-pop-in text-center py-6">
        <CheckCircle size={64} className="text-[#22c55e] mx-auto mb-3" />
        <div className="text-2xl font-extrabold text-[#22c55e] mb-1">Correct!</div>
        <div className="text-lg font-bold text-[#f59e0b]">+{xpEarned} XP</div>
        {streak >= 3 && (
          <div className="text-sm font-bold text-[#f59e0b] animate-pulse-glow inline-block mt-1 px-3 py-1 rounded-full bg-[#f59e0b]/10">
            {streak} streak! 🔥
          </div>
        )}
        {!autoAdvance && (
          <button
            onClick={onContinue}
            className="mt-4 px-6 py-3 bg-[#22c55e] text-white font-bold rounded-xl text-lg
                       hover:bg-[#16a34a] active:scale-95 transition-all"
          >
            Next →
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-shake text-center py-4">
      <XCircle size={64} className="text-[#ef4444] mx-auto mb-3" />
      <div className="text-2xl font-extrabold text-[#ef4444] mb-2">Not quite!</div>
      <div className="text-lg text-gray-600 mb-1">The correct answer is:</div>
      <div className="text-3xl font-extrabold text-[#1e3a5f] mb-4">{correctAnswer}</div>

      {detailedSteps && detailedSteps.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mx-auto max-w-sm mb-3">
          <div className="font-bold text-[#1e3a5f] mb-2">Step by step:</div>
          {detailedSteps.map((step, i) => (
            <div key={i} className="text-sm text-gray-700 mb-1">
              {i + 1}. {step}
            </div>
          ))}
        </div>
      )}

      {commonMistake && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-left mx-auto max-w-sm mb-4">
          <div className="text-sm font-bold text-red-600">⚠️ Common mistake:</div>
          <div className="text-sm text-red-700">{commonMistake}</div>
        </div>
      )}

      <button
        onClick={onContinue}
        className="px-6 py-3 bg-[#1e3a5f] text-white font-bold rounded-xl text-lg
                   hover:bg-[#2a5a8f] active:scale-95 transition-all"
      >
        Got it, Next →
      </button>
    </div>
  );
}
