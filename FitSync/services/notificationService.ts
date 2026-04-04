/**
 * services/notificationService.ts
 *
 * Push notification yönetimi — su içme hatırlatmaları
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirim ayarlarını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  } as any),
});

const WATER_REMINDER_KEY = 'water_reminder_enabled';
const WATER_REMINDER_INTERVAL_HOURS = 2; // Her 2 saatte bir hatırlatma

/**
 * Push notification izni ister ve döndürür
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (err) {
    console.error('Notification izni hatası:', err);
    return false;
  }
}

/**
 * Su içme hatırlatmasını başlatır (her 2 saatte bir)
 */
export async function scheduleWaterReminder(): Promise<void> {
  try {
    // Mevcut hatırlatmaları temizle
    await Notifications.cancelAllScheduledNotificationsAsync();

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
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem(WATER_REMINDER_KEY, 'disabled');
  } catch (err) {
    console.error('Su hatırlatması iptal hatası:', err);
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
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💧 Su İçme Zamanı!',
        body: 'Bu bir test bildirimidir. Bir bardak su iç!',
        sound: 'default',
      },
      trigger: { type: 'timeInterval' as any, seconds: 1 },
    });
  } catch (err) {
    console.error('Test bildirimi hatası:', err);
  }
}
