import { Timestamp } from 'firebase/firestore';

// ─── Kullanıcı ────────────────────────────────────────────────────────────────

export type Goal = 'lose' | 'maintain' | 'gain';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  height: number | null;
  weight: number | null;
  targetWeight: number | null;
  goal: Goal | null;
  bmi: number | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// ─── Sohbet ───────────────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: Timestamp | null;
}

// Firestore'a yazılacak versiyon (id alanı hariç — doc ID olarak saklanır)
export type ChatMessageInput = Omit<ChatMessage, 'id'>;

// ─── Beslenme Planı ───────────────────────────────────────────────────────────

export interface MealItem {
  name: string;    // "Yulaf ezmesi"
  amount: string;  // "100g" veya "1 kase"
  calories?: number;
}

export interface Meal {
  name: string;    // "Kahvaltı", "Öğle Yemeği", "Akşam Yemeği", "Ara Öğün"
  items: MealItem[];
  calories: number;
  protein: number; // gram
  carbs: number;   // gram
  fat: number;     // gram
}

export interface MealPlan {
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

// ─── Antrenman Planı ──────────────────────────────────────────────────────────

export interface Exercise {
  name: string;          // "Şınav", "Squat"
  sets?: number;
  reps?: number;
  durationSeconds?: number;
  restSeconds?: number;
  notes?: string;        // "Diz açısına dikkat et"
}

export interface WorkoutPlan {
  name: string;          // "Üst Vücut Antrenmanı"
  durationMinutes: number;
  exercises: Exercise[];
}

// ─── Parse Yanıtı ─────────────────────────────────────────────────────────────

export type PlanType = 'meal' | 'workout' | 'none';

export interface ParsedPlanResponse {
  type: PlanType;
  mealPlan?: MealPlan;
  workoutPlan?: WorkoutPlan;
}

// ─── Tamamlama Kaydı ──────────────────────────────────────────────────────────

export type CompletionType = 'meal' | 'workout';

export interface Completion {
  id: string;
  type: CompletionType;
  date: string;          // 'YYYY-MM-DD' — gün anahtarı
  label: string;         // öğün adı veya egzersiz adı
  completedAt: Timestamp | null;
}

export type CompletionInput = Omit<Completion, 'id'>;

// ─── İstatistikler ────────────────────────────────────────────────────────────

export interface DayStats {
  date: string;          // 'YYYY-MM-DD'
  day: string;           // 'Pazartesi', 'Salı', vb.
  mealCount: number;     // Bu gün tamamlanan öğün sayısı
  workoutCount: number;  // Bu gün tamamlanan antrenman sayısı
}

// ─── Streak & Başarılar ───────────────────────────────────────────────────────

export interface Achievement {
  id: string;            // 'first_meal', 'week_streak_7', vb.
  name: string;          // "İlk Öğün", "7 Günlük Streak"
  emoji: string;         // "🎯", "🔥", vb.
  description: string;   // "Bir öğün tamamladığın için tebrikler!"
  unlockedAt: Timestamp | null;
}

export interface StreakData {
  streakCount: number;   // Kaç gün arka arda aktif
  lastActiveDate: string | null; // 'YYYY-MM-DD' son aktif gün
  longestStreak: number; // Şimdiye kadar en uzun streak
}

