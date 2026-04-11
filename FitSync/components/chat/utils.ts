import { IMessage } from 'react-native-gifted-chat';
import type { GeminiMessage } from '@/services/geminiService';
import type { UserProfile } from '@/types';
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

/**
 * Zamana ve kullanıcı verilerine göre dinamik karşılama mesajı oluştur.
 *
 * @param hour Saat bilgisi (0-23)
 * @param userProfile Kullanıcı profili (weight bilgisi kalori hedefi hesaplamak için)
 * @returns Hoş geldin mesajı IMessage formatında
 */
export function buildWelcomeMessage(
  hour: number,
  userProfile?: Partial<UserProfile>,
): IMessage {
  let text: string;

  // Sabah (06:00-11:59)
  if (hour >= 6 && hour < 12) {
    const targetCalories = userProfile?.weight
      ? Math.round(userProfile.weight * 30)
      : 2000;
    text = `Günaydın! 👋 Bugün kalori hedefin **${targetCalories} kcal**.\n\nBeslenme planın, antrenman programın veya kilo hedeflerin hakkında sana yardımcı olmaya hazırım!`;
  }
  // Öğleden sonra (12:00-17:59)
  else if (hour >= 12 && hour < 18) {
    text = `Hoş geldin! 👋 Öğle yemeğini kaydettik mi?\n\nBeslenme planın, antrenman programın veya kilo hedeflerin hakkında sana yardımcı olmaya hazırım.`;
  }
  // Akşam (18:00-05:59)
  else {
    text = `Hoş geldin! 👋 Bugünkü antrenmanını tamamladın mı?\n\nBeslenme planın, antrenman programın veya kilo hedeflerin hakkında sana yardımcı olmaya hazırım.`;
  }

  return {
    _id: '__welcome__',
    text,
    createdAt: new Date(),
    user: BOT_USER,
  };
}
