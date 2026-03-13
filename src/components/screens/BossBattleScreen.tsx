import { useState, useCallback } from 'react';
import type { Screen, Problem, ProblemAttempt } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { TIER_CATEGORIES } from '@/types';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { getBossForLevel, earnCoins, isBountyCategory } from '@/lib/gamification';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { MultipleChoice } from '../game/MultipleChoice';
import { StreakEffect } from '../game/StreakEffect';
import { ArrowLeft, Heart, Shield, Swords } from 'lucide-react';

interface BossBattleScreenProps {
  onNavigate: (screen: Screen) => void;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function BossBattleScreen({ onNavigate }: BossBattleScreenProps) {
  const data = loadData();
  const boss = getBossForLevel(data.profile.bossesDefeated || 0);

  const [phase, setPhase] = useState<'intro' | 'fighting' | 'victory' | 'defeat'>('intro');
  const [bossHp, setBossHp] = useState(boss.hp);
  const [playerHp, setPlayerHp] = useState(5);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [bossHit, setBossHit] = useState(false);

  const generateBossProblem = useCallback(() => {
    const cats = TIER_CATEGORIES[boss.tier];
    const cat = pick(cats);
    return generateProblem(cat);
  }, [boss.tier]);

  const startBattle = useCallback(() => {
    setBossHp(boss.hp);
    setPlayerHp(5);
    setStreak(0);
    setTotalXp(0);
    setTotalCoins(0);
    setProblem(generateBossProblem());
    setPhase('fighting');
  }, [boss.hp, generateBossProblem]);

  const handleSubmit = useCallback((answer: string) => {
    if (!problem) return;

    let isCorrect = false;
    if (problem.isEstimation && problem.estimationRange) {
      const num = parseFloat(answer);
      isCorrect = !isNaN(num) && isEstimationCorrect(num, problem.estimationRange.exact);
    } else {
      isCorrect = answer.trim().toLowerCase() === problem.correctAnswer.trim().toLowerCase() ||
        (problem.acceptableAnswers?.some(a => a.toLowerCase() === answer.trim().toLowerCase()) ?? false);
    }

    const newStreak = isCorrect ? streak + 1 : 0;
    const xp = calculateXp(isCorrect, 5000, false, newStreak);

    let d = loadData();
    const bounty = isBountyCategory(d.profile, problem.category);
    const coins = earnCoins(isCorrect, newStreak, bounty);

    const attempt: ProblemAttempt = {
      problemId: problem.id, category: problem.category, tier: problem.tier,
      questionText: problem.questionText, correctAnswer: problem.correctAnswer,
      studentAnswer: answer, isCorrect, isEstimation: problem.isEstimation,
      timeMs: 5000, hintUsed: false, timestamp: Date.now(),
    };

    d.profile = updateCategoryStats(d.profile, attempt);
    d.profile = addXpToProfile(d.profile, xp);
    d.profile = updateDailyStreak(d.profile);
    d.profile.coins = (d.profile.coins || 0) + coins;
    saveData(d);

    setStreak(newStreak);
    setTotalXp(prev => prev + xp);
    setTotalCoins(prev => prev + coins);

    if (isCorrect) {
      // Damage boss
      const damage = newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
      const newBossHp = bossHp - damage;
      setBossHit(true);
      setTimeout(() => setBossHit(false), 400);

      if (newBossHp <= 0) {
        setBossHp(0);
        // Victory!
        const d2 = loadData();
        d2.profile.bossesDefeated = (d2.profile.bossesDefeated || 0) + 1;
        d2.profile.coins = (d2.profile.coins || 0) + 25; // boss defeat bonus
        d2.profile = addXpToProfile(d2.profile, 50); // bonus XP
        saveData(d2);
        setTotalXp(prev => prev + 50);
        setTotalCoins(prev => prev + 25);
        setPhase('victory');
      } else {
        setBossHp(newBossHp);
        setProblem(generateBossProblem());
      }
    } else {
      // Boss attacks player
      const newPlayerHp = playerHp - 1;
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);

      if (newPlayerHp <= 0) {
        setPlayerHp(0);
        setPhase('defeat');
      } else {
        setPlayerHp(newPlayerHp);
        setProblem(generateBossProblem());
      }
    }
  }, [problem, streak, bossHp, playerHp, generateBossProblem]);

