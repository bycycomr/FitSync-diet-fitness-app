/**
 * services/notificationService.ts
 *
 * Push notification yönetimi — su içme hatırlatmaları
 *
 * NOT: Expo Go'da SDK 53+'de push notifications çalışmıyor.
 * Development build veya EAS Build gerekli.
 *
 * SDK 53+ uyumluluğu: Lazy loading pattern (module sadece çağrılınca yüklenir)
 * Metro bundler'ın initialization hatasını önlemek için require() sadece ihtiyaç anında yapılır.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification mock object (SDK 53+ Expo Go uyumluluğu)
const NotificationMock = {
  setNotificationHandler: () => {},
  requestPermissionsAsync: async () => ({ status: 'denied' }),
  cancelAllScheduledNotificationsAsync: async () => {},
  scheduleNotificationAsync: async () => {},
};

// Cache for loaded Notifications module (lazy loading)
let CachedNotifications: any = null;
let InitializationAttempted = false;

/**
 * Notifications modülünü lazy yükle (sadece ihtiyaç anında)
 */
function getNotifications() {
  if (InitializationAttempted) {
    return CachedNotifications || NotificationMock;
  }

  InitializationAttempted = true;

  try {
    const RealNotifications = require('expo-notifications');
    if (RealNotifications) {
      // Bildirim ayarlarını yapılandır
      RealNotifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        } as any),
      });
      CachedNotifications = RealNotifications;
      return RealNotifications;
    }
  } catch (error) {
    // Expo Go SDK 53+ — notifications module unavailable, using mock
    console.log('Push notifications not available in this environment.');
  }

  return NotificationMock;
}

const WATER_REMINDER_KEY = 'water_reminder_enabled';
const WATER_REMINDER_INTERVAL_HOURS = 2; // Her 2 saatte bir hatırlatma

/**
 * Push notification izni ister ve döndürür
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const Notifications = getNotifications();
    const result = await Notifications.requestPermissionsAsync();
    return result?.status === 'granted';
  } catch (err) {
    console.log('Notification permissions unavailable');
    return false;
  }
}

/**
 * Su içme hatırlatmasını başlatır (her 2 saatte bir)
 */
export async function scheduleWaterReminder(): Promise<void> {
  try {
    const Notifications = getNotifications();

    // Mevcut hatırlatmaları temizle
    if (Notifications.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }

    // Her 2 saatte bir bildirimi planla (09:00 - 21:00)
    const startHour = 9;
    const endHour = 21;
    const intervalHours = WATER_REMINDER_INTERVAL_HOURS;

    for (let hour = startHour; hour < endHour; hour += intervalHours) {
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hour, 0, 0, 0);

      // Eğer saat geçtiyse yarın olması için
      if (reminderTime <= now) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      if (Notifications.scheduleNotificationAsync) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Su İçme Zamanı!',
            body: 'Bir bardak su iç ve sağlıklı kal! Tamamladığında karttan ekle.',
            sound: 'default',
            badge: 1,
          },
          trigger: {
            type: 'calendar' as any,
            hour,
            minute: 0,
            repeats: true,
          },
        });
      }
    }

    // Durumu kaydet
    await AsyncStorage.setItem(WATER_REMINDER_KEY, 'enabled');
  } catch (err) {
    console.error('Su hatırlatması planlama hatası:', err);
  }
}

/**
 * Su içme hatırlatmasını durdurur
 */
export async function cancelWaterReminder(): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (Notifications.cancelAllScheduledNotificationsAsync) {
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
    await AsyncStorage.setItem(WATER_REMINDER_KEY, 'disabled');
  } catch (err) {
    console.log('Could not cancel notifications');
  }
}

/**
 * Su hatırlatması etkin mi kontrol et
 */
export async function isWaterReminderEnabled(): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(WATER_REMINDER_KEY);
    return status === 'enabled';
  } catch (err) {
    console.error('Hatırlatma durumu kontrol hatası:', err);
    return false;
  }
}

/**
 * Hemen test bildirimi gönder (test amaçlı)
 */
export async function sendTestWaterNotification(): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (Notifications.scheduleNotificationAsync) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Su İçme Zamanı!',
          body: 'Bu bir test bildirimidir. Bir bardak su iç!',
          sound: 'default',
        },
        trigger: { type: 'timeInterval' as any, seconds: 1 },
      });
    }
  } catch (err) {
    console.log('Test notification not available');
  }
}

// ─── Öğün Hatırlatıcıları ─────────────────────────────────────────────────────

export type MealReminderType = 'breakfast' | 'lunch' | 'dinner';

const MEAL_REMINDER_ID_KEY = (meal: MealReminderType) => `meal_reminder_id_${meal}`;
const MEAL_REMINDER_ENABLED_KEY = (meal: MealReminderType) => `meal_reminder_enabled_${meal}`;

const MEAL_DEFAULTS: Record<MealReminderType, { title: string; body: string }> = {
  breakfast: { title: '🍳 Kahvaltı Zamanı!', body: 'Güne enerjili başlamak için kahvaltını yapma vakti.' },
  lunch:     { title: '🥗 Öğle Yemeği Zamanı!', body: 'Öğle öğününü kaçırma, enerjini koru!' },
  dinner:    { title: '🍽️ Akşam Yemeği Zamanı!', body: 'Akşam öğününü kaydetmeyi unutma.' },
};

/**
 * Belirli bir öğün için günlük push notification planlar.
 * Aynı öğünün önceki bildirimi varsa önce iptal eder.
 */
export async function scheduleMealReminder(
  meal: MealReminderType,
  hour: number,
  minute: number,
): Promise<void> {
  try {
    const Notifications = getNotifications();
    if (!Notifications.scheduleNotificationAsync) return;

    // Mevcut bildirimi iptal et
    await cancelMealReminder(meal);

    const { title, body } = MEAL_DEFAULTS[meal];
    const id: string = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: 'calendar' as any, hour, minute, repeats: true },
    });

    await AsyncStorage.setItem(MEAL_REMINDER_ID_KEY(meal), id);
    await AsyncStorage.setItem(MEAL_REMINDER_ENABLED_KEY(meal), 'enabled');
  } catch (err) {
    console.error(`Öğün hatırlatması planlama hatası (${meal}):`, err);
  }
}

/**
 * Belirli bir öğünün hatırlatmasını iptal eder.
 */
export async function cancelMealReminder(meal: MealReminderType): Promise<void> {
  try {
    const Notifications = getNotifications();
    const id = await AsyncStorage.getItem(MEAL_REMINDER_ID_KEY(meal));
    if (id && Notifications.cancelScheduledNotificationAsync) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    await AsyncStorage.removeItem(MEAL_REMINDER_ID_KEY(meal));
    await AsyncStorage.setItem(MEAL_REMINDER_ENABLED_KEY(meal), 'disabled');
  } catch (err) {
    console.log(`Öğün hatırlatması iptal hatası (${meal}):`, err);
  }
}

/**
 * Belirli bir öğünün hatırlatmasının etkin olup olmadığını kontrol eder.
 */
export async function isMealReminderEnabled(meal: MealReminderType): Promise<boolean> {
  try {
    const status = await AsyncStorage.getItem(MEAL_REMINDER_ENABLED_KEY(meal));
    return status === 'enabled';
  } catch {
    return false;
  }
}
