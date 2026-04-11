import { IMessage } from 'react-native-gifted-chat';
import type { GeminiMessage } from '@/services/geminiService';
import { BOT_USER, BOT_ID } from './constants';

export function makeMsg(
  text: string,
  isBot: boolean,
  uid: string,
  displayName: string,
  id?: string,
): IMessage {
  return {
    _id: id ?? `${isBot ? 'b' : 'u'}_${Date.now()}_${Math.random()}`,
    text,
    createdAt: new Date(),
    user: isBot
      ? BOT_USER
      : { _id: uid, name: displayName },
  };
}

/**
 * Konuşma geçmişini budama (pruning).
 *
 * Gemini API token limitine yaklaşınca hata veriyor. Bu fonksiyon:
 * - İlk 2 mesajı (anchor — hoş geldin / bağlam) korur
 * - Son N mesajı (recent — son sohbet) korur
 * - Ortayı siler (eski konuşmalar)
 *
 * Örneğin 100 mesaj varsa:
 * - İlk 2 mesaj (indeks 0-1) + son 20 mesaj (indeks 80-99) = 22 mesaj döner
 *
 * @param history Gemini geçmişi ([{role, text}, ...])
 * @param maxRecentMessages Son kaç mesajı koruyacağımız (default: 20)
 * @returns Budanmış geçmiş
 */
export function pruneHistory(
  history: GeminiMessage[],
  maxRecentMessages: number = 20,
): GeminiMessage[] {
  // Eğer yeterince kısaysa, budamaya gerek yok
  if (history.length <= 2 + maxRecentMessages) {
    return history;
  }

  // İlk 2 mesajı (anchor) tut
  const anchor = history.slice(0, 2);

  // Son N mesajı tut
  const recent = history.slice(-maxRecentMessages);

  // Birleştir ve döndür
  return [...anchor, ...recent];
}
