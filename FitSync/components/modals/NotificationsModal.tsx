import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MenuModal } from './MenuModal';

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
