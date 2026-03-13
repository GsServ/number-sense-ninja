import type { Belt } from '@/types';
import { BELT_COLORS } from '@/types';

interface BeltBadgeProps {
  belt: Belt;
  size?: 'sm' | 'md' | 'lg';
}

const BELT_EMOJI: Record<Belt, string> = {
  white: '⬜', yellow: '🟡', orange: '🟠', green: '🟢',
  blue: '🔵', purple: '🟣', brown: '🟤', black: '⚫', gold: '🏅',
};

export function BeltBadge({ belt, size = 'md' }: BeltBadgeProps) {
  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-lg px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold ${sizeClasses[size]}`}
      style={{
        backgroundColor: BELT_COLORS[belt] + '20',
        color: belt === 'white' ? '#6b7280' : BELT_COLORS[belt],
        border: `2px solid ${BELT_COLORS[belt]}`,
      }}
    >
      {BELT_EMOJI[belt]} {belt.charAt(0).toUpperCase() + belt.slice(1)} Belt
    </span>
  );
}
