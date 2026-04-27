/**
 * services/weeklyReportService.ts
 *
 * Haftalık AI ilerleme raporu: Firestore'daki bu haftanın verilerini
 * derleyip Groq'a gönderir ve Türkçe özet + öneri alır.
 */

import { fetchWeeklyCompletions, fetchWorkoutHistory, fetchWeightLog, fetchWeeklyWaterIntake } from './userService';
import { sendChatMessage } from './geminiService';
import type { GeminiMessage } from './geminiService';

export interface WeeklyReportData {
  totalMeals: number;
  totalWorkouts: number;
  totalWaterGlasses: number;
  weightChange: number | null;   // kg (pozitif = artış, negatif = azalış)
  streakDays: number;
  aiSummary: string;
}

/**
 * Bu haftanın Firestore verilerini toplar ve Groq ile Türkçe özet üretir.
 */
export async function generateWeeklyReport(
  uid: string,
  streakCount: number,
): Promise<WeeklyReportData> {
  // ── Veri Toplama ───────────────────────────────────────────────────────────
  const [completions, workouts, weightLogs, waterDays] = await Promise.all([
    fetchWeeklyCompletions(uid).catch(() => []),
    fetchWorkoutHistory(uid, 14).catch(() => []),
    fetchWeightLog(uid, 14).catch(() => []),
    fetchWeeklyWaterIntake(uid).catch(() => []),
  ]);

  const totalMeals     = completions.reduce((s, d) => s + d.mealCount, 0);
  const totalWorkouts  = completions.reduce((s, d) => s + d.workoutCount, 0);
  const totalWaterGlasses = waterDays.reduce((s, d) => s + d.glasses, 0);

  let weightChange: number | null = null;
  if (weightLogs.length >= 2) {
    const oldest = weightLogs[0].weight;
    const newest = weightLogs[weightLogs.length - 1].weight;
    weightChange = Math.round((newest - oldest) * 10) / 10;
  }

  const workoutNames = workouts.slice(0, 7).map((w) => w.workoutName).join(', ') || 'yok';

  // ── Prompt ────────────────────────────────────────────────────────────────
  const prompt =
    `Bu hafta kullanıcının fitness verileri:\n` +
    `- Toplam öğün kaydı: ${totalMeals}\n` +
    `- Toplam antrenman: ${totalWorkouts}\n` +
    `- Toplam su içme (bardak): ${totalWaterGlasses}\n` +
    `- Kilo değişimi: ${weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange} kg` : 'veri yok'}\n` +
    `- Streak: ${streakCount} gün\n` +
    `- Yapılan antrenmanlar: ${workoutNames}\n\n` +
    `Lütfen bu verilere dayanarak:\n` +
    `1. Tek paragraf (2-3 cümle) kişiselleştirilmiş Türkçe haftalık özet yaz.\n` +
    `2. Gelecek hafta için tek somut, motivasyonel öneri ver.\n` +
    `Cevabı kısa ve samimi tut.`;

  const history: GeminiMessage[] = [{ role: 'user', text: prompt }];
  const aiSummary = await sendChatMessage(history).catch(
    () => 'Bu hafta harika bir ilerleme kaydettiniz! Devam edin.'
  );

  return { totalMeals, totalWorkouts, totalWaterGlasses, weightChange, streakDays: streakCount, aiSummary };
}
