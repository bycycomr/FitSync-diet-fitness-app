/**
 * app/api/chat+api.ts
 *
 * Expo API Route — sunucu tarafında çalışır.
 * Gemini API anahtarı istemciye hiçbir zaman gönderilmez.
 *
 * POST /api/chat
 * Body: { messages: GeminiMessage[], userProfile: UserProfileContext }
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// ─── Tipler ───────────────────────────────────────────────────────────────────

interface GeminiMessage {
  role: 'user' | 'model';
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

interface ChatRequestBody {
  messages: GeminiMessage[];
  userProfile?: UserProfileContext;
  last5DaysStats?: DayStats[];
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(profile?: UserProfileContext, last5Days?: DayStats[]): string {
  const profileLines: string[] = [];

  if (profile?.displayName) profileLines.push(`- İsim: ${profile.displayName}`);
  if (profile?.age) profileLines.push(`- Yaş: ${profile.age}`);
  if (profile?.height) profileLines.push(`- Boy: ${profile.height} cm`);
  if (profile?.weight) profileLines.push(`- Kilo: ${profile.weight} kg`);
  if (profile?.targetWeight) profileLines.push(`- Hedef Kilo: ${profile.targetWeight} kg`);
  if (profile?.bmi) profileLines.push(`- BMI: ${profile.bmi}`);
  if (profile?.goal) {
    const goalMap = { lose: 'Kilo Vermek', maintain: 'Kiloyu Korumak', gain: 'Kilo Almak' };
    profileLines.push(`- Hedef: ${goalMap[profile.goal]}`);
  }

  const profileSection = profileLines.length > 0
    ? `\n\n## Kullanıcı Profili\n${profileLines.join('\n')}`
    : '';

  // Son 5 günün hafızası
  let memorySection = '';
  if (last5Days && last5Days.length > 0) {
    const memoryLines = last5Days.map(
      d => `- ${d.day}: ${d.mealCount} öğün, ${d.workoutCount} antrenman`
    );
    memorySection = `\n\n## Son 5 Günün İlerleme\n${memoryLines.join('\n')}\n\nBu verilere dayanarak kullanıcının ilerlemesini takip et ve kişiselleştirilmiş tavsiyelerde bulun.`;
  }

  return `Sen FitSync'in yapay zeka asistanısın. Adın FitSync AI.${profileSection}${memorySection}

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

// ─── Model Sabitleri ─────────────────────────────────────────────────────────

const PRIMARY_MODEL  = 'gemini-2.0-flash';
const FALLBACK_MODEL = 'gemini-1.5-flash';

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Gemini API anahtarı yapılandırılmamış.' }, { status: 500 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  const { messages, userProfile, last5DaysStats } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Mesaj listesi boş olamaz.' }, { status: 400 });
  }

  const systemInstruction = buildSystemPrompt(userProfile, last5DaysStats);
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  // GiftedChat history → Gemini history formatına çevir
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
  const lastMessage = messages[messages.length - 1];

  const genAI = new GoogleGenerativeAI(apiKey);

  // ─── Streaming modu (?stream=true) ───────────────────────────────────────────
  const url = new URL(request.url);
  if (url.searchParams.get('stream') === 'true') {
    const encoder = new TextEncoder();
    const model = genAI.getGenerativeModel({ model: PRIMARY_MODEL, systemInstruction, safetySettings });
    const chat = model.startChat({ history });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          const streamResult = await chat.sendMessageStream(lastMessage.text);
          for await (const chunk of streamResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : 'Bilinmeyen hata';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errMsg })}\n\n`));
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

  // ─── Normal (non-streaming) mod ───────────────────────────────────────────────
  async function callModel(modelName: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: modelName, systemInstruction, safetySettings });
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.text);
    return result.response.text();
  }

  try {
    let text: string;
    try {
      text = await callModel(PRIMARY_MODEL);
    } catch (primaryErr) {
      console.warn(`[Chat API] ${PRIMARY_MODEL} başarısız, fallback: ${FALLBACK_MODEL}. Hata:`, primaryErr);
      text = await callModel(FALLBACK_MODEL);
    }
    return Response.json({ text });
  } catch (err) {
    console.error('[Gemini API Error]', err);
    return Response.json({ error: 'Gemini API yanıt vermedi. Lütfen tekrar dene.' }, { status: 502 });
  }
}
