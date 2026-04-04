import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MenuModal } from './MenuModal';
import {
  scheduleWaterReminder,
  cancelWaterReminder,
  isWaterReminderEnabled,
  requestNotificationPermissions,
} from '@/services/notificationService';

export interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useTheme();
  const ms = getStyles(colors);

  const [dailyReminder, setDailyReminder] = useState(false);
  const [mealReminder, setMealReminder] = useState(false);
  const [workoutAlert, setWorkoutAlert] = useState(false);
  const [waterReminder, setWaterReminder] = useState(false);

  // Modal açıldığında su hatırlatma durumunu kontrol et
  useEffect(() => {
    if (visible) {
      isWaterReminderEnabled().then(setWaterReminder).catch(console.error);
    }
  }, [visible]);

  const toggleRow = (label: string, val: boolean, set: (v: boolean) => void) => (
    <TouchableOpacity
      style={ms.toggleRow}
      onPress={() => {
        set(!val);
        Alert.alert('🔔 Bildirim', `${label} ${!val ? 'açıldı' : 'kapatıldı'}.`);
      }}
      activeOpacity={0.8}
    >
      <Text style={ms.toggleLabel}>{label}</Text>
      <View style={[ms.toggle, val && ms.toggleOn]}>
        <View style={[ms.toggleThumb, val && ms.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );

  const handleWaterReminderToggle = async () => {
    const newState = !waterReminder;
    setWaterReminder(newState);

    if (newState) {
      // İzin iste ve hatırlatmayı başlat
      const permitted = await requestNotificationPermissions();
      if (permitted) {
        await scheduleWaterReminder();
        Alert.alert('💧 Su Hatırlatması', 'Günde 09:00 - 21:00 arası her 2 saatte su içme hatırlatması alacaksın.');
      } else {
        setWaterReminder(false);
        Alert.alert('⚠️ İzin Reddedildi', 'Bildirim izni gerekli. Cihaz ayarlarından etkinleştir.');
      }
    } else {
      // Hatırlatmayı iptal et
      await cancelWaterReminder();
      Alert.alert('💧 Su Hatırlatması', 'Su içme hatırlatmaları kapatıldı.');
    }
  };

  return (
    <MenuModal visible={visible} onClose={onClose} title="Bildirimler">
      <View style={ms.section}>
        <Text style={ms.sectionLabel}>🔔 Bildirim Tercihleri</Text>
        <Text style={ms.hint}>Expo Notifications izni gerektirir. Cihaz ayarlarından da yönetebilirsin.</Text>
        {toggleRow('Günlük Hatırlatıcı (09:00)', dailyReminder, setDailyReminder)}
        <View style={ms.divider} />
        {toggleRow('Öğün Hatırlatıcıları', mealReminder, setMealReminder)}
        <View style={ms.divider} />
        {toggleRow('Antrenman Uyarıları', workoutAlert, setWorkoutAlert)}
        <View style={ms.divider} />
        <TouchableOpacity
          style={ms.toggleRow}
          onPress={handleWaterReminderToggle}
          activeOpacity={0.8}
        >
          <Text style={ms.toggleLabel}>💧 Su İçme Hatırlatıcıları (Her 2 saat)</Text>
          <View style={[ms.toggle, waterReminder && ms.toggleOn]}>
            <View style={[ms.toggleThumb, waterReminder && ms.toggleThumbOn]} />
          </View>
        </TouchableOpacity>
      </View>
    </MenuModal>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  toggleLabel: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  divider: { height: 1, backgroundColor: colors.border },
});
