/**
 * app/api/parse+api.ts
 *
 * Expo API Route — Groq LLM ile bot yanıtını yapılandırılmış JSON'a çevirir.
 *
 * POST /api/parse
 * Body: { text: string }
 * Response: ParsedPlanResponse
 */

import Groq from 'groq-sdk';
import type { ParsedPlanResponse, MealPlan, WorkoutPlan } from '@/types';

// ─── Anahtar Kelime Tespiti ───────────────────────────────────────────────────

const MEAL_KEYWORDS    = ['kahvaltı', 'öğle', 'akşam yemeği', 'kalori', 'protein', 'karbonhidrat', 'beslenme planı', 'öğün', 'makro', 'besin'];
const WORKOUT_KEYWORDS = ['antrenman', 'egzersiz', 'set', 'tekrar', 'şınav', 'squat', 'plank', 'burpee', 'koşu', 'kardio'];

function detectPlanType(text: string): 'meal' | 'workout' | 'none' {
  const lower = text.toLowerCase();
  const mealScore    = MEAL_KEYWORDS.filter(k => lower.includes(k)).length;
  const workoutScore = WORKOUT_KEYWORDS.filter(k => lower.includes(k)).length;
  if (mealScore === 0 && workoutScore === 0) return 'none';
  return mealScore >= workoutScore ? 'meal' : 'workout';
}

// ─── Prompt'lar ───────────────────────────────────────────────────────────────

const MEAL_PARSE_PROMPT = (text: string) => `
Aşağıdaki beslenme planı metnini analiz et ve SADECE geçerli bir JSON nesnesi döndür. Başka hiçbir açıklama ekleme.

Beklenen JSON formatı:
{
  "meals": [
    {
      "name": "Kahvaltı",
      "items": [{ "name": "Yulaf ezmesi", "amount": "100g", "calories": 389 }],
      "calories": 400, "protein": 15, "carbs": 60, "fat": 8
    }
  ],
  "totalCalories": 1800, "totalProtein": 120, "totalCarbs": 200, "totalFat": 60
}

Metin:
"""
${text}
"""

Kurallar: Değerler sayı olmalı. Eksik değerleri tahmin et. En az 1 öğün çıkar. Sadece JSON döndür.`;

const WORKOUT_PARSE_PROMPT = (text: string) => `
Aşağıdaki antrenman planı metnini analiz et ve SADECE geçerli bir JSON nesnesi döndür. Başka hiçbir açıklama ekleme.

Beklenen JSON formatı:
{
  "name": "Tam Vücut Antrenmanı",
  "durationMinutes": 45,
  "exercises": [
    { "name": "Şınav", "sets": 3, "reps": 15, "restSeconds": 60, "notes": "Sırtı düz tut" }
  ]
}

Metin:
"""
${text}
"""

Kurallar: Değerler sayı olmalı. set/rep yoksa durationSeconds kullan. En az 1 egzersiz. Sadece JSON döndür.`;

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json({ type: 'none' } satisfies ParsedPlanResponse);
  }

  let text: string;
  try {
    const body = (await request.json()) as { text: string };
    text = body.text ?? '';
  } catch {
    return Response.json({ type: 'none' } satisfies ParsedPlanResponse);
  }

  const planType = detectPlanType(text);
  if (planType === 'none') {
    return Response.json({ type: 'none' } satisfies ParsedPlanResponse);
  }

  const prompt = planType === 'meal' ? MEAL_PARSE_PROMPT(text) : WORKOUT_PARSE_PROMPT(text);

  try {
    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2048,
    });

    const rawJson = completion.choices[0]?.message?.content?.trim() ?? '';

    try {
      if (planType === 'meal') {
        const mealPlan = JSON.parse(rawJson) as MealPlan;
        return Response.json({ type: 'meal', mealPlan } satisfies ParsedPlanResponse);
      } else {
        const workoutPlan = JSON.parse(rawJson) as WorkoutPlan;
        return Response.json({ type: 'workout', workoutPlan } satisfies ParsedPlanResponse);
      }
    } catch (parseErr) {
      console.error('[Parse API] JSON ayrıştırma hatası:', parseErr, '— Ham yanıt:', rawJson);
      return Response.json({ type: 'none' } satisfies ParsedPlanResponse);
    }
  } catch (err) {
    console.error('[Parse API Error]', err);
    return Response.json({ type: 'none' } satisfies ParsedPlanResponse);
  }
}
