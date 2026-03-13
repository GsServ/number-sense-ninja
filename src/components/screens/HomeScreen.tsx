import { useMemo } from 'react';
import { Zap, Flame, Target, Trophy, Swords, BookOpen, Timer as TimerIcon, Star, Brain, ShoppingBag, Calendar, Gift } from 'lucide-react';
import type { Screen, UserProfile } from '@/types';
import { LEVEL_NAMES, LEVEL_THRESHOLDS, getLevelForXp, CATEGORY_DISPLAY_NAMES } from '@/types';
import { getTodayStats, getBestTestSimScore } from '@/lib/stats';
import { getWeakestCategories } from '@/lib/adaptive';
import { calculateBelt, getDailyBounties, getStreakPower } from '@/lib/gamification';
import { BeltBadge } from '../game/BeltBadge';

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
  const belt = calculateBelt(profile);
  const coins = profile.coins || 0;
  const bounties = getDailyBounties(profile);

  const daysUntilState = useMemo(() => {
    const state = new Date('2026-05-02');
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((state.getTime() - now.getTime()) / 86400000);
  }, []);

  const weakestCat = getWeakestCategories(profile, 1)[0];
  const dailyDone = profile.dailyChallenge?.date === new Date().toISOString().split('T')[0] && profile.dailyChallenge?.completed;

  return (
    <div className="px-4 py-6 space-y-4 max-w-md mx-auto">
      {/* Title + Coins */}
      <div className="flex items-start justify-between">
        <div className="text-center flex-1">
          <div className="text-4xl mb-1">🥷</div>
          <h1 className="text-3xl font-black text-[#1e3a5f]">Number Sense Ninja</h1>
          <div className="text-sm text-gray-500 font-semibold mt-1">
            {daysUntilState > 0
              ? `${daysUntilState} days until State!`
              : 'Competition day!'}
          </div>
        </div>
      </div>

      {/* Belt + Coins Row */}
      <div className="flex items-center justify-between">
        <BeltBadge belt={belt} size="sm" />
        <button onClick={() => onNavigate('shop')} className="flex items-center gap-1 px-3 py-1 bg-[#fbbf24]/20 rounded-full active:scale-95 transition-all">
          <span className="text-base">🪙</span>
          <span className="font-extrabold text-[#b45309] text-sm">{coins}</span>
        </button>
      </div>

      {/* Level/XP Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-1.5">
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
      <div className="grid grid-cols-4 gap-2">
        <QuickStat icon={<Target size={16} />} label="Today" value={String(today.problemsDone)} color="text-[#3b82f6]" />
        <QuickStat
          icon={<Flame size={16} className={profile.dailyStreak >= 3 ? 'animate-flame' : ''} />}
          label="Streak"
          value={`${profile.dailyStreak}d`}
          color="text-[#f59e0b]"
        />
        <QuickStat icon={<Target size={16} />} label="Acc" value={`${Math.round(today.accuracy * 100)}%`} color="text-[#22c55e]" />
        <QuickStat icon={<Trophy size={16} />} label="Best" value={bestScore > 0 ? String(bestScore) : '—'} color="text-[#a855f7]" />
      </div>

      {/* Daily Challenge Banner */}
      {!dailyDone && (
        <button
          onClick={() => onNavigate('daily_challenge')}
          className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white rounded-xl p-3
                     flex items-center gap-3 active:scale-[0.98] transition-all shadow-md"
        >
          <Calendar size={24} />
          <div className="text-left flex-1">
            <div className="font-bold text-sm">Daily Challenge</div>
            <div className="text-xs opacity-80">10 problems — same for everyone!</div>
          </div>
          <div className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-bold">NEW</div>
        </button>
      )}

      {/* Bounty Banner */}
      <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-3">
        <div className="flex items-center gap-1 text-xs font-bold text-[#b45309] mb-1.5">
          <Gift size={14} /> TODAY'S BOUNTIES — 3x COINS!
        </div>
        <div className="flex flex-wrap gap-1.5">
          {bounties.categories.map(cat => (
            <span key={cat} className="px-2 py-0.5 bg-[#fbbf24]/20 text-[#b45309] rounded-full text-[10px] font-bold">
              {CATEGORY_DISPLAY_NAMES[cat]}
            </span>
          ))}
        </div>
      </div>

      {/* Game Modes Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <ActionButton icon={<Swords size={22} />} label="Speed Drill" color="bg-[#22c55e]" onClick={() => onNavigate('speed_drill')} />
        <ActionButton icon={<BookOpen size={22} />} label="Practice" color="bg-[#3b82f6]" onClick={() => onNavigate('practice')} />
        <ActionButton icon={<TimerIcon size={22} />} label="Test Sim" color="bg-[#ef4444]" onClick={() => onNavigate('test_sim')} />
        <ActionButton icon={<Star size={22} />} label="Estimation" color="bg-[#f59e0b]" onClick={() => onNavigate('estimation')} />
      </div>

      {/* Battle Modes */}
      <div className="grid grid-cols-3 gap-2">
        <SmallButton emoji="🏁" label="Race Ninja" color="bg-[#ef4444]" onClick={() => onNavigate('ninja_race')} />
        <SmallButton emoji="👹" label="Boss Battle" color="bg-[#a855f7]" onClick={() => onNavigate('boss_battle')} />
        <SmallButton emoji="🏆" label="Tournament" color="bg-[#eab308]" onClick={() => onNavigate('tournament')} />
      </div>

      {/* Review Mistakes */}
      {profile.sessions.some(s => s.attempts.some(a => !a.isCorrect && a.studentAnswer !== '')) && (
        <button
          onClick={() => onNavigate('review_mistakes')}
          className="w-full flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-3
                     hover:bg-red-100 active:scale-[0.98] transition-all"
        >
          <Brain size={20} className="text-[#ef4444]" />
          <div className="text-left">
            <div className="font-bold text-[#ef4444] text-sm">Review Mistakes</div>
            <div className="text-xs text-gray-500">See error patterns and retry</div>
          </div>
        </button>
      )}

      {/* Shop Button */}
      <button
        onClick={() => onNavigate('shop')}
        className="w-full flex items-center gap-3 bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl p-3
                   active:scale-[0.98] transition-all"
      >
        <ShoppingBag size={20} className="text-[#b45309]" />
        <div className="text-left flex-1">
          <div className="font-bold text-[#b45309] text-sm">Ninja Shop</div>
          <div className="text-xs text-gray-500">Avatars, themes, power-ups</div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm">🪙</span>
          <span className="font-bold text-[#b45309] text-sm">{coins}</span>
        </div>
      </button>

      {/* Suggested Practice */}
      {weakestCat && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="text-xs font-bold text-gray-400 mb-1">SUGGESTED</div>
          <div className="text-sm text-gray-700">
            Practice: <span className="font-bold">{CATEGORY_DISPLAY_NAMES[weakestCat]}</span>
          </div>
        </div>
      )}

      {/* Streak Freeze Indicator */}
      {(profile.streakFreezes || 0) > 0 && (
        <div className="text-center text-xs text-gray-400">
          🧊 {profile.streakFreezes} streak freeze{profile.streakFreezes !== 1 ? 's' : ''} available
        </div>
      )}
    </div>
  );
}

function QuickStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-2 text-center">
      <div className={`flex items-center justify-center gap-0.5 mb-0.5 ${color}`}>{icon}</div>
      <div className="text-[9px] text-gray-400 uppercase">{label}</div>
      <div className={`text-sm font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: {
  icon: React.ReactNode; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl p-4 flex flex-col items-center gap-1.5
                  font-bold text-sm active:scale-95 transition-all shadow-md`}
    >
      {icon}
      {label}
    </button>
  );
}

function SmallButton({ emoji, label, color, onClick }: {
  emoji: string; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`${color} text-white rounded-xl p-3 flex flex-col items-center gap-1
                  font-bold text-xs active:scale-95 transition-all shadow-md`}
    >
      <span className="text-xl">{emoji}</span>
      {label}
    </button>
  );
}
