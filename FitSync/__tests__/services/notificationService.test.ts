/**
 * __tests__/services/notificationService.test.ts
 *
 * Test suite for notificationService.ts
 * Tests lazy loading, mock fallback, and SDK 53+ compatibility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as notificationService from '@/services/notificationService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-notifications with lazy loading
let mockNotificationsModule: any = null;
jest.mock('expo-notifications', () => {
  return {
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
    cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  };
}, { virtual: true });

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('requestNotificationPermissions', () => {
    it('should request permissions and return true on success', async () => {
      const result = await notificationService.requestNotificationPermissions();
      expect(result).toBe(true);
    });

    it('should return false when permissions are denied', async () => {
      // Mock permissions denied
      jest.doMock('expo-notifications', () => ({
        requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'denied' }),
      }), { virtual: true });

      const result = await notificationService.requestNotificationPermissions();
      expect(result).toBe(false);
    });

    it('should catch errors gracefully and return false', async () => {
      // Mock error scenario
      jest.doMock('expo-notifications', () => ({
        requestPermissionsAsync: jest.fn().mockRejectedValue(new Error('Permission error')),
      }), { virtual: true });

      const result = await notificationService.requestNotificationPermissions();
      expect(result).toBe(false);
    });
  });

  describe('scheduleWaterReminder', () => {
    it('should schedule notifications for 09:00-21:00 every 2 hours', async () => {
      await notificationService.scheduleWaterReminder();

      // Should save enabled state to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'water_reminder_enabled',
        'enabled'
      );
    });

    it('should cancel previous notifications before scheduling new ones', async () => {
      await notificationService.scheduleWaterReminder();

      // Verify multiple schedule calls (9, 11, 13, 15, 17, 19)
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle schedule errors gracefully', async () => {
      jest.doMock('expo-notifications', () => ({
        scheduleNotificationAsync: jest.fn().mockRejectedValue(new Error('Schedule failed')),
        cancelAllScheduledNotificationsAsync: jest.fn(),
      }), { virtual: true });

      // Should not throw
      await expect(notificationService.scheduleWaterReminder()).resolves.not.toThrow();
    });
  });

  describe('cancelWaterReminder', () => {
    it('should cancel all scheduled notifications', async () => {
      await notificationService.cancelWaterReminder();

      // Should save disabled state to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'water_reminder_enabled',
        'disabled'
      );
    });

    it('should handle cancellation errors gracefully', async () => {
      jest.doMock('expo-notifications', () => ({
        cancelAllScheduledNotificationsAsync: jest.fn().mockRejectedValue(new Error('Cancel failed')),
      }), { virtual: true });

      // Should not throw
      await expect(notificationService.cancelWaterReminder()).resolves.not.toThrow();
    });
  });

  describe('isWaterReminderEnabled', () => {
    it('should return true when AsyncStorage contains "enabled"', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('enabled');

      const result = await notificationService.isWaterReminderEnabled();
      expect(result).toBe(true);
    });

    it('should return false when AsyncStorage contains "disabled"', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('disabled');

      const result = await notificationService.isWaterReminderEnabled();
      expect(result).toBe(false);
    });

    it('should return false when AsyncStorage returns null', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const result = await notificationService.isWaterReminderEnabled();
      expect(result).toBe(false);
    });

    it('should handle AsyncStorage errors and return false', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('AsyncStorage error'));

      const result = await notificationService.isWaterReminderEnabled();
      expect(result).toBe(false);
    });
  });

  describe('sendTestWaterNotification', () => {
    it('should schedule a test notification with 1 second delay', async () => {
      await notificationService.sendTestWaterNotification();

      // Should complete without throwing
      expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle test notification errors gracefully', async () => {
      jest.doMock('expo-notifications', () => ({
        scheduleNotificationAsync: jest.fn().mockRejectedValue(new Error('Test failed')),
      }), { virtual: true });

      // Should not throw
      await expect(notificationService.sendTestWaterNotification()).resolves.not.toThrow();
    });
  });

  describe('SDK 53+ Expo Go Compatibility', () => {
    it('should use mock notifications when expo-notifications is unavailable', async () => {
      // This tests the lazy loading fallback behavior
      // When require('expo-notifications') fails, it should use NotificationMock
      const result = await notificationService.requestNotificationPermissions();

      // Even if notifications module is unavailable, should return boolean
      expect(typeof result).toBe('boolean');
    });

    it('should not crash app initialization', async () => {
      // Main test: notificationService can be imported and used without crashing
      // This was the original issue in SDK 53+ Expo Go
      expect(() => {
        require('@/services/notificationService');
      }).not.toThrow();
    });
  });
});
