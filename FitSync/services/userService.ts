/**
 * userService.ts
 *
 * Firestore CRUD işlemleri:
 *   - Kullanıcı profili okuma / güncelleme
 *   - Sohbet geçmişi yazma / okuma / silme
 *   - Tamamlama kaydı yazma / okuma
 *   - Streak & Achievement takibi
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
import type { UserProfile, ChatMessage, ChatMessageInput, CompletionInput, DayStats, Achievement, StreakData, WaterIntakeInput, WaterStats, WorkoutHistoryInput, PersonalRecordInput, ExerciseDetail } from '@/types';

// Re-export for use in other modules
export type { DayStats };
import {
  getUserDoc,
  getChatCollection,
  getCompletionsCollection,
  getWaterCollection,
  getWorkoutHistoryCollection,
  getPersonalRecordsCollection,
  buildChatHistoryQuery,
  buildCompletionsQuery,
  buildWaterQuery,
  buildWorkoutHistoryQuery,
  buildPersonalRecordsQuery,
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

// ═══════════════════════════════════════════════════════════════════════════════
// STREAK & ACHIEVEMENT — Gamification Takibi
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Kullanıcı profilinde streak verilerini başlatır/günceller.
 * @param uid Kullanıcı UID'si
 * @param initialStreak Başlangıç streak data'sı (genellikle {streakCount: 0, lastActiveDate: null, longestStreak: 0})
 */
