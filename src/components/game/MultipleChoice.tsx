import { useState, useMemo } from 'react';
import type { Problem } from '@/types';
import { generateChoices } from '@/lib/problems/distractors';

interface MultipleChoiceProps {
  problem: Problem;
  onSubmit: (answer: string) => void;
  disabled?: boolean;
}

export function MultipleChoice({ problem, onSubmit, disabled }: MultipleChoiceProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const choices = useMemo(() => generateChoices(problem), [problem]);

  const handleTap = (choice: string) => {
    if (disabled || selected !== null) return;
    setSelected(choice);
    onSubmit(choice);
  };

  return (
    <div className="w-full max-w-sm mx-auto grid grid-cols-2 gap-3">
      {choices.map((choice, i) => {
        const isSelected = selected === choice;
        const letter = String.fromCharCode(65 + i); // A, B, C, D

        return (
          <button
            key={`${choice}-${i}`}
            onClick={() => handleTap(choice)}
            disabled={disabled || selected !== null}
            className={`relative flex items-center gap-2 px-4 py-5 rounded-xl border-2 text-left
                        transition-all active:scale-95 min-h-[64px]
                        ${isSelected
                          ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white scale-[0.97]'
                          : 'bg-white border-gray-200 text-[#1e3a5f] hover:border-[#1e3a5f]'
                        }
                        ${disabled && !isSelected ? 'opacity-50' : ''}
                        `}
          >
            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {letter}
            </span>
            <span className="text-xl font-extrabold leading-tight break-all">
              {choice}
            </span>
          </button>
        );
      })}
    </div>
  );
}
