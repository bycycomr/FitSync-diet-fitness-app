/**
 * geminiService.ts
 *
 * İstemci taraflı Gemini servis katmanı.
 * API anahtarına dokunmaz — tüm istekler /api/chat route'una iletilir.
 */

import type { Goal, DayStats } from '@/types';

// ─── Tipler ───────────────────────────────────────────────────────────────────

export interface GeminiMessage {
  role: 'user' | 'model';
  text: string;
}

export interface UserProfileContext {
  displayName?: string;
  height?: number | null;
  weight?: number | null;
  targetWeight?: number | null;
  bmi?: number | null;
  goal?: Goal | null;
  age?: number | null;
}

// ─── API çağrısı ──────────────────────────────────────────────────────────────

/**
 * Sohbet geçmişini ve kullanıcı profilini sunucuya göndererek
 * Gemini'den yanıt alır.
 *
 * @param messages    Tüm konuşma geçmişi (son mesaj dahil), role: 'user' | 'model'
 * @param userProfile Kullanıcının vücut ölçüleri ve hedefi (isteğe bağlı)
 * @param last5Days   Son 5 günün istatistikleri (konuşma hafızası için, isteğe bağlı)
 * @returns           Asistanın yanıt metni
 */
export async function sendChatMessage(
  messages: GeminiMessage[],
  userProfile?: UserProfileContext,
  last5Days?: DayStats[],
): Promise<string> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15_000); // 15 saniye timeout

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userProfile, last5DaysStats: last5Days }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(errBody.error ?? `Sunucu hatası: ${response.status}`);
    }

    const data = await response.json() as { text: string };
    return data.text;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. İnternet bağlantını kontrol et ve tekrar dene. 🌐');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