export async function initializeStreakData(uid: string, initialStreak: StreakData): Promise<void> {
  await updateDoc(getUserDoc(uid), {
    streakCount: initialStreak.streakCount,
    lastActiveDate: initialStreak.lastActiveDate,
    longestStreak: initialStreak.longestStreak,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Kullanıcının streak'ini hesapla ve güncelleyin.
 * Eğer bugün tamamlanmış işlem varsa streakCount artar, lastActiveDate güncelleir.
 * @param uid Kullanıcı UID'si
 * @param lastStreak Mevcut streak data'sı
 * @returns Yeni streak data'sı
 */
export async function calculateAndUpdateStreak(
  uid: string,
  lastStreak: StreakData,
): Promise<StreakData> {
  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday);

  // Bugün tamamlanmış işlem var mı?
  const todayCompletion = await fetchTodayCompletions(uid);
  const hasActivityToday = todayCompletion.mealCount > 0 || todayCompletion.workoutCount > 0;

  if (!hasActivityToday) {
    // Hiç aktivite yoksa streak sıfırsız
    return lastStreak;
  }

  let newStreakCount = lastStreak.streakCount;
  let newLongestStreak = lastStreak.longestStreak;

  // Eğer dün aktif idiyse streak devam ediyor
  if (lastStreak.lastActiveDate === yesterdayKey) {
    newStreakCount++;
  } else if (lastStreak.lastActiveDate !== today) {
    // Dün aktif değildiyse ve bugünü başlayan bir güne dönüş, streak sıfırdan başla
    newStreakCount = 1;
  }

  // En uzun streak'i güncelle
  newLongestStreak = Math.max(newStreakCount, lastStreak.longestStreak);

  const newStreak: StreakData = {
    streakCount: newStreakCount,
    lastActiveDate: today,
    longestStreak: newLongestStreak,
  };

  // Firestore'a yaz
  await initializeStreakData(uid, newStreak);

  // Zustand'ı güncelle
  useUserStore.getState().setStreak(newStreak);

  return newStreak;
}

/**
 * Başarıları kontrol et ve yeni başarılar ekle.
 * @param uid Kullanıcı UID'si
 * @param streakData Mevcut streak data'sı
 */
export async function checkAndAwardAchievements(uid: string, streakData: StreakData): Promise<void> {
  const store = useUserStore.getState();
  const achievements: Achievement[] = [];

  // Streak milestones
  const streakMilestones = [
    { count: 1, id: 'first_day', name: 'İlk Gün', emoji: '🌟' },
    { count: 7, id: 'week_streak', name: '7 Günlük Streak', emoji: '🔥' },
    { count: 30, id: 'month_streak', name: '30 Günlük Streak', emoji: '🏆' },
    { count: 100, id: 'century', name: 'Yüzyıl', emoji: '💯' },
  ];

  streakMilestones.forEach((milestone) => {
    if (streakData.streakCount >= milestone.count && !store.achievements.find((a) => a.id === milestone.id)) {
      achievements.push({
        id: milestone.id,
        name: milestone.name,
        emoji: milestone.emoji,
        description: `${streakData.streakCount} gün arka arda aktifsin!`,
        unlockedAt: serverTimestamp() as any,
      });
    }
  });

  // Başarıları Zustand'a ekle
  achievements.forEach((achievement) => {
    store.addAchievement(achievement);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SU İÇME TAKIBI — Su Bardağı Kaydı Yazma / Okuma
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Bir bardak su içildiğini Firestore'a kaydeder.
 * @param uid Kullanıcı UID'si
 * @returns Eklenen su kaydının ID'si
 */
export async function addWaterIntake(uid: string): Promise<string> {
  const ref = await addDoc(getWaterCollection(uid), {
    date: getTodayKey(),
    glassesDrunk: 1,
    completedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Bugün içilen su bardaklarının toplam sayısını döndürür.
 * @param uid Kullanıcı UID'si
 * @returns Bugünün su istatistikleri (todayGlasses ve dailyGoal)
 */
export async function fetchTodayWaterIntake(uid: string): Promise<WaterStats> {
  const q = buildWaterQuery(uid, 100);
  const snap = await getDocs(q);
  const today = getTodayKey();
  let todayGlasses = 0;

  snap.docs.forEach((d) => {
    const data = d.data() as { date: string; glassesDrunk: number };
    if (data.date === today) {
      todayGlasses += data.glassesDrunk || 1;
    }
  });

  return {
    todayGlasses,
    dailyGoal: 8, // Önerilen günlük su hedefi: 8 bardak
  };
}

/**
 * Son 7 günün su içme istatistiklerini döndürür.
 * @param uid Kullanıcı UID'si
 * @returns 7 günün su istatistikleri (tarih ve bardak sayısı)
 */
export async function fetchWeeklyWaterIntake(
  uid: string,
): Promise<Array<{ date: string; day: string; glasses: number }>> {
  // Son 7 günün tarih anahtarlarını oluştur
  const days = buildDayStatsArray(7).map((d) => ({
    date: d.date,
    day: d.day,
    glasses: 0,
  }));

  // Firestore'dan son 7 günün su kayıtlarını çek
  const q = buildWaterQuery(uid, 200);
  const snap = await getDocs(q);
  const oldest = days[0].date;

  snap.docs.forEach((doc) => {
    const data = doc.data() as { date: string; glassesDrunk: number };
    if (data.date < oldest) return; // 7 günden eski kayıtları atla
    const entry = days.find((d) => d.date === data.date);
    if (!entry) return;
    entry.glasses += data.glassesDrunk || 1;
  });

  return days;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANTRENMAN GEÇMİŞİ & PERSONAL RECORDS — Antrenman Kaydı Yazma / Okuma
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tamamlanan antrenmanı Firestore'a kaydeder (detaylı egzersiz listesi ile birlikte).
 * @param uid Kullanıcı UID'si
 * @param workoutName Antrenman adı ("Üst Vücut Antrenmanı" vb.)
 * @param durationMinutes Antrenman süresi (dakika)
 * @param exercises Detaylı egzersiz listesi
 * @returns Eklenen antrenman kaydının ID'si
 */
export async function addWorkoutHistory(
  uid: string,
  workoutName: string,
  durationMinutes: number,
  exercises: ExerciseDetail[],
): Promise<string> {
  const ref = await addDoc(getWorkoutHistoryCollection(uid), {
    date: getTodayKey(),
    workoutName,
    durationMinutes,
    exerciseCount: exercises.length,
    exercises,
    completedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Son N antrenmanı geçmişinden getirir.
 * @param uid Kullanıcı UID'si
 * @param maxRecords Maksimum antrenman kaydı sayısı (varsayılan: 50)
 * @returns Antrenman geçmişi array'i
 */
export async function fetchWorkoutHistory(
  uid: string,
  maxRecords = 50,
) {
  const q = buildWorkoutHistoryQuery(uid, maxRecords);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

/**
 * Egzersiz için personal record'u kontrol edip günceller.
 * @param uid Kullanıcı UID'si
 * @param exercises Tamamlanan egzersizler
 */
export async function updatePersonalRecords(
  uid: string,
  exercises: ExerciseDetail[],
): Promise<void> {
  // Mevcut PR'ları çek
  const q = buildPersonalRecordsQuery(uid);
  const snap = await getDocs(q);
  const currentPRs = new Map<string, string>();

  snap.docs.forEach((d) => {
    const data = d.data() as { exerciseName: string; maxSetsReps: string };
    currentPRs.set(data.exerciseName, data.maxSetsReps);
  });

  // Her egzersiz için PR kontrol et
  for (const exercise of exercises) {
    if (!exercise.sets || !exercise.reps) continue;

    const newSetsReps = `${exercise.sets}×${exercise.reps}`;
    const existingPR = currentPRs.get(exercise.name);

    // PR'ı parse et ve karşılaştır
    let shouldUpdate = false;
    if (!existingPR) {
      shouldUpdate = true; // İlk kez bu egzersiz yapılıyor
    } else {
      const [existingSets, existingReps] = existingPR.split('×').map(Number);
      const newSets = exercise.sets;
      const newReps = exercise.reps;

      // Yeni set sayısı daha fazlaysa veya eşit set'lerde daha fazla rep yapıldıysa
      if (newSets > existingSets || (newSets === existingSets && newReps > existingReps)) {
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      // Eski PR'ı sil ve yenisini ekle
      const oldPRDocs = snap.docs.filter(
        (d) => (d.data() as { exerciseName: string }).exerciseName === exercise.name
      );

      // Eski PR varsa sil
      for (const oldDoc of oldPRDocs) {
        await deleteDoc(oldDoc.ref);
      }

      // Yeni PR'ı ekle
      await addDoc(getPersonalRecordsCollection(uid), {
        exerciseName: exercise.name,
        maxSetsReps: newSetsReps,
        date: getTodayKey(),
        recordedAt: serverTimestamp(),
      });
    }
  }
}

/**
 * Kullanıcının tüm personal record'larını getirir.
 * @param uid Kullanıcı UID'si
 * @returns Personal records array'i (her egzersizin en iyi kaydı)
 */
export async function fetchPersonalRecords(uid: string) {
  const q = buildPersonalRecordsQuery(uid);
  const snap = await getDocs(q);

  // Her egzersiz için en yeni PR'ı al (duplicate'leri filtrele)
  const recordMap = new Map<string, any>();
  snap.docs.forEach((d) => {
    const data = d.data() as { exerciseName: string };
    if (!recordMap.has(data.exerciseName)) {
      recordMap.set(data.exerciseName, { id: d.id, ...data });
    }
  });

  return Array.from(recordMap.values());
}
