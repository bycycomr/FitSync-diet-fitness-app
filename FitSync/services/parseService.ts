/**
 * parseService.ts
 *
 * Gemini'den gelen doğal dil yanıtlarını yapılandırılmış JSON'a dönüştüren
 * istemci taraflı servis katmanı.
 *
 * /api/parse route'unu çağırır; parse başarısız olursa null döner.
 */

import type { ParsedPlanResponse } from '@/types';

// ─── Anahtar Kelime Ön Filtresi ───────────────────────────────────────────────
// Sunucuya gereksiz istek atmamak için istemci tarafında hızlı kontrol

const PLAN_TRIGGER_KEYWORDS = [
  'kahvaltı', 'öğle', 'akşam yemeği', 'öğün', 'beslenme planı',
  'antrenman', 'egzersiz', 'set', 'tekrar', 'kalori', 'protein',
  'günlük plan', 'haftalık program',
];

/**
 * Bot yanıtının bir beslenme veya antrenman planı içerip içermediğini
 * hızlıca kontrol eder.
 */
export function mightContainPlan(text: string): boolean {
  const lower = text.toLowerCase();
  const matchCount = PLAN_TRIGGER_KEYWORDS.filter(k => lower.includes(k)).length;
  // En az 2 anahtar kelime eşleşmesi gerekiyor (tek kelime false-positive önler)
  return matchCount >= 2;
}

/**
 * Bot yanıtını /api/parse route'una gönderir ve yapılandırılmış plan döndürür.
 * Plan bulunamazsa veya parse başarısız olursa null döner.
 */
export async function parsePlanFromText(text: string): Promise<ParsedPlanResponse | null> {
  if (!mightContainPlan(text)) return null;

  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as ParsedPlanResponse;
    return data.type === 'none' ? null : data;
  } catch {
    return null;
  }
}
