import { useState, useCallback, useRef } from 'react';
import type { Screen, Problem, ProblemAttempt } from '@/types';
import { generateProblem } from '@/lib/problems/generator';
import { selectNextCategory } from '@/lib/adaptive';
import { isEstimationCorrect, calculateXp } from '@/lib/scoring';
import { loadData, saveData } from '@/lib/storage';
import { updateCategoryStats, addXpToProfile, updateDailyStreak } from '@/lib/stats';
import { getCurrentWeekId, earnCoins, isBountyCategory } from '@/lib/gamification';
import { ProblemDisplay } from '../game/ProblemDisplay';
import { MultipleChoice } from '../game/MultipleChoice';
import { ScoreBar } from '../game/ScoreBar';
import { StreakEffect } from '../game/StreakEffect';
import { ArrowLeft, Trophy, Timer, Medal } from 'lucide-react';

interface TournamentScreenProps {
  onNavigate: (screen: Screen) => void;
}

const TOURNAMENT_COUNT = 20;

export function TournamentScreen({ onNavigate }: TournamentScreenProps) {
  const weekId = getCurrentWeekId();
  const data = loadData();
  const existingEntry = (data.profile.tournaments || []).find(t => t.weekId === weekId);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>(existingEntry ? 'done' : 'intro');
  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemIndex, setProblemIndex] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, xp: 0, coins: 0 });
  const [flashState, setFlashState] = useState<'correct' | 'wrong' | null>(null);
  const startTime = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const startTournament = useCallback(() => {
    const d = loadData();
    const cat = selectNextCategory(d.profile);
    setProblem(generateProblem(cat));
    setProblemIndex(0);
    setStats({ correct: 0, total: 0, streak: 0, xp: 0, coins: 0 });
    setPhase('playing');
    startTime.current = Date.now();
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

    const newStreak = isCorrect ? stats.streak + 1 : 0;
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

    const newStats = {
      correct: stats.correct + (isCorrect ? 1 : 0),
      total: stats.total + 1,
      streak: newStreak,
      xp: stats.xp + xp,
      coins: stats.coins + coins,
    };
    setStats(newStats);

    setFlashState(isCorrect ? 'correct' : 'wrong');
    const delay = isCorrect ? 300 : 1000;

    setTimeout(() => {
      setFlashState(null);
      const next = problemIndex + 1;
      if (next >= TOURNAMENT_COUNT) {
        // Save tournament result
        const totalTime = Date.now() - startTime.current;
        const d2 = loadData();
        if (!d2.profile.tournaments) d2.profile.tournaments = [];
        d2.profile.tournaments.push({
          weekId,
          score: newStats.correct,
          time: totalTime,
          completedAt: Date.now(),
        });
        d2.profile.coins = (d2.profile.coins || 0) + 15; // tournament bonus
        d2.profile = addXpToProfile(d2.profile, 50);
        saveData(d2);
        setElapsed(totalTime);
        setPhase('done');
      } else {
        setProblemIndex(next);
        const cat = selectNextCategory(loadData().profile);
        setProblem(generateProblem(cat));
      }
    }, delay);
  }, [problem, stats, problemIndex, weekId]);

  // Intro
  if (phase === 'intro') {
    return (
      <div className="px-4 py-8 max-w-md mx-auto text-center space-y-5">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold mb-4">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="text-5xl">🏆</div>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Weekly Tournament</h2>
        <p className="text-gray-600">{TOURNAMENT_COUNT} problems. Race the clock!</p>
        <div className="text-xs text-gray-400">Week: {weekId}</div>
        <button
          onClick={startTournament}
          className="px-8 py-4 bg-[#a855f7] text-white font-extrabold rounded-xl text-xl
                     hover:bg-[#9333ea] active:scale-95 transition-all shadow-lg"
        >
          <Trophy className="inline mr-2" size={24} /> Start Tournament
        </button>
      </div>
    );
  }

  // Done
  if (phase === 'done') {
    const finalScore = existingEntry?.score ?? stats.correct;
    const finalTime = existingEntry?.time ?? elapsed;
    const timeSec = (finalTime / 1000).toFixed(1);
    return (
      <div className="px-4 py-12 max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Tournament Complete!</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-400">Score</div>
            <div className="text-2xl font-extrabold text-[#a855f7]">{finalScore}/{TOURNAMENT_COUNT}</div>
          </div>
          <div className="bg-white border rounded-xl p-3">
            <div className="text-xs text-gray-400">Time</div>
            <div className="text-2xl font-extrabold text-[#3b82f6]">{timeSec}s</div>
          </div>
        </div>
        {!existingEntry && (
          <div className="flex justify-center gap-4 text-sm">
            <span className="font-bold text-[#f59e0b]">+{stats.xp + 50} XP</span>
            <span className="font-bold text-[#eab308]">+{stats.coins + 15} coins</span>
          </div>
        )}
        {existingEntry && (
          <div className="text-sm text-gray-400">You already completed this week's tournament!</div>
        )}
        <button onClick={() => onNavigate('home')}
          className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl active:scale-95 transition-all">
          Home
        </button>
      </div>
    );
  }

  // Playing
  const progress = (problemIndex / TOURNAMENT_COUNT) * 100;

  return (
    <div className={`px-4 py-4 max-w-md mx-auto space-y-3 transition-colors duration-200 ${
      flashState === 'correct' ? 'bg-[#22c55e]/10' : flashState === 'wrong' ? 'bg-[#ef4444]/10' : ''
    }`}>
      <StreakEffect streak={stats.streak} />

      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-gray-400">{problemIndex + 1}/{TOURNAMENT_COUNT}</div>
        <div className="flex items-center gap-1 text-sm font-bold text-[#a855f7]">
          <Trophy size={14} /> Tournament
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-[#a855f7] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      <ScoreBar correct={stats.correct} total={stats.total} streak={stats.streak} xp={stats.xp} />

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
