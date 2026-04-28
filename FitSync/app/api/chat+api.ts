/**
 * app/api/chat+api.ts
 *
 * Expo API Route — sunucu tarafında çalışır.
 * Groq API anahtarı istemciye hiçbir zaman gönderilmez.
 *
 * POST /api/chat          → tam yanıt (JSON)
 * POST /api/chat?stream=true → SSE akışı (text/event-stream)
 */

import Groq from 'groq-sdk';

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface GeminiMessage {
  role: 'user' | 'model'; // istemci hâlâ Gemini formatı gönderiyor
  text: string;
}

interface UserProfileContext {
  displayName?: string;
  height?: number | null;
  weight?: number | null;
  targetWeight?: number | null;
  bmi?: number | null;
  goal?: 'lose' | 'maintain' | 'gain' | null;
  age?: number | null;
}

interface DayStats {
  date: string;
  day: string;
  mealCount: number;
  workoutCount: number;
}

interface FoodLog {
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface DailyCalorieSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targetCalories: number;
  entries: FoodLog[];
}

interface WeightLog {
  date: string;
  weight: number;
}

interface ExerciseDetail {
  name: string;
  sets?: number;
  reps?: number;
  durationSeconds?: number;
}

interface WorkoutHistory {
  date: string;
  workoutName: string;
  durationMinutes: number;
  exercises: ExerciseDetail[];
}

interface StepData {
  steps: number;
  activeCalories: number;
  stepGoal: number;
}

interface ChatRequestBody {
  messages: GeminiMessage[];
  userProfile?: UserProfileContext;
  last5DaysStats?: DayStats[];
  todayCalorieSummary?: DailyCalorieSummary;
  latestWeight?: WeightLog;
  weeklyWorkoutHistory?: WorkoutHistory[];
  stepData?: StepData;
}

// ─── Model ───────────────────────────────────────────────────────────────────

