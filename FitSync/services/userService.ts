/**
 * userService.ts
 *
 * Firestore CRUD işlemleri:
 *   - Kullanıcı profili okuma / güncelleme
 *   - Sohbet geçmişi yazma / okuma / silme
 */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useUserStore } from '@/store/userStore';
import type { UserProfile, ChatMessage, ChatMessageInput, CompletionInput } from '@/types';

// ─── Kullanıcı Profili ────────────────────────────────────────────────────────

/**
 * Firestore'dan kullanıcı profilini okur ve Zustand store'u günceller.
 */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
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
 */
export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
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

// ─── Sohbet Geçmişi ──────────────────────────────────────────────────────────

const chatCollection = (uid: string) =>
  collection(db, 'users', uid, 'messages');

/**
 * Yeni bir sohbet mesajı Firestore'a ekler.
 * Dönen string değer eklenen dokümanın ID'sidir.
 */
export async function addChatMessage(
  uid: string,
  message: ChatMessageInput,
): Promise<string> {
  const ref = await addDoc(chatCollection(uid), {
    ...message,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Kullanıcının sohbet geçmişini kronolojik sırada getirir.
 * `maxMessages` ile sayfa boyutu sınırlanabilir (varsayılan: 50).
 */
export async function fetchChatHistory(
  uid: string,
  maxMessages = 50,
): Promise<ChatMessage[]> {
  const q = query(
    chatCollection(uid),
    orderBy('createdAt', 'asc'),
    limit(maxMessages),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<ChatMessage, 'id'>),
  }));
}

/**
 * Belirli bir mesajı Firestore'dan siler.
 */
export async function deleteChatMessage(uid: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'messages', messageId));
}

/**
 * Kullanıcının tüm sohbet geçmişini temizler.
 */
export async function clearChatHistory(uid: string): Promise<void> {
  const snap = await getDocs(chatCollection(uid));
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
}

// ─── Günlük Tamamlama Kaydı ──────────────────────────────────────────────────

const completionsCollection = (uid: string) =>
  collection(db, 'users', uid, 'completions');

/** 'YYYY-MM-DD' formatında bugünün tarih anahtarını döndürür */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Bir öğün veya egzersizin tamamlandığını Firestore'a kaydeder.
 * Aynı gün + label kombinasyonu zaten varsa sessizce tekrar kaydeder
 * (idempotent değil — "tekrar tamamla" senaryosu göz ardı edildi).
 */
export async function addCompletion(
  uid: string,
  type: CompletionInput['type'],
  label: string,
): Promise<string> {
  const ref = await addDoc(completionsCollection(uid), {
    type,
    date: todayKey(),
    label,
    completedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Bugüne ait tüm tamamlama kayıtlarını getirir.
 * `{ mealCount, workoutCount }` döndürür.
 */
export async function fetchTodayCompletions(
  uid: string,
): Promise<{ mealCount: number; workoutCount: number }> {
  const q = query(
    completionsCollection(uid),
    orderBy('completedAt', 'desc'),
    limit(100),
  );
  const snap = await getDocs(q);
  const today = todayKey();
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
 * Son 7 günün tamamlama özetini döndürür.
 * Dönüş: son 7 gün, eskiden yeniye sıralı array.
 * Her eleman: { date: 'YYYY-MM-DD', day: 'Pzt', mealCount, workoutCount }
 */
export interface DayStats {
  date: string;
  day: string;       // 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'
  mealCount: number;
  workoutCount: number;
}

const TR_DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchWeeklyCompletions(uid: string): Promise<DayStats[]> {
  // Son 7 günün tarih anahtarlarını oluştur
  const days: DayStats[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push({
      date: dateKey(d),
      day: TR_DAYS[d.getDay()],
      mealCount: 0,
      workoutCount: 0,
    });
  }

  // Firestore'dan son 7 günün kayıtlarını çek
  const q = query(
    completionsCollection(uid),
    orderBy('completedAt', 'desc'),
    limit(200),
  );
  const snap = await getDocs(q);
  const oldest = days[0].date;

  snap.docs.forEach((doc) => {
    const data = doc.data() as { type: string; date: string };
    if (data.date < oldest) return; // 7 günden eski
    const entry = days.find((d) => d.date === data.date);
    if (!entry) return;
    if (data.type === 'meal') entry.mealCount++;
    else if (data.type === 'workout') entry.workoutCount++;
  });

  return days;
}
