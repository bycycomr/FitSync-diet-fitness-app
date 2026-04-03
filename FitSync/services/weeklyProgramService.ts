import { UserProfile, MealPlan, WorkoutPlan } from '@/types';

interface WeeklyProgramRequest {
  userProfile: UserProfile;
  pastCompletions: { date: string; mealCount: number; workoutCount: number }[];
  weekNumber: number;
}

interface WeeklyProgram {
  mealPlans: MealPlan[];
  workoutPlans: WorkoutPlan[];
}

/**
 * Generate personalized weekly program from Gemini based on user profile and completion history
 */
export async function generateWeeklyProgram(
  userProfile: UserProfile,
  pastCompletions: { date: string; mealCount: number; workoutCount: number }[],
  uid: string
): Promise<WeeklyProgram> {
  try {
    // Geçmiş verileri özetle
    const totalMeals = pastCompletions.reduce((sum, d) => sum + d.mealCount, 0);
    const totalWorkouts = pastCompletions.reduce((sum, d) => sum + d.workoutCount, 0);
    const avgMealsPerDay = pastCompletions.length > 0 ? (totalMeals / pastCompletions.length).toFixed(1) : '0';
    const avgWorkoutsPerDay = pastCompletions.length > 0 ? (totalWorkouts / pastCompletions.length).toFixed(1) : '0';

    const prompt = `
Kullanıcının profil bilgileri:
- Adı: ${userProfile.displayName || 'Kullanıcı'}
- Boy: ${userProfile.height} cm
- Mevcut Kilo: ${userProfile.weight} kg
- Hedef Kilo: ${userProfile.targetWeight} kg
- Hedef: ${userProfile.goal === 'lose' ? 'Kilo vermek' : userProfile.goal === 'gain' ? 'Kilo almak' : 'Kiloyu korumak'}
- BMI: ${userProfile.bmi?.toFixed(1) || 'Bilinmiyor'}

Geçmiş İlerleme (son 7 gün):
- Günlük ortalama öğün: ${avgMealsPerDay}
- Günlük ortalama antrenman: ${avgWorkoutsPerDay}

Bu bilgilere dayanarak, kullanıcı için gelecek hafta (7 gün) için DETAYLI bir beslenme planı ve antrenman programı öner.

ÖNEMLİ: Yanıtınız SADECE ve SADECE bu JSON formatında olmalıdır (başka metin yok):

{
  "weeklyProgram": {
    "days": [
      {
        "dayNumber": 1,
        "dayName": "Pazartesi",
        "meals": [
          {
            "name": "Kahvaltı",
            "items": [
              {
                "name": "Yumurta",
                "amount": "2 tane",
                "calories": 155
              }
            ],
            "calories": 350,
            "protein": 25,
            "carbs": 30,
            "fat": 12
          }
        ],
        "totalMealCalories": 1800,
        "totalMealProtein": 120,
        "totalMealCarbs": 180,
        "totalMealFat": 50,
        "workout": {
          "name": "Göğüs & Triceps",
          "durationMinutes": 60,
          "exercises": [
            {
              "name": "Bench Press",
              "sets": 4,
              "reps": 8,
              "restSeconds": 120
            }
          ]
        }
      }
    ]
  }
}

Dikkat:
1. 7 gün için tam detay sağla
2. Makrolar kullanıcının hedefine uygun olsun
3. Egzersizler progresif zorluk ile artmalı
4. Her gün 2-4 öğün ve 1 antrenman planla`;

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

    const data = await response.json();
    const responseText = data.text || '';

    // JSON parse
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON yanıtı bulunamadı');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const weeklyData = parsed.weeklyProgram;

    // Herbir günün verisini MealPlan + WorkoutPlan'a çevir
    const mealPlans: MealPlan[] = [];
    const workoutPlans: WorkoutPlan[] = [];

    weeklyData.days.forEach((day: any) => {
      // Beslenme planı
      if (day.meals && day.meals.length > 0) {
        mealPlans.push({
          meals: day.meals,
          totalCalories: day.totalMealCalories,
          totalProtein: day.totalMealProtein,
          totalCarbs: day.totalMealCarbs,
          totalFat: day.totalMealFat,
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
