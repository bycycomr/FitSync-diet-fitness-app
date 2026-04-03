import type { MealPlan } from '@/types';

interface MealAnalysis {
  mealName: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Convert image file to base64 string
 */
export async function imageToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    throw new Error(`Image conversion failed: ${err instanceof Error ? err.message : 'Unknown'}`);
  }
}

/**
 * Detect MIME type from image URI
 */
export function detectMimeType(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic' {
  const lower = uri.toLowerCase();
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.heic') || lower.includes('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * Send image to Gemini Vision API for meal analysis
 */
export async function analyzeMealFromImage(imageUri: string): Promise<MealAnalysis> {
  try {
    const imageBase64 = await imageToBase64(imageUri);
    const mimeType = detectMimeType(imageUri);

    const response = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Vision API error: ${response.status}`
      );
    }

    const data = (await response.json()) as {
      success: boolean;
      meal?: MealAnalysis;
      error?: string;
    };

    if (!data.success || !data.meal) {
      throw new Error(data.error || 'No meal data returned');
    }

    return data.meal;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Meal analysis failed: ${msg}`);
  }
}

/**
 * Convert analyzed meal data to MealPlan format
 */
export function createMealPlanFromAnalysis(analysis: MealAnalysis): MealPlan {
  return {
    meals: [
      {
        name: analysis.mealName,
        items: [
          {
            name: analysis.description,
            amount: '1 portion',
            calories: analysis.estimatedCalories,
          },
        ],
        calories: analysis.estimatedCalories,
        protein: analysis.protein,
        carbs: analysis.carbs,
        fat: analysis.fat,
      },
    ],
    totalCalories: analysis.estimatedCalories,
    totalProtein: analysis.protein,
    totalCarbs: analysis.carbs,
    totalFat: analysis.fat,
  };
}
