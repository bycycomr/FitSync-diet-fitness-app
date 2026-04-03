import { GoogleGenerativeAI } from '@google/generative-ai';

interface VisionRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic';
}

interface MealAnalysis {
  mealName: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

interface VisionResponse {
  success: boolean;
  meal?: MealAnalysis;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { imageBase64, mimeType } = (await request.json()) as VisionRequest;

    if (!imageBase64 || !mimeType) {
      return Response.json(
        { success: false, error: 'Missing imageBase64 or mimeType' } as VisionResponse,
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable not set');
      return Response.json(
        { success: false, error: 'API configuration error' } as VisionResponse,
        { status: 500 }
      );
    }

    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `Sen beslenme analisti ve AI diyet koçusun. Kullanıcı tarafından gönderilen yemek fotoğrafını analiz ederek:

1. Yemeğin türünü ve bileşenleri belirle
2. Tahmini kalori miktarını hesapla (g cinsinden)
3. Protein (g), Karbohidrat (g), Yağ (g) oranlarını tahmin et
4. Tahmin güvenini (high/medium/low) değerlendir
5. Kısa bir açıklama yaz

ÇIKTI FORMATI (mutlaka JSON olacak):
{
  "mealName": "Yemeğin adı (Türkçe)",
  "estimatedCalories": 450,
  "protein": 25,
  "carbs": 45,
  "fat": 12,
  "confidence": "high",
  "description": "Kısa açıklama (Türkçe)"
}

Sadece JSON çıkart, başka birşey yazma.`;

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt,
            },
            {
              inlineData: {
                mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    const responseText = response.response.text().trim();
    let cleanedText = responseText;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const meal = JSON.parse(cleanedText) as MealAnalysis;

    // Validation
    if (!meal.mealName || !meal.estimatedCalories) {
      return Response.json(
        {
          success: false,
          error: 'Yemek analizi yapılamadı. Lütfen net bir yemek fotoğrafı seç.',
        } as VisionResponse,
        { status: 400 }
      );
    }

    return Response.json({
      success: true,
      meal,
    } as VisionResponse);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('Vision API error:', errorMsg);

    return Response.json(
      {
        success: false,
        error: 'Fotoğraf analizi başarısız. Tekrar dene.',
      } as VisionResponse,
      { status: 500 }
    );
  }
}