const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(
  profile?: UserProfileContext,
  last5Days?: DayStats[],
  todayCalories?: DailyCalorieSummary,
  latestWeight?: WeightLog,
  weeklyWorkouts?: WorkoutHistory[],
  stepData?: StepData,
): string {
  const profileLines: string[] = [];

  if (profile?.displayName) profileLines.push(`- İsim: ${profile.displayName}`);
  if (profile?.age)          profileLines.push(`- Yaş: ${profile.age}`);
  if (profile?.height)       profileLines.push(`- Boy: ${profile.height} cm`);
  if (profile?.weight)       profileLines.push(`- Kilo: ${profile.weight} kg`);
  if (profile?.targetWeight) profileLines.push(`- Hedef Kilo: ${profile.targetWeight} kg`);
  if (profile?.bmi)          profileLines.push(`- BMI: ${profile.bmi}`);
  if (profile?.goal) {
    const goalMap = { lose: 'Kilo Vermek', maintain: 'Kiloyu Korumak', gain: 'Kilo Almak' };
    profileLines.push(`- Hedef: ${goalMap[profile.goal]}`);
  }

  const profileSection = profileLines.length > 0
    ? `\n\n## Kullanıcı Profili\n${profileLines.join('\n')}`
    : '';

  let memorySection = '';
  if (last5Days && last5Days.length > 0) {
    const lines = last5Days.map(d => `- ${d.day}: ${d.mealCount} öğün, ${d.workoutCount} antrenman`);
    memorySection = `\n\n## Son 5 Günün İlerleme\n${lines.join('\n')}\n\nBu verilere dayanarak kullanıcının ilerlemesini takip et ve kişiselleştirilmiş tavsiyelerde bulun.`;
  }

  let todaySection = '';
  if (todayCalories) {
    const summary = `Günlük Kalori: ${todayCalories.totalCalories}/${todayCalories.targetCalories} kcal`;
    const macros = `Protein: ${todayCalories.totalProtein}g, Karbonhidrat: ${todayCalories.totalCarbs}g, Yağ: ${todayCalories.totalFat}g`;
    const meals = todayCalories.entries.length > 0
      ? `Yenilen yemekler: ${todayCalories.entries.map(e => e.name).join(', ')}`
      : 'Henüz hiç yemek kaydedilmedi.';
    todaySection = `\n\n## Bugünün Beslenme\n- ${summary}\n- ${macros}\n- ${meals}`;
  }

  let weightSection = '';
  if (latestWeight) {
    const diff = profile?.weight && profile.weight !== latestWeight.weight
      ? ` (${(latestWeight.weight - profile.weight).toFixed(1)} kg değişim)`
      : '';
    weightSection = `\n\n## Son Kaydedilen Kilo\n- Tarih: ${latestWeight.date}\n- Kilo: ${latestWeight.weight} kg${diff}`;
  }

  let workoutSection = '';
  if (weeklyWorkouts && weeklyWorkouts.length > 0) {
    const summary = weeklyWorkouts.map(w => `${w.date}: ${w.workoutName} (${w.durationMinutes} dk, ${w.exercises.length} egzersiz)`);
    workoutSection = `\n\n## Bu Hafta Antrenmanlar\n${summary.map(s => `- ${s}`).join('\n')}`;
  }

  let stepsSection = '';
  if (stepData && stepData.steps > 0) {
    const pct = Math.min(Math.round((stepData.steps / stepData.stepGoal) * 100), 100);
    stepsSection = `\n\n## Bugünkü Aktivite\n- Adım: ${stepData.steps.toLocaleString('tr-TR')} / ${stepData.stepGoal.toLocaleString('tr-TR')} (hedefin %${pct})\n- Tahmini yakılan kalori: ${stepData.activeCalories} kcal`;
  }

  return `Sen FitSync'in yapay zeka asistanısın. Adın FitSync AI.${profileSection}${memorySection}${todaySection}${weightSection}${workoutSection}${stepsSection}

## Görevin
Kullanıcıya kişiselleştirilmiş beslenme ve fitness tavsiyeleri ver. Yanıtların:
- Bilimsel temelli ve gerçekçi olsun
- Kullanıcının profiline göre kişiselleştirilmiş olsun
- Motive edici ama abartısız olsun
- Türkçe olsun

## Katı Kurallar
1. YALNIZCA beslenme, diyet, egzersiz, kilo yönetimi ve genel sağlıklı yaşam konularında yardım et.
2. Konu dışı sorularda kibarca reddet: "Bu konuda yardımcı olamam; beslenme veya antrenman hakkında soru sorabilirsin."
3. Tıbbi teşhis veya ilaç önerme. Sağlık sorunları için doktora yönlendir.
4. Aşırı kalori kısıtlaması (günde 1200 kcal altı) veya tehlikeli diyet önerme.
5. Yanıtları kısa ve öz tut (maksimum 300 kelime). Gerekirse madde madde listele.
6. Kullanıcının verilerini (BMI, hedef) aktif olarak yanıtlarında kullan.

## Yanıt Formatı
- Önerileri net ve uygulanabilir şekilde ver
- Kalori, makro veya egzersiz bilgisi verirken sayısal değer kullan
- Motivasyonel ama gerçekçi ol`;
}

// ─── Yardımcı: Gemini formatı → Groq/OpenAI formatı ──────────────────────────

type GroqMessage = { role: 'system' | 'user' | 'assistant'; content: string };

function toGroqMessages(systemPrompt: string, messages: GeminiMessage[]): GroqMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m): GroqMessage => ({
      role: m.role === 'model' ? 'assistant' : 'user',
      content: m.text,
    })),
  ];
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY ortam değişkeni tanımlı değil.');
    return Response.json({ error: 'Servis geçici olarak kullanılamıyor.' }, { status: 503 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  const {
    messages,
    userProfile,
    last5DaysStats,
    todayCalorieSummary,
    latestWeight,
    weeklyWorkoutHistory,
    stepData,
  } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Mesaj listesi boş olamaz.' }, { status: 400 });
  }

  const groq = new Groq({ apiKey });
  const groqMessages = toGroqMessages(
    buildSystemPrompt(
      userProfile,
      last5DaysStats,
      todayCalorieSummary,
      latestWeight,
      weeklyWorkoutHistory,
      stepData,
    ),
    messages,
  );

  // ─── Streaming modu ────────────────────────────────────────────────────────
  const url = new URL(request.url);
  if (url.searchParams.get('stream') === 'true') {
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: groqMessages,
            stream: true,
            max_tokens: 1024,
          });

          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? '';
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Bilinmeyen hata';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  }

  // ─── Normal mod ────────────────────────────────────────────────────────────
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: groqMessages,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content ?? '';
    return Response.json({ text });
  } catch (err) {
    console.error('[Groq API Error]', err);
    return Response.json({ error: 'Groq API yanıt vermedi. Lütfen tekrar dene.' }, { status: 502 });
  }
}
