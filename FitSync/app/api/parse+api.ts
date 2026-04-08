/**
 * app/api/parse+api.ts
 *
 * Expo API Route — Gemini yanıtındaki doğal dil içeriğini
 * yapılandırılmış JSON'a dönüştürür.
 *
 * POST /api/parse
 * Body: { text: string }
 * Response: ParsedPlanResponse
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import type { ParsedPlanResponse, MealPlan, WorkoutPlan } from '@/types';

// ─── Anahtar Kelime Tespiti ───────────────────────────────────────────────────

const MEAL_KEYWORDS = ['kahvaltı', 'öğle', 'akşam yemeği', 'kalori', 'protein', 'karbonhidrat', 'beslenme planı', 'öğün', 'makro', 'besin'];
const WORKOUT_KEYWORDS = ['antrenman', 'egzersiz', 'set', 'tekrar', 'şınav', 'squat', 'plank', 'burpee', 'koşu', 'kardio'];

function detectPlanType(text: string): 'meal' | 'workout' | 'none' {
  const lower = text.toLowerCase();
  const mealScore = MEAL_KEYWORDS.filter(k => lower.includes(k)).length;
  const workoutScore = WORKOUT_KEYWORDS.filter(k => lower.includes(k)).length;

  if (mealScore === 0 && workoutScore === 0) return 'none';
  return mealScore >= workoutScore ? 'meal' : 'workout';
}

// ─── Parse Prompt'ları ────────────────────────────────────────────────────────

const MEAL_PARSE_PROMPT = (text: string) => `
Aşağıdaki beslenme planı metnini analiz et ve SADECE geçerli bir JSON nesnesi döndür.
Başka hiçbir açıklama veya metin ekleme.

Beklenen JSON formatı:
{
  "meals": [
    {
      "name": "Kahvaltı",
      "items": [
        { "name": "Yulaf ezmesi", "amount": "100g", "calories": 389 }
      ],
      "calories": 400,
      "protein": 15,
      "carbs": 60,
      "fat": 8
    }
  ],
  "totalCalories": 1800,
  "totalProtein": 120,
  "totalCarbs": 200,
  "totalFat": 60
}

Metin:
"""
${text}
"""

Önemli kurallar:
- Değerler sayı (number) olmalı, string değil
- Eğer bir değer metinde yoksa makul bir tahmin yap
- En az 1 öğün çıkar
- Sadece JSON döndür, başka metin yok`;

const WORKOUT_PARSE_PROMPT = (text: string) => `
Aşağıdaki antrenman planı metnini analiz et ve SADECE geçerli bir JSON nesnesi döndür.
Başka hiçbir açıklama veya metin ekleme.

Beklenen JSON formatı:
{
  "name": "Tam Vücut Antrenmanı",
  "durationMinutes": 45,
  "exercises": [
    {
      "name": "Şınav",
      "sets": 3,
      "reps": 15,
      "restSeconds": 60,
      "notes": "Sırtı düz tut"
    },
    {
      "name": "Plank",
      "durationSeconds": 30,
      "sets": 3,
      "restSeconds": 30
    }
  ]
}

Metin:
"""
${text}
"""

Önemli kurallar:
- Değerler sayı (number) olmalı, string değil
- set/rep yoksa durationSeconds kullan, yoksa makul tahmin yap
- En az 1 egzersiz çıkar
- Sadece JSON döndür, başka metin yok`;

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ type: 'none' } satisfies ParsedPlanResponse, { status: 200 });
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

  const prompt = planType === 'meal'
    ? MEAL_PARSE_PROMPT(text)
    : WORKOUT_PARSE_PROMPT(text);

  const modelOptions = {
    generationConfig: { responseMimeType: 'application/json' },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ],
  };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    async function callParseModel(modelName: string) {
      const model = genAI.getGenerativeModel({ model: modelName, ...modelOptions });
      return model.generateContent(prompt);
    }

    let result;
    try {
      result = await callParseModel('gemini-2.0-flash');
    } catch {
      result = await callParseModel('gemini-1.5-flash');
    }

    const rawJson = result.response.text().trim();

    if (planType === 'meal') {
      const mealPlan = JSON.parse(rawJson) as MealPlan;
      return Response.json({ type: 'meal', mealPlan } satisfies ParsedPlanResponse);
    } else {
      const workoutPlan = JSON.parse(rawJson) as WorkoutPlan;
      return Response.json({ type: 'workout', workoutPlan } satisfies ParsedPlanResponse);
    }
  } catch (err) {
    console.error('[Parse API Error]', err);
    // Parse başarısız olursa sessizce 'none' dön — kullanıcıyı engelleme
    return Response.json({ type: 'none' } satisfies ParsedPlanResponse);
  }
}
