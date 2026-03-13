import { useMemo } from 'react';
import { Zap, Flame, Target, Trophy, Swords, BookOpen, Timer as TimerIcon, Star } from 'lucide-react';
import type { Screen, UserProfile } from '@/types';
import { LEVEL_NAMES, LEVEL_THRESHOLDS, getLevelForXp } from '@/types';
import { getTodayStats, getBestTestSimScore } from '@/lib/stats';
import { getWeakestCategories } from '@/lib/adaptive';
import { CATEGORY_DISPLAY_NAMES } from '@/types';

interface HomeScreenProps {
  profile: UserProfile;
  onNavigate: (screen: Screen) => void;
}

export function HomeScreen({ profile, onNavigate }: HomeScreenProps) {
  const today = getTodayStats(profile);
  const bestScore = getBestTestSimScore(profile);
  const level = getLevelForXp(profile.totalXp);
  const levelName = LEVEL_NAMES[level] ?? 'Legend';
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] ?? LEVEL_THRESHOLDS[level] + 2000;
  const prevThreshold = LEVEL_THRESHOLDS[level] ?? 0;
  const xpProgress = ((profile.totalXp - prevThreshold) / (nextThreshold - prevThreshold)) * 100;

  const daysUntilState = useMemo(() => {
    const state = new Date('2026-05-02');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((state.getTime() - now.getTime()) / 86400000);
  }, []);

  const weakestCat = getWeakestCategories(profile, 1)[0];

  return (
    <div className="px-4 py-6 space-y-5 max-w-md mx-auto">
      {/* Title */}
      <div className="text-center">
        <div className="text-4xl mb-1">🥷</div>
        <h1 className="text-3xl font-black text-[#1e3a5f]">Number Sense Ninja</h1>
        <div className="text-sm text-gray-500 font-semibold mt-1">
          {daysUntilState > 0
            ? `📅 ${daysUntilState} days until State!`
            : '🏆 Competition day!'}
        </div>
      </div>

      {/* Level/XP Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-[#1e3a5f] text-sm">Lv.{level} {levelName}</div>
          <div className="text-xs text-gray-400">{profile.totalXp} / {nextThreshold} XP</div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(xpProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <QuickStat icon={<Target size={18} />} label="Today" value={`${today.problemsDone} done`} color="text-[#3b82f6]" />
        <QuickStat
          icon={<Flame size={18} className={profile.dailyStreak >= 3 ? 'animate-flame' : ''} />}
          label="Streak"
          value={`${profile.dailyStreak} day${profile.dailyStreak !== 1 ? 's' : ''}`}
          color="text-[#f59e0b]"
        />
        <QuickStat icon={<Target size={18} />} label="Accuracy" value={`${Math.round(today.accuracy * 100)}%`} color="text-[#22c55e]" />
        <QuickStat icon={<Trophy size={18} />} label="Best Test" value={bestScore > 0 ? String(bestScore) : '—'} color="text-[#a855f7]" />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <ActionButton
          icon={<Swords size={24} />}
          label="Speed Drill"
          color="bg-[#22c55e]"
          hoverColor="hover:bg-[#16a34a]"
          onClick={() => onNavigate('speed_drill')}
        />
        <ActionButton
          icon={<BookOpen size={24} />}
          label="Practice"
          color="bg-[#3b82f6]"
          hoverColor="hover:bg-[#2563eb]"
          onClick={() => onNavigate('practice')}
        />
        <ActionButton
          icon={<TimerIcon size={24} />}
          label="Test Sim"
          color="bg-[#ef4444]"
          hoverColor="hover:bg-[#dc2626]"
          onClick={() => onNavigate('test_sim')}
        />
        <ActionButton
          icon={<Star size={24} />}
          label="Estimation"
          color="bg-[#f59e0b]"
          hoverColor="hover:bg-[#d97706]"
          onClick={() => onNavigate('estimation')}
        />
      </div>

      {/* Suggested Practice */}
      {weakestCat && (
        <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-4">
          <div className="text-sm font-bold text-[#b45309] mb-1">Suggested for today</div>
          <div className="text-sm text-gray-700 mb-3">
            Practice: <span className="font-bold">{CATEGORY_DISPLAY_NAMES[weakestCat]}</span>
          </div>
          <button
            onClick={() => onNavigate('speed_drill')}
            className="px-4 py-2 bg-[#f59e0b] text-white font-bold rounded-lg text-sm
                       hover:bg-[#d97706] active:scale-95 transition-all"
          >
            Start Drill →
          </button>
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
      <div className={`flex items-center justify-center gap-1 mb-0.5 ${color}`}>{icon}</div>
      <div className="text-[10px] text-gray-400 uppercase">{label}</div>
      <div className={`text-base font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function ActionButton({ icon, label, color, hoverColor, onClick }: {
  icon: React.ReactNode; label: string; color: string; hoverColor: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} ${hoverColor} text-white rounded-xl p-5 flex flex-col items-center gap-2
                  font-bold text-base active:scale-95 transition-all shadow-md`}
    >
      {icon}
      {label}
    </button>
  );
}