  // Intro
  if (phase === 'intro') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="text-7xl animate-bounce">{boss.emoji}</div>
        <h2 className="text-2xl font-extrabold text-[#ef4444]">{boss.name}</h2>
        <p className="text-gray-600">Answer correctly to deal damage. Wrong answers hurt you!</p>
        <div className="flex justify-center gap-6 text-sm">
          <span className="text-red-500 font-bold">Boss HP: {boss.hp}</span>
          <span className="text-[#3b82f6] font-bold">Your HP: 5</span>
        </div>
        <p className="text-xs text-gray-400">Streaks deal extra damage!</p>
        <button
          onClick={startBattle}
          className="px-8 py-4 bg-[#ef4444] text-white font-extrabold rounded-xl text-xl
                     hover:bg-[#dc2626] active:scale-95 transition-all shadow-lg"
        >
          <Swords className="inline mr-2" size={24} /> Fight!
        </button>
      </div>
    );
  }

  // Victory
  if (phase === 'victory') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-extrabold text-[#22c55e]">VICTORY!</h2>
        <p className="text-lg text-gray-600">You defeated {boss.name}!</p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="font-bold text-[#f59e0b]">+{totalXp} XP</span>
          <span className="font-bold text-[#eab308]">+{totalCoins} coins</span>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { onNavigate('home'); setTimeout(() => onNavigate('boss_battle'), 50); }}
            className="flex-1 px-6 py-3 bg-[#ef4444] text-white font-bold rounded-xl active:scale-95 transition-all">
            Next Boss
          </button>
          <button onClick={() => onNavigate('home')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all">
            Home
          </button>
        </div>
      </div>
    );
  }

  // Defeat
  if (phase === 'defeat') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">💀</div>
        <h2 className="text-3xl font-extrabold text-[#ef4444]">Defeated!</h2>
        <p className="text-gray-600">{boss.name} wins this time. Try again!</p>
        <div className="flex justify-center gap-4 text-sm">
          <span className="font-bold text-[#f59e0b]">+{totalXp} XP</span>
          <span className="font-bold text-[#eab308]">+{totalCoins} coins</span>
        </div>
        <div className="flex gap-3">
          <button onClick={startBattle}
            className="flex-1 px-6 py-3 bg-[#ef4444] text-white font-bold rounded-xl active:scale-95 transition-all">
            Try Again
          </button>
          <button onClick={() => onNavigate('home')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all">
            Home
          </button>
        </div>
      </div>
    );
  }

  // Fighting
  const bossHpPct = (bossHp / boss.hp) * 100;
  const playerHpPct = (playerHp / 5) * 100;

  return (
    <div className={`px-4 py-4 max-w-md mx-auto space-y-3 ${shakeScreen ? 'animate-shake' : ''}`}>
      <StreakEffect streak={streak} />

      {/* Boss HP */}
      <div className="bg-white border border-gray-200 rounded-xl p-3">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-3xl ${bossHit ? 'animate-boss-hit' : ''}`}>{boss.emoji}</span>
          <span className="font-bold text-sm text-[#ef4444]">{boss.name}</span>
          <span className="text-sm text-gray-400">{bossHp}/{boss.hp}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-[#ef4444] h-3 rounded-full transition-all duration-300"
               style={{ width: `${bossHpPct}%` }} />
        </div>
      </div>

      {/* Player HP */}
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-[#3b82f6]" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart key={i} size={18} className={i < playerHp ? 'text-[#ef4444] fill-[#ef4444]' : 'text-gray-200'} />
          ))}
        </div>
        {streak >= 3 && (
          <span className="text-xs font-bold text-[#f59e0b] ml-auto">
            {streak >= 5 ? '3x DMG!' : '2x DMG!'}
          </span>
        )}
      </div>

      {problem && (
        <>
          <ProblemDisplay problem={problem} />
          <MultipleChoice problem={problem} onSubmit={handleSubmit} />
        </>
      )}
    </div>
  );
}
