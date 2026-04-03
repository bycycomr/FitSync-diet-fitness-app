/**
 * constants/prompts.ts
 *
 * Gemini API için sistem ve kullanıcı prompt'ları.
 * Tüm uzun istemler bu dosyada merkezzileştirilmiştir.
 */

import type { UserProfile } from '@/types';

/**
 * Haftalık program oluşturma için Gemini prompt'ı
 *
 * @param userProfile Kullanıcı profil bilgileri
 * @param avgMealsPerDay Günlük ortalama öğün sayısı
 * @param avgWorkoutsPerDay Günlük ortalama antrenman sayısı
 * @returns Formatlanmış prompt string'i
 */
export const buildWeeklyProgramPrompt = (
  userProfile: UserProfile,
  avgMealsPerDay: string,
  avgWorkoutsPerDay: string,
): string => {
  return `
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
};
