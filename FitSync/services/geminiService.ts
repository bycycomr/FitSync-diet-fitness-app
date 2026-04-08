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
 * Gemini'den yanıt alır. (Non-streaming, weeklyProgramService gibi servisler için)
 */
export async function sendChatMessage(
  messages: GeminiMessage[],
  userProfile?: UserProfileContext,
  last5Days?: DayStats[],
): Promise<string> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 15_000);

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

/**
 * Streaming sohbet yanıtı — token token akış.
 * Her chunk geldiğinde `onChunk(accumulated)` çağrılır.
 * Streaming desteklenmiyorsa sendChatMessage'a otomatik fallback yapar.
 *
 * @returns Yanıtın tamamı (final metin)
 */
export async function sendChatMessageStream(
  messages: GeminiMessage[],
  userProfile?: UserProfileContext,
  last5Days?: DayStats[],
  onChunk?: (accumulated: string) => void,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30_000); // streaming için daha uzun

  try {
    const response = await fetch('/api/chat?stream=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userProfile, last5DaysStats: last5Days }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Sunucu hatası: ${response.status}`);
    }

    // React Native'in eski versiyonlarında response.body olmayabilir → fallback
    if (!response.body) {
      clearTimeout(timeoutId);
      return sendChatMessage(messages, userProfile, last5Days);
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer      = '';
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') return accumulated;

        try {
          const parsed = JSON.parse(data) as { text?: string; error?: string };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            accumulated += parsed.text;
            onChunk?.(accumulated);
          }
        } catch (parseErr) {
          if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') {
            throw parseErr;
          }
        }
      }
    }

    return accumulated;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. İnternet bağlantını kontrol et ve tekrar dene. 🌐');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

