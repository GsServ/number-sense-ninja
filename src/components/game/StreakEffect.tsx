import { useEffect, useState } from 'react';
import { getStreakPower } from '@/lib/gamification';

interface StreakEffectProps {
  streak: number;
}

export function StreakEffect({ streak }: StreakEffectProps) {
  const [visible, setVisible] = useState(false);
  const power = getStreakPower(streak);

  useEffect(() => {
    if (power) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [streak, power]);

  if (!power || !visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div
        className="text-center animate-streak-burst"
        style={{ color: power.color }}
      >
        <div className="text-6xl mb-2">{power.emoji}</div>
        <div className="text-3xl font-black tracking-wider" style={{
          textShadow: `0 0 20px ${power.color}40, 0 0 40px ${power.color}20`,
        }}>
          {power.name}
        </div>
        <div className="text-lg font-bold mt-1">{streak} in a row!</div>
      </div>
    </div>
  );
}
