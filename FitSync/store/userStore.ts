import { create } from 'zustand';
import type { MealPlan, WorkoutPlan, DayStats } from '@/types';

export type Goal = 'lose' | 'maintain' | 'gain';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserState {
  // Kişisel bilgiler
  displayName: string;
  email: string;
  uid: string | null;

  // Vücut ölçüleri
  height: number | null; // cm
  weight: number | null; // kg
  targetWeight: number | null; // kg
  age: number | null;
  goal: Goal | null;

  // Hesaplanan değerler
  bmi: number | null;

  // Gemini'den parse edilen aktif planlar
  activeMealPlan: MealPlan | null;
  activeWorkoutPlan: WorkoutPlan | null;
  // UI/Tema
  themeMode: ThemeMode;
  // Konuşma hafızası — son 5 günün istatistikleri
  last5DaysStats: DayStats[];

  // Setterlar
  setProfile: (profile: Partial<Pick<UserState, 'displayName' | 'email' | 'uid'>>) => void;
  setBodyMetrics: (metrics: Partial<Pick<UserState, 'height' | 'weight' | 'targetWeight' | 'age' | 'goal'>>) => void;
  computeBmi: () => void;
  setActiveMealPlan: (plan: MealPlan | null) => void;
  setActiveWorkoutPlan: (plan: WorkoutPlan | null) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setLast5DaysStats: (stats: DayStats[]) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  displayName: '',
  email: '',
  uid: null,
  height: null,
  weight: null,
  targetWeight: null,
  age: null,
  goal: null,
  bmi: null,
  activeMealPlan: null,
  activeWorkoutPlan: null,
  themeMode: 'system' as ThemeMode,
  last5DaysStats: [],
};

export const useUserStore = create<UserState>((set, get) => ({
  ...INITIAL_STATE,

  setProfile: (profile) => set((state) => ({ ...state, ...profile })),

  setBodyMetrics: (metrics) =>
    set((state) => {
      const next = { ...state, ...metrics };
      // BMI'yi otomatik hesapla
      const h = next.height;
      const w = next.weight;
      const bmi = h && w ? parseFloat((w / ((h / 100) * (h / 100))).toFixed(1)) : state.bmi;
      return { ...next, bmi };
    }),

  computeBmi: () => {
    const { height, weight } = get();
    if (!height || !weight) return;
    const bmi = parseFloat((weight / ((height / 100) * (height / 100))).toFixed(1));
    set({ bmi });
  },

  setActiveMealPlan: (plan) => set({ activeMealPlan: plan }),
  setActiveWorkoutPlan: (plan) => set({ activeWorkoutPlan: plan }),
  setThemeMode: (mode) => set({ themeMode: mode }),
  setLast5DaysStats: (stats) => set({ last5DaysStats: stats }),

  reset: () => set(INITIAL_STATE),
}));
