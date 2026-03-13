import { useState, useCallback, useEffect } from 'react';
import type { Screen, UserProfile } from '@/types';
import { loadData } from '@/lib/storage';
import { HomeScreen } from './components/screens/HomeScreen';
import { PracticeScreen } from './components/screens/PracticeScreen';
import { SpeedDrillScreen } from './components/screens/SpeedDrillScreen';
import { TestSimScreen } from './components/screens/TestSimScreen';
import { EstimationScreen } from './components/screens/EstimationScreen';
import { StatsScreen } from './components/screens/StatsScreen';
import { ReviewMistakesScreen } from './components/screens/ReviewMistakesScreen';
import { NinjaRaceScreen } from './components/screens/NinjaRaceScreen';
import { BossBattleScreen } from './components/screens/BossBattleScreen';
import { DailyChallengeScreen } from './components/screens/DailyChallengeScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { TournamentScreen } from './components/screens/TournamentScreen';
import { BottomNav } from './components/layout/BottomNav';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [profile, setProfile] = useState<UserProfile>(() => loadData().profile);

  const refreshProfile = useCallback(() => {
    setProfile(loadData().profile);
  }, []);

  const navigate = useCallback((s: Screen) => {
    refreshProfile();
    setScreen(s);
  }, [refreshProfile]);

  // Refresh profile when returning to home
  useEffect(() => {
    if (screen === 'home' || screen === 'stats' || screen === 'review_mistakes' || screen === 'shop') {
      refreshProfile();
    }
  }, [screen, refreshProfile]);

  return (
    <div className="min-h-screen bg-[#faf8f5] pb-16">
      {screen === 'home' && <HomeScreen profile={profile} onNavigate={navigate} />}
      {screen === 'practice' && <PracticeScreen onNavigate={navigate} />}
      {screen === 'speed_drill' && <SpeedDrillScreen onNavigate={navigate} />}
      {screen === 'test_sim' && <TestSimScreen onNavigate={navigate} />}
      {screen === 'estimation' && <EstimationScreen onNavigate={navigate} />}
      {screen === 'stats' && <StatsScreen profile={profile} onNavigate={navigate} />}
      {screen === 'review_mistakes' && <ReviewMistakesScreen profile={profile} onNavigate={navigate} />}
      {screen === 'ninja_race' && <NinjaRaceScreen onNavigate={navigate} />}
      {screen === 'boss_battle' && <BossBattleScreen onNavigate={navigate} />}
      {screen === 'daily_challenge' && <DailyChallengeScreen onNavigate={navigate} />}
      {screen === 'shop' && <ShopScreen onNavigate={navigate} />}
      {screen === 'tournament' && <TournamentScreen onNavigate={navigate} />}
      <BottomNav active={screen} onNavigate={navigate} />
    </div>
  );
}
