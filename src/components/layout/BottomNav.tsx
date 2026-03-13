import { Home, Swords, BarChart3, Brain } from 'lucide-react';
import type { Screen } from '@/types';

interface BottomNavProps {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const items: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'home', icon: <Home size={22} />, label: 'Home' },
    { screen: 'speed_drill', icon: <Swords size={22} />, label: 'Drill' },
    { screen: 'review_mistakes', icon: <Brain size={22} />, label: 'Review' },
    { screen: 'stats', icon: <BarChart3 size={22} />, label: 'Stats' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
      {items.map(({ screen, icon, label }) => (
        <button
          key={screen}
          onClick={() => onNavigate(screen)}
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors ${
            active === screen
              ? 'text-[#1e3a5f] font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {icon}
          <span className="text-[10px]">{label}</span>
        </button>
      ))}
    </nav>
  );
}
