/**
 * services/query/Firestore.ts
 *
 * Firestore sorgu mantığının merkezzileştirilmiş yönetimi.
 * CRUD koleksiyonlarına erişen yardımcı fonksiyonlar.
 */

import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  CollectionReference,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import type { UserProfile, ChatMessage, ChatMessageInput, CompletionInput, DayStats } from '@/types';

// ─── Koleksiyon Referansları ──────────────────────────────────────────────────

/**
 * Firestore'da users koleksiyonunun belirli bir dokümanına erişir
 */
export const getUserDoc = (uid: string) => doc(db, 'users', uid);

/**
 * Kullanıcıya ait messages (sohbet) alt koleksiyonuna erişir
 */
export const getChatCollection = (uid: string): CollectionReference =>
  collection(db, 'users', uid, 'messages');

/**
 * Kullanıcıya ait completions (tamamlama kaydı) alt koleksiyonuna erişir
 */
export const getCompletionsCollection = (uid: string): CollectionReference =>
  collection(db, 'users', uid, 'completions');

// ─── Sorgu Oluşturucu Fonksiyonlar ────────────────────────────────────────────

/**
 * Sohbet geçmişini kronolojik sırada (yeniye göre eski) getiren sorguyu oluşturur
 */
export const buildChatHistoryQuery = (uid: string, maxMessages = 50) =>
  query(
    getChatCollection(uid),
    orderBy('createdAt', 'asc'),
    limit(maxMessages),
  );

/**
 * Tamamlama kayıtlarını tarih sırasında (yeniye göre eski) getiren sorguyu oluşturur
 */
export const buildCompletionsQuery = (uid: string, maxCompletions = 100) =>
  query(
    getCompletionsCollection(uid),
    orderBy('completedAt', 'desc'),
    limit(maxCompletions),
  );

// ─── Tarih Yardımcıları ───────────────────────────────────────────────────────

/**
 * 'YYYY-MM-DD' formatında bugünün tarih anahtarını döndürür
 */
export const getTodayKey = (): string => {
  return new Date().toISOString().slice(0, 10);
};

/**
 * Date nesnesini 'YYYY-MM-DD' formatında tarih anahtarına çevirir
 */
export const getDateKey = (d: Date): string => {
  return d.toISOString().slice(0, 10);
};

/**
 * Türkçe gün adları ('Pzt', 'Sal', vb.)
 */
export const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

/**
 * Son N günün DayStats array'ini oluşturur (başlangıç değerleri 0)
 */
export const buildDayStatsArray = (daysBack = 7): DayStats[] => {
  const days: DayStats[] = [];
  const now = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      date: getDateKey(d),
      day: TR_DAYS[d.getDay()],
      mealCount: 0,
      workoutCount: 0,
    });
  }
  return days;
};
