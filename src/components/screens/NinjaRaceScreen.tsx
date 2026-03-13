import { useState, useCallback, useRef, useEffect } from 'react';
import type { Screen, Problem, ProblemAttempt } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { selectNextCategory } from '@/lib/adaptive';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { getNinjaSpeed, earnCoins, isBountyCategory } from '@/lib/gamification';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { MultipleChoice } from '../game/MultipleChoice';
import { StreakEffect } from '../game/StreakEffect';
import { ArrowLeft, Swords, Trophy, Frown } from 'lucide-react';

interface NinjaRaceScreenProps {
  onNavigate: (screen: Screen) => void;
}

const RACE_LENGTH = 15;

export function NinjaRaceScreen({ onNavigate }: NinjaRaceScreenProps) {
  const [phase, setPhase] = useState<'ready' | 'racing' | 'done'>('ready');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [ninjaScore, setNinjaScore] = useState(0);
  const [problemIndex, setProblemIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [flashState, setFlashState] = useState<'correct' | 'wrong' | null>(null);
  const ninjaTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [won, setWon] = useState(false);

  const startRace = useCallback(() => {
    const data = loadData();
    const cat = selectNextCategory(data.profile);
    setProblem(generateProblem(cat));
    setPlayerScore(0);
    setNinjaScore(0);
    setProblemIndex(0);
    setStreak(0);
    setTotalXp(0);
    setTotalCoins(0);
    setPhase('racing');

    // Start ninja's timer
    const speed = getNinjaSpeed(data.profile);
    if (ninjaTimer.current) clearInterval(ninjaTimer.current);
    ninjaTimer.current = setInterval(() => {
      setNinjaScore(prev => {
        const next = prev + 1;
        if (next >= RACE_LENGTH) {
          if (ninjaTimer.current) clearInterval(ninjaTimer.current);
        }
        return Math.min(next, RACE_LENGTH);
      });
    }, speed);
  }, []);

  // Check for race end
  useEffect(() => {
    if (phase !== 'racing') return;
    if (playerScore >= RACE_LENGTH || ninjaScore >= RACE_LENGTH) {
      if (ninjaTimer.current) clearInterval(ninjaTimer.current);
      const playerWon = playerScore >= RACE_LENGTH;
      setWon(playerWon);

      let data = loadData();
      if (playerWon) {
        data.profile.ninjaRaceWins = (data.profile.ninjaRaceWins || 0) + 1;
        data.profile.coins = (data.profile.coins || 0) + 10; // bonus coins for winning
      } else {
        data.profile.ninjaRaceLosses = (data.profile.ninjaRaceLosses || 0) + 1;
      }
      saveData(data);
      setPhase('done');
    }
  }, [playerScore, ninjaScore, phase]);

  // Cleanup
  useEffect(() => {
    return () => { if (ninjaTimer.current) clearInterval(ninjaTimer.current); };
  }, []);

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

    let data = loadData();
    const bounty = isBountyCategory(data.profile, problem.category);
    const coins = earnCoins(isCorrect, newStreak, bounty);

    const attempt: ProblemAttempt = {
      problemId: problem.id,
      category: problem.category,
      tier: problem.tier,
      questionText: problem.questionText,
      correctAnswer: problem.correctAnswer,
      studentAnswer: answer,
      isCorrect,
      isEstimation: problem.isEstimation,
      timeMs: 5000,
      hintUsed: false,
      timestamp: Date.now(),
    };

    data.profile = updateCategoryStats(data.profile, attempt);
    data.profile = addXpToProfile(data.profile, xp);
    data.profile = updateDailyStreak(data.profile);
    data.profile.coins = (data.profile.coins || 0) + coins;
    saveData(data);

    setStreak(newStreak);
    setTotalXp(prev => prev + xp);
    setTotalCoins(prev => prev + coins);

    if (isCorrect) {
      setPlayerScore(prev => prev + 1);
    }

    setFlashState(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      setFlashState(null);
      const next = problemIndex + 1;
      setProblemIndex(next);
      const cat = selectNextCategory(loadData().profile);
      setProblem(generateProblem(cat));
    }, isCorrect ? 300 : 800);
  }, [problem, streak, problemIndex]);

  if (phase === 'ready') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="text-5xl">🏁</div>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Race the Ninja!</h2>
        <p className="text-gray-600">Answer {RACE_LENGTH} problems before the ninja does!</p>
        <p className="text-sm text-gray-400">The ninja gets faster the more you win.</p>
        <button
          onClick={startRace}
          className="px-8 py-4 bg-[#ef4444] text-white font-extrabold rounded-xl text-xl
                     hover:bg-[#dc2626] active:scale-95 transition-all shadow-lg"
        >
          <Swords className="inline mr-2" size={24} /> Start Race!
        </button>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">{won ? '🏆' : '😤'}</div>
        <h2 className={`text-3xl font-extrabold ${won ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {won ? 'YOU WIN!' : 'Ninja Wins!'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400">You</div>
            <div className="text-2xl font-extrabold text-[#3b82f6]">{playerScore}</div>
          </div>
          <div className="bg-white border rounded-xl p-3 text-center">
            <div className="text-xs text-gray-400">Ninja</div>
            <div className="text-2xl font-extrabold text-[#ef4444]">{ninjaScore}</div>
          </div>
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <span className="font-bold text-[#f59e0b]">+{totalXp} XP</span>
          <span className="font-bold text-[#eab308]">+{totalCoins + (won ? 10 : 0)} coins</span>
        </div>
        <div className="flex gap-3">
          <button onClick={startRace} className="flex-1 px-6 py-3 bg-[#3b82f6] text-white font-bold rounded-xl active:scale-95 transition-all">
            Race Again
          </button>
          <button onClick={() => onNavigate('home')} className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all">
            Home
          </button>
        </div>
      </div>
    );
  }

  // Racing
  const playerPct = (playerScore / RACE_LENGTH) * 100;
  const ninjaPct = (ninjaScore / RACE_LENGTH) * 100;

  return (
    <div className={`px-4 py-4 max-w-md mx-auto space-y-3 transition-colors duration-200 ${
      flashState === 'correct' ? 'bg-[#22c55e]/10' : flashState === 'wrong' ? 'bg-[#ef4444]/10' : ''
    }`}>
      <StreakEffect streak={streak} />

      {/* Race Track */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
        <div className="text-xs font-bold text-gray-400 text-center">RACE TO {RACE_LENGTH}!</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm w-8">You</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-[#3b82f6] rounded-full transition-all duration-300"
                   style={{ width: `${playerPct}%` }} />
              <span className="absolute right-2 top-0 h-full flex items-center text-xs font-bold text-gray-600"
                    style={{ left: `${Math.min(playerPct, 85)}%` }}>🏃</span>
            </div>
            <span className="text-sm font-bold w-6 text-right">{playerScore}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm w-8">🥷</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-[#ef4444] rounded-full transition-all duration-300"
                   style={{ width: `${ninjaPct}%` }} />
              <span className="absolute right-2 top-0 h-full flex items-center text-xs font-bold text-gray-600"
                    style={{ left: `${Math.min(ninjaPct, 85)}%` }}>🥷</span>
            </div>
            <span className="text-sm font-bold w-6 text-right">{ninjaScore}</span>
          </div>
        </div>
      </div>

      {problem && !flashState && (
        <>
          <ProblemDisplay problem={problem} />
          <MultipleChoice problem={problem} onSubmit={handleSubmit} />
        </>
      )}

      {flashState === 'wrong' && problem && (
        <div className="text-center text-lg font-bold text-[#ef4444] animate-pop-in">
          Answer: {problem.correctAnswer}
        </div>
      )}
    </div>
  );
}
