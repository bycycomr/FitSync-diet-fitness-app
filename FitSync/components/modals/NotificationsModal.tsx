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
  scheduleMealReminder,
  cancelMealReminder,
  isMealReminderEnabled,
  type MealReminderType,
} from '@/services/notificationService';

export interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

const MEAL_CONFIGS: { key: MealReminderType; label: string; hour: number; minute: number }[] = [
  { key: 'breakfast', label: '🍳 Kahvaltı (08:00)', hour: 8,  minute: 0  },
  { key: 'lunch',     label: '🥗 Öğle (12:30)',    hour: 12, minute: 30 },
  { key: 'dinner',    label: '🍽️ Akşam (19:00)',   hour: 19, minute: 0  },
];

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useTheme();
  const ms = getStyles(colors);

  const [waterReminder, setWaterReminder] = useState(false);
  const [mealStates, setMealStates] = useState<Record<MealReminderType, boolean>>({
    breakfast: false,
    lunch: false,
    dinner: false,
  });

  useEffect(() => {
    if (!visible) return;
    isWaterReminderEnabled().then(setWaterReminder).catch(console.error);
    MEAL_CONFIGS.forEach(({ key }) => {
      isMealReminderEnabled(key)
        .then((on) => setMealStates((prev) => ({ ...prev, [key]: on })))
        .catch(console.error);
    });
  }, [visible]);

  const handleWaterReminderToggle = async () => {
    const newState = !waterReminder;
    setWaterReminder(newState);
    if (newState) {
      const permitted = await requestNotificationPermissions();
      if (permitted) {
        await scheduleWaterReminder();
        Alert.alert('💧 Su Hatırlatması', 'Günde 09:00–21:00 arası her 2 saatte su içme hatırlatması alacaksın.');
      } else {
        setWaterReminder(false);
        Alert.alert('⚠️ İzin Reddedildi', 'Bildirim izni gerekli. Cihaz ayarlarından etkinleştir.');
      }
    } else {
      await cancelWaterReminder();
    }
  };

  const handleMealToggle = async (meal: MealReminderType, hour: number, minute: number) => {
    const newState = !mealStates[meal];
    setMealStates((prev) => ({ ...prev, [meal]: newState }));
    if (newState) {
      const permitted = await requestNotificationPermissions();
      if (permitted) {
        await scheduleMealReminder(meal, hour, minute);
      } else {
        setMealStates((prev) => ({ ...prev, [meal]: false }));
        Alert.alert('⚠️ İzin Reddedildi', 'Bildirim izni gerekli. Cihaz ayarlarından etkinleştir.');
      }
    } else {
      await cancelMealReminder(meal);
    }
  };

  const ToggleRow = ({ label, value, onPress }: { label: string; value: boolean; onPress: () => void }) => (
    <TouchableOpacity style={ms.toggleRow} onPress={onPress} activeOpacity={0.8}>
      <Text style={ms.toggleLabel}>{label}</Text>
      <View style={[ms.toggle, value && ms.toggleOn]}>
        <View style={[ms.toggleThumb, value && ms.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <MenuModal visible={visible} onClose={onClose} title="Bildirimler">
      <View style={ms.section}>
        <Text style={ms.sectionLabel}>💧 Su İçme Hatırlatıcısı</Text>
        <ToggleRow
          label="Her 2 saatte bir (09:00–21:00)"
          value={waterReminder}
          onPress={handleWaterReminderToggle}
        />
      </View>

      <View style={[ms.section, { marginTop: 16 }]}>
        <Text style={ms.sectionLabel}>🍽️ Öğün Hatırlatıcıları</Text>
        <Text style={ms.hint}>Her öğünü bağımsız olarak açıp kapatabilirsin.</Text>
        {MEAL_CONFIGS.map(({ key, label, hour, minute }, idx) => (
          <View key={key}>
            {idx > 0 && <View style={ms.divider} />}
            <ToggleRow
              label={label}
              value={mealStates[key]}
              onPress={() => handleMealToggle(key, hour, minute)}
            />
          </View>
        ))}
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
