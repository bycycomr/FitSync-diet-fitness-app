import { UserProfile, MealPlan, WorkoutPlan, Meal, Exercise } from '@/types';

/** generateWeeklyProgram'a gerekli profil alanları — uid/createdAt/updatedAt gerekmez */
export type WeeklyProgramProfile = Omit<UserProfile, 'uid' | 'createdAt' | 'updatedAt'>;
import { buildWeeklyProgramPrompt } from '@/constants/prompts';

interface WeeklyProgram {
  mealPlans: MealPlan[];
  workoutPlans: WorkoutPlan[];
}

/** Gemini'den dönen haftalık program JSON'ının tek gün yapısı */
interface WeeklyProgramDay {
  dayName: string;
  meals?: Meal[];
  totalMealCalories?: number;
  totalMealProtein?: number;
  totalMealCarbs?: number;
  totalMealFat?: number;
  workout?: {
    name: string;
    durationMinutes: number;
    exercises: Exercise[];
  };
}

/**
 * Generate personalized weekly program from Gemini based on user profile and completion history
 */
export async function generateWeeklyProgram(
  userProfile: WeeklyProgramProfile,
  pastCompletions: { date: string; mealCount: number; workoutCount: number }[],
  uid: string
): Promise<WeeklyProgram> {
  try {
    // Geçmiş verileri özetle
    const totalMeals = pastCompletions.reduce((sum, d) => sum + d.mealCount, 0);
    const totalWorkouts = pastCompletions.reduce((sum, d) => sum + d.workoutCount, 0);
    const avgMealsPerDay = pastCompletions.length > 0 ? (totalMeals / pastCompletions.length).toFixed(1) : '0';
    const avgWorkoutsPerDay = pastCompletions.length > 0 ? (totalWorkouts / pastCompletions.length).toFixed(1) : '0';

    const prompt = buildWeeklyProgramPrompt(userProfile, avgMealsPerDay, avgWorkoutsPerDay);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: prompt }],
        userProfile,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    let data: { text?: string };
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error('[WeeklyProgram] API yanıtı JSON olarak ayrıştırılamadı:', parseErr);
      throw new Error('API yanıtı geçersiz format döndürdü');
    }
    const responseText = data.text || '';

    // JSON parse
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON yanıtı bulunamadı');
    }

    let parsed: { weeklyProgram?: { days: WeeklyProgramDay[] } };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[WeeklyProgram] Plan JSON ayrıştırma hatası:', parseErr, '— Ham:', jsonMatch[0].slice(0, 200));
      throw new Error('Haftalık program verisi ayrıştırılamadı');
    }
    const weeklyData = parsed.weeklyProgram;

    if (!weeklyData?.days || weeklyData.days.length === 0) {
      throw new Error('Haftalık program günleri bulunamadı');
    }

    // Herbir günün verisini MealPlan + WorkoutPlan'a çevir
    const mealPlans: MealPlan[] = [];
    const workoutPlans: WorkoutPlan[] = [];

    weeklyData.days.forEach((day: WeeklyProgramDay) => {
      // Beslenme planı
      if (day.meals && day.meals.length > 0) {
        mealPlans.push({
          meals: day.meals,
          totalCalories: day.totalMealCalories ?? 0,
          totalProtein:  day.totalMealProtein  ?? 0,
          totalCarbs:    day.totalMealCarbs    ?? 0,
          totalFat:      day.totalMealFat      ?? 0,
        });
      }

      // Antrenman planı
      if (day.workout) {
        workoutPlans.push({
          name: `${day.dayName} - ${day.workout.name}`,
          durationMinutes: day.workout.durationMinutes,
          exercises: day.workout.exercises,
        });
      }
    });

    return { mealPlans, workoutPlans };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Bilinmeyen hata';
    throw new Error(`Haftalık program oluşturulamadı: ${msg}`);
  }
}
