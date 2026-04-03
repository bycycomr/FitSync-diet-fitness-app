/**
 * userService.ts
 *
 * Firestore CRUD işlemleri:
 *   - Kullanıcı profili okuma / güncelleme
 *   - Sohbet geçmişi yazma / okuma / silme
 *   - Tamamlama kaydı yazma / okuma
 */

import {
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useUserStore } from '@/store/userStore';
import type { UserProfile, ChatMessage, ChatMessageInput, CompletionInput, DayStats } from '@/types';

// Re-export DayStats for use in other modules
export type { DayStats };
import {
  getUserDoc,
  getChatCollection,
  getCompletionsCollection,
  buildChatHistoryQuery,
  buildCompletionsQuery,
  getTodayKey,
  getDateKey,
  TR_DAYS,
  buildDayStatsArray,
} from './query/Firestore';

// ═══════════════════════════════════════════════════════════════════════════════
// KULLANICI PROFILI — Profile Okuma / Güncelleme
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Firestore'dan kullanıcı profilini okur ve Zustand store'u günceller.
 * @param uid Kullanıcı UID'si
 * @returns Kullanıcı profili veya null
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(getUserDoc(uid));
  if (!snap.exists()) return null;

  const data = snap.data() as UserProfile;

  // Zustand store'u Firestore verileriyle senkronize et
  const store = useUserStore.getState();
  store.setProfile({
    displayName: data.displayName,
    email: data.email,
    uid: data.uid,
  });
  store.setBodyMetrics({
    height: data.height ?? undefined,
    weight: data.weight ?? undefined,
    targetWeight: data.targetWeight ?? undefined,
    goal: data.goal ?? undefined,
  });

  return data;
}

/**
 * Kullanıcı profilini kısmi olarak günceller (Firestore + Zustand).
 * @param uid Kullanıcı UID'si
 * @param updates Güncellenecek alanlar
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(getUserDoc(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });

  // Zustand'ı güncelle
  const store = useUserStore.getState();
  const { displayName, email, height, weight, targetWeight, goal } = updates;

  if (displayName !== undefined || email !== undefined) {
    store.setProfile({ displayName, email });
  }
  if (
    height !== undefined ||
    weight !== undefined ||
    targetWeight !== undefined ||
    goal !== undefined
  ) {
    store.setBodyMetrics({ height, weight, targetWeight, goal });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SOHBET GEÇMİŞİ — Mesaj Yazma / Okuma / Silme
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Yeni bir sohbet mesajı Firestore'a ekler.
 * @param uid Kullanıcı UID'si
 * @param message Eklenecek mesaj
 * @returns Eklenen dokümanın ID'si
 */
export async function addChatMessage(
  uid: string,
  message: ChatMessageInput,
): Promise<string> {
  const ref = await addDoc(getChatCollection(uid), {
    ...message,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Kullanıcının sohbet geçmişini kronolojik sırada getirir (yeniye göre eski).
 * @param uid Kullanıcı UID'si
 * @param maxMessages Maksimum mesaj sayısı (varsayılan: 50)
 * @returns Sohbet mesajları array'i
 */
export async function fetchChatHistory(
  uid: string,
  maxMessages = 50,
): Promise<ChatMessage[]> {
  const q = buildChatHistoryQuery(uid, maxMessages);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ChatMessage, 'id'>),
  }));
}

/**
 * Belirli bir mesajı Firestore'dan siler.
 * @param uid Kullanıcı UID'si
 * @param messageId Silinecek mesaj ID'si
 */
export async function deleteChatMessage(uid: string, messageId: string): Promise<void> {
  await deleteDoc(doc(getChatCollection(uid), messageId));
}

/**
 * Kullanıcının tüm sohbet geçmişini temizler.
 * @param uid Kullanıcı UID'si
 */
export async function clearChatHistory(uid: string): Promise<void> {
  const snap = await getDocs(getChatCollection(uid));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAMAMLAMA KAYDI — Öğün & Antrenman Tamamlama Takibi
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bir öğün veya egzersizin tamamlandığını Firestore'a kaydeder.
 * @param uid Kullanıcı UID'si
 * @param type Tamamlama türü ('meal' | 'workout')
 * @param label Öğün / antrenman adı
 * @returns Eklenen tamamlama kaydının ID'si
 */
export async function addCompletion(
  uid: string,
  type: CompletionInput['type'],
  label: string,
): Promise<string> {
  const ref = await addDoc(getCompletionsCollection(uid), {
    type,
    date: getTodayKey(),
    label,
    completedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Bugüne ait tüm tamamlama kayıtlarını getirir.
 * @param uid Kullanıcı UID'si
 * @returns Bugünkü öğün & antrenman tamamlama sayıları
 */
export async function fetchTodayCompletions(
  uid: string,
): Promise<{ mealCount: number; workoutCount: number }> {
  const q = buildCompletionsQuery(uid, 100);
  const snap = await getDocs(q);
  const today = getTodayKey();
  let mealCount = 0;
  let workoutCount = 0;

  snap.docs.forEach((d) => {
    const data = d.data() as { type: string; date: string };
    if (data.date !== today) return;
    if (data.type === 'meal') mealCount++;
    else if (data.type === 'workout') workoutCount++;
  });

  return { mealCount, workoutCount };
}

/**
 * Son 7 günün tamamlama özetini döndürür (konuşma hafızası için).
 * @param uid Kullanıcı UID'si
 * @returns 7 günün detaylı istatistikleri (eskiden yeniye)
 */
export async function fetchWeeklyCompletions(uid: string): Promise<DayStats[]> {
  // Son 7 günün tarih anahtarlarını oluştur (başlangıç değerleri 0)
  const days = buildDayStatsArray(7);

  // Firestore'dan son 7 günün kayıtlarını çek
  const q = buildCompletionsQuery(uid, 200);
  const snap = await getDocs(q);
  const oldest = days[0].date;

  snap.docs.forEach((doc) => {
    const data = doc.data() as { type: string; date: string };
    if (data.date < oldest) return; // 7 günden eski kayıtları atla
    const entry = days.find((d) => d.date === data.date);
    if (!entry) return;
    if (data.type === 'meal') entry.mealCount++;
    else if (data.type === 'workout') entry.workoutCount++;
  });

  return days;
}
