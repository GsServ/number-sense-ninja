import { useState, useCallback } from 'react';
import type { Screen } from '@/types';
import { loadData, saveData } from '@/lib/storage';
import { SHOP_ITEMS, calculateBelt } from '@/lib/gamification';
import { BeltBadge } from '../game/BeltBadge';
import { ArrowLeft, Coins, ShoppingBag, Check, Lock } from 'lucide-react';

interface ShopScreenProps {
  onNavigate: (screen: Screen) => void;
}

export function ShopScreen({ onNavigate }: ShopScreenProps) {
  const [data, setData] = useState(() => loadData());
  const [tab, setTab] = useState<'avatar' | 'theme' | 'powerup' | 'title'>('avatar');
  const [bought, setBought] = useState<string | null>(null);

  const profile = data.profile;
  const coins = profile.coins || 0;
  const owned = profile.ownedItems || [];

  const belt = calculateBelt(profile);

  const buyItem = useCallback((itemId: string, cost: number) => {
    if (coins < cost) return;
    const d = loadData();
    d.profile.coins = (d.profile.coins || 0) - cost;
    if (!d.profile.ownedItems) d.profile.ownedItems = [];
    d.profile.ownedItems.push(itemId);

    // Auto-apply powerups
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (item?.id === 'streak_freeze') {
      d.profile.streakFreezes = (d.profile.streakFreezes || 0) + 1;
    }

    saveData(d);
    setData(d);
    setBought(itemId);
    setTimeout(() => setBought(null), 1500);
  }, [coins]);

  const equipItem = useCallback((itemId: string, type: string) => {
    const d = loadData();
    if (type === 'avatar') d.profile.equippedAvatar = itemId;
    if (type === 'theme') d.profile.equippedTheme = itemId;
    if (type === 'title') d.profile.equippedTitle = itemId;
    saveData(d);
    setData(d);
  }, []);

  const items = SHOP_ITEMS.filter(i => i.type === tab);

  return (
    <div className="px-4 py-6 max-w-md mx-auto space-y-4">
      <button onClick={() => onNavigate('home')} className="flex items-center gap-1 text-[#1e3a5f] font-bold">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-[#1e3a5f]">Ninja Shop</h2>
        <div className="flex items-center gap-1 px-3 py-1 bg-[#fbbf24]/20 rounded-full">
          <span className="text-lg">🪙</span>
          <span className="font-extrabold text-[#b45309]">{coins}</span>
        </div>
      </div>

      {/* Belt Display */}
      <div className="flex items-center justify-center">
        <BeltBadge belt={belt} size="lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(['avatar', 'theme', 'powerup', 'title'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
              tab === t ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-400'
            }`}
          >
            {t === 'avatar' ? '👤' : t === 'theme' ? '🎨' : t === 'powerup' ? '⚡' : '🏷️'}
            {' '}{t.charAt(0).toUpperCase() + t.slice(1)}s
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="space-y-2">
        {items.map(item => {
          const isOwned = owned.includes(item.id);
          const isEquipped =
            (item.type === 'avatar' && profile.equippedAvatar === item.id) ||
            (item.type === 'theme' && profile.equippedTheme === item.id) ||
            (item.type === 'title' && profile.equippedTitle === item.id);
          const canAfford = coins >= item.cost;

          return (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
              <div className="text-3xl w-12 h-12 flex items-center justify-center">{item.icon}</div>
              <div className="flex-1">
                <div className="font-bold text-[#1e3a5f] text-sm">{item.name}</div>
                <div className="text-xs text-gray-400">{item.description}</div>
              </div>
              <div>
                {bought === item.id ? (
                  <div className="px-3 py-1.5 bg-[#22c55e] text-white text-xs font-bold rounded-lg flex items-center gap-1">
                    <Check size={12} /> Got it!
                  </div>
                ) : isEquipped ? (
                  <div className="px-3 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-bold rounded-lg">
                    Equipped
                  </div>
                ) : isOwned ? (
                  <button
                    onClick={() => equipItem(item.id, item.type)}
                    className="px-3 py-1.5 bg-[#3b82f6] text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
                  >
                    Equip
                  </button>
                ) : (
                  <button
                    onClick={() => canAfford && buyItem(item.id, item.cost)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1 active:scale-95 transition-all ${
                      canAfford
                        ? 'bg-[#fbbf24] text-white'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    🪙 {item.cost}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
