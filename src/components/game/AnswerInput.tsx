import { useState, useCallback } from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  disabled?: boolean;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  allowSlash?: boolean;
  allowText?: boolean;
}

export function AnswerInput({ onSubmit, disabled, allowNegative, allowDecimal, allowSlash, allowText }: AnswerInputProps) {
  const [value, setValue] = useState('');

  const append = useCallback((char: string) => {
    if (disabled) return;
    setValue(prev => prev + char);
  }, [disabled]);

  const backspace = useCallback(() => {
    if (disabled) return;
    setValue(prev => prev.slice(0, -1));
  }, [disabled]);

  const submit = useCallback(() => {
    if (disabled || value.trim() === '') return;
    onSubmit(value.trim());
    setValue('');
  }, [disabled, value, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  }, [submit]);

  const numKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
  const bottomRow = ['0'];
  if (allowNegative) bottomRow.unshift('−');
  if (allowDecimal) bottomRow.push('.');
  if (allowSlash) bottomRow.push('/');

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Display */}
      <div className="bg-white border-2 border-[#1e3a5f] rounded-xl px-4 py-3 mb-3 min-h-[56px] flex items-center justify-center">
        <input
          type="text"
          value={value}
          onChange={(e) => !disabled && setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-center text-3xl font-bold text-[#1e3a5f] w-full bg-transparent outline-none"
          placeholder="?"
          readOnly={!allowText}
          autoFocus
        />
      </div>

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-2">
        {numKeys.map(key => (
          <button
            key={key}
            onClick={() => append(key)}
            disabled={disabled}
            className="bg-white border-2 border-gray-200 rounded-xl py-4 text-2xl font-bold text-[#1e3a5f]
                       active:bg-gray-100 active:scale-95 transition-all min-h-[56px]
                       hover:border-[#1e3a5f] disabled:opacity-40"
          >
            {key}
          </button>
        ))}

        {/* Bottom row */}
        {bottomRow.map(key => (
          <button
            key={key}
            onClick={() => append(key === '−' ? '-' : key)}
            disabled={disabled}
            className="bg-white border-2 border-gray-200 rounded-xl py-4 text-2xl font-bold text-[#1e3a5f]
                       active:bg-gray-100 active:scale-95 transition-all min-h-[56px]
                       hover:border-[#1e3a5f] disabled:opacity-40"
          >
            {key}
          </button>
        ))}

        {/* Backspace */}
        <button
          onClick={backspace}
          disabled={disabled}
          className="bg-gray-100 border-2 border-gray-200 rounded-xl py-4 text-xl font-bold text-gray-500
                     active:bg-gray-200 active:scale-95 transition-all min-h-[56px]
                     hover:border-gray-400 disabled:opacity-40 flex items-center justify-center"
        >
          <Delete size={24} />
        </button>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={disabled || value.trim() === ''}
          className="bg-[#22c55e] border-2 border-[#16a34a] rounded-xl py-4 text-xl font-bold text-white
                     active:bg-[#16a34a] active:scale-95 transition-all min-h-[56px] col-span-2
                     hover:bg-[#16a34a] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <CornerDownLeft size={22} /> Submit
        </button>
      </div>
    </div>
  );
}
