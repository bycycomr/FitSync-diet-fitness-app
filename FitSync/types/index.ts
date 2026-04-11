import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Firestore'a yazılırken serverTimestamp() döner (FieldValue),
 * okunurken Timestamp döner. İkisini birden kabul etmek için:
 */
export type FirestoreTimestamp = Timestamp | FieldValue | null;

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
  /** Firestore'dan okunurken Timestamp, fetchChatHistory sonrası Date olarak gelir */
  createdAt: Timestamp | Date | null;
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
  /** Firestore'a yazılırken FieldValue (serverTimestamp), okunurken Timestamp */
  unlockedAt: FirestoreTimestamp;
}

export interface StreakData {
  streakCount: number;   // Kaç gün arka arda aktif
  lastActiveDate: string | null; // 'YYYY-MM-DD' son aktif gün
  longestStreak: number; // Şimdiye kadar en uzun streak
}

// ─── Su İçme Takibi ───────────────────────────────────────────────────────

export interface WaterIntake {
  id: string;
  date: string;          // 'YYYY-MM-DD' — gün anahtarı
  glassesDrunk: number;  // Birbiri ardına içilen bardak sayısı
  completedAt: Timestamp | null;
}

export type WaterIntakeInput = Omit<WaterIntake, 'id'>;

export interface WaterStats {
  todayGlasses: number;  // Bugün içilen bardak sayısı
  dailyGoal: number;     // Günlük hedef bardak sayısı (önerilen: 8)
}

// ─── Antrenman Geçmişi ve Personal Records ──────────────────────────────

export interface ExerciseDetail {
  name: string;          // Egzersiz adı: "Şınav", "Squat"
  sets?: number;         // Tamamlanan set sayısı
  reps?: number;         // Her set'te tamamlanan tekrar sayısı
  durationSeconds?: number; // Egzersiz süresi (saniye cinsinden)
}

export interface WorkoutHistory {
  id: string;
  date: string;          // 'YYYY-MM-DD' — antrenman tarihi
  workoutName: string;   // "Üst Vücut Antrenmanı"
  durationMinutes: number; // Antrenman süresi (dakika)
  exerciseCount: number; // Antrenman içindeki egzersiz sayısı
  exercises: ExerciseDetail[]; // Detaylı egzersiz listesi
  completedAt: Timestamp | null; // serverTimestamp()
}

export type WorkoutHistoryInput = Omit<WorkoutHistory, 'id'>;

export interface PersonalRecord {
  exerciseName: string;  // "Şınav", "Squat"
  maxSetsReps: string;   // "5×15" (5 set × 15 tekrar)
  date: string;          // 'YYYY-MM-DD' PR'ın yapıldığı tarih
  recordedAt: Timestamp | null;
}

export type PersonalRecordInput = Omit<PersonalRecord, 'recordedAt'>;

// ─── Manuel Öğün Günlüğü (Food Log) ─────────────────────────────────────────

export interface FoodLog {
  id: string;
  date: string;          // 'YYYY-MM-DD'
  name: string;          // 'Yulaf ezmesi', 'Muz' vb.
  calories: number;      // kcal
  protein?: number;      // gram
  carbs?: number;        // gram
  fat?: number;          // gram
  loggedAt: Timestamp | null;
}

export type FoodLogInput = Omit<FoodLog, 'id'>;

export interface DailyCalorieSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number; // Kullanıcının günlük hedef kalorisi
  entries: FoodLog[];
}

// ─── Kilo Takip Günlüğü ───────────────────────────────────────────────────────

export interface WeightLog {
  id: string;
  date: string;          // 'YYYY-MM-DD' — kayıt tarihi
  weight: number;        // kg cinsinden kilo
  recordedAt: Timestamp | null;
}

export type WeightLogInput = Omit<WeightLog, 'id'>;

