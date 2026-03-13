import type { StoredData, UserProfile, AppSettings } from '@/types';

const STORAGE_KEY = 'number-sense-ninja';

function defaultProfile(): UserProfile {
  return {
    name: 'Karas',
    totalXp: 0,
    level: 0,
    dailyStreak: 0,
    lastPracticeDate: '',
    sessions: [],
    categoryStats: {},
    categoryHistory: {},
  };
}

function defaultSettings(): AppSettings {
  return {
    soundEnabled: true,
    darkMode: false,
    coachPin: '1234',
  };
}

export function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StoredData;
      return {
        profile: { ...defaultProfile(), ...data.profile },
        settings: { ...defaultSettings(), ...data.settings },
      };
    }
  } catch { /* ignore */ }
  return { profile: defaultProfile(), settings: defaultSettings() };
}

export function saveData(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function updateProfile(updater: (p: UserProfile) => UserProfile): StoredData {
  const data = loadData();
  data.profile = updater(data.profile);
  saveData(data);
  return data;
}

export function updateSettings(updater: (s: AppSettings) => AppSettings): StoredData {
  const data = loadData();
  data.settings = updater(data.settings);
  saveData(data);
  return data;
}
