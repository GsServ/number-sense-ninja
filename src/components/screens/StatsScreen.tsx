import { useState, useMemo } from 'react';
import type { Screen, UserProfile, ProblemCategory } from '@/types';
import { TIER_CATEGORIES, CATEGORY_DISPLAY_NAMES, LEVEL_NAMES } from '@/types';
import { getTestSimScores, getBestTestSimScore } from '@/lib/stats';
import { getWeakestCategories } from '@/lib/adaptive';
import { ArrowLeft, Lock, Trophy, Zap, Flame, Target, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface StatsScreenProps {
  profile: UserProfile;
  onNavigate: (screen: Screen) => void;
}

export function StatsScreen({ profile, onNavigate }: StatsScreenProps) {
  const [view, setView] = useState<'student' | 'coach'>('student');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPinEntry, setShowPinEntry] = useState(false);

  const testScores = useMemo(() => getTestSimScores(profile), [profile]);
  const bestScore = useMemo(() => getBestTestSimScore(profile), [profile]);
  const weakest = useMemo(() => getWeakestCategories(profile, 5), [profile]);

  const totalProblems = profile.sessions.reduce((s, sess) => s + sess.attempts.length, 0);

  const categoryAccuracy = useMemo(() => {
    const allCats: ProblemCategory[] = [...TIER_CATEGORIES[1], ...TIER_CATEGORIES[2], ...TIER_CATEGORIES[3], ...TIER_CATEGORIES[4]];
    return allCats
      .map(cat => {
        const stats = profile.categoryStats[cat];
        if (!stats || stats.attemptsLast20 < 1) return null;
        return {
          name: CATEGORY_DISPLAY_NAMES[cat].slice(0, 12),
          accuracy: Math.round((stats.correctLast20 / stats.attemptsLast20) * 100),
          avgTime: Math.round(stats.avgTimeMs / 1000 * 10) / 10,
          mastered: stats.mastered,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.accuracy - b!.accuracy);
  }, [profile]);

  const handlePinSubmit = () => {
    if (pinInput === '1234') {
      setView('coach');
      setShowPinEntry(false);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setView('student')}
            className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${
              view === 'student' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => view === 'coach' ? setView('coach') : setShowPinEntry(true)}
            className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors flex items-center gap-1 ${
              view === 'coach' ? 'bg-[#1e3a5f] text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Lock size={12} /> Coach
          </button>
        </div>
      </div>

      {/* PIN entry modal */}
      {showPinEntry && (
        <div className="bg-white border-2 border-[#1e3a5f] rounded-xl p-4 space-y-3">
          <div className="font-bold text-[#1e3a5f]">Enter Coach PIN</div>
          <input
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={e => { setPinInput(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-center text-2xl tracking-widest"
            placeholder="____"
            autoFocus
          />
          {pinError && <div className="text-red-500 text-sm">Wrong PIN</div>}
          <button onClick={handlePinSubmit} className="w-full py-2 bg-[#1e3a5f] text-white font-bold rounded-lg">
            Unlock
          </button>
        </div>
      )}

      {/* Student View */}
      {view === 'student' && (
        <>
          <div className="text-center">
            <div className="text-5xl mb-2">🥷</div>
            <div className="text-xl font-extrabold text-[#1e3a5f]">{profile.name}</div>
            <div className="text-sm text-gray-500">Lv.{profile.level} {LEVEL_NAMES[profile.level]}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Zap size={18} />} label="Total XP" value={String(profile.totalXp)} color="text-[#a855f7]" />
            <StatCard icon={<Trophy size={18} />} label="Best Test" value={bestScore > 0 ? String(bestScore) : '—'} color="text-[#f59e0b]" />
            <StatCard icon={<Flame size={18} />} label="Streak" value={`${profile.dailyStreak} days`} color="text-[#f59e0b]" />
            <StatCard icon={<Target size={18} />} label="Total Problems" value={String(totalProblems)} color="text-[#22c55e]" />
          </div>

          {testScores.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-bold text-[#1e3a5f] text-sm mb-3">Test Score Trend</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={testScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Coach View */}
      {view === 'coach' && (
        <>
          <h3 className="text-lg font-extrabold text-[#1e3a5f]">Coach Dashboard</h3>

          {/* Weak Areas */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="font-bold text-red-600 text-sm mb-2">Top Weak Areas</div>
            {weakest.map(cat => {
              const stats = profile.categoryStats[cat];
              const acc = stats && stats.attemptsLast20 > 0
                ? Math.round((stats.correctLast20 / stats.attemptsLast20) * 100)
                : 0;
              return (
                <div key={cat} className="flex justify-between text-sm py-1 border-b border-red-100 last:border-0">
                  <span className="text-red-700">{CATEGORY_DISPLAY_NAMES[cat]}</span>
                  <span className="font-bold text-red-600">{acc}%</span>
                </div>
              );
            })}
          </div>

          {/* Accuracy Chart */}
          {categoryAccuracy.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-bold text-[#1e3a5f] text-sm mb-3 flex items-center gap-1">
                <BarChart3 size={16} /> Accuracy by Category
              </div>
              <ResponsiveContainer width="100%" height={Math.max(200, categoryAccuracy.length * 28)}>
                <BarChart data={categoryAccuracy} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mastery Checklist */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="font-bold text-[#1e3a5f] text-sm mb-3">Mastery Checklist</div>
            {([1, 2, 3, 4] as const).map(tier => (
              <div key={tier} className="mb-3">
                <div className="text-xs font-bold text-gray-400 mb-1">Tier {tier}</div>
                {TIER_CATEGORIES[tier].map(cat => {
                  const stats = profile.categoryStats[cat];
                  const status = stats?.mastered ? '✅' : (stats && stats.attemptsLast20 >= 3 && stats.correctLast20 / stats.attemptsLast20 >= 0.6) ? '🟡' : '🔴';
                  return (
                    <div key={cat} className="flex justify-between text-xs py-0.5">
                      <span>{CATEGORY_DISPLAY_NAMES[cat]}</span>
                      <span>{status}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Test Score Trend */}
          {testScores.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="font-bold text-[#1e3a5f] text-sm mb-3">Test Sim Scores</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={testScores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Session Log */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="font-bold text-[#1e3a5f] text-sm mb-3">Recent Sessions</div>
            {profile.sessions.slice(-10).reverse().map(session => (
              <div key={session.id} className="flex justify-between text-xs py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-600">
                  {new Date(session.startTime).toLocaleDateString()} — {session.mode}
                </span>
                <span className="font-bold text-[#1e3a5f]">
                  {session.attempts.filter(a => a.isCorrect).length}/{session.attempts.length}
                  {session.psiaScore != null && ` (${session.psiaScore}pts)`}
                </span>
              </div>
            ))}
            {profile.sessions.length === 0 && (
              <div className="text-sm text-gray-400">No sessions yet</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
      <div className={`flex items-center justify-center gap-1 mb-0.5 ${color}`}>{icon}</div>
      <div className="text-[10px] text-gray-400 uppercase">{label}</div>
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
