import { Clock } from 'lucide-react';

interface TimerProps {
  formatted: string;
  ms: number;
  countDown?: boolean;
  totalMs?: number;
  large?: boolean;
}

export function Timer({ formatted, ms, countDown, totalMs, large }: TimerProps) {
  const isLow = countDown && totalMs && ms < totalMs * 0.2;
  const isVeryLow = countDown && ms < 120000; // under 2 min

  return (
    <div
      className={`inline-flex items-center gap-2 font-bold rounded-xl px-4 py-2 ${
        isVeryLow
          ? 'bg-red-100 text-red-600 animate-pulse'
          : isLow
            ? 'bg-orange-100 text-orange-600'
            : 'bg-gray-100 text-[#1e3a5f]'
      } ${large ? 'text-2xl' : 'text-lg'}`}
    >
      <Clock size={large ? 24 : 18} />
      {formatted}
    </div>
  );
}
