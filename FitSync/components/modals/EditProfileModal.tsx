import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { updateUserProfile } from '@/services/userService';
import type { Goal } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { EditField } from './EditField';

export interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { colors } = useTheme();
  const em = getEmStyles(colors);

  const store = useUserStore();
  const uid = store.uid;

  // Hedef seçenekleri — renkler dinamik
  const GOAL_OPTIONS: {
    value: Goal;
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
  }[] = [
    { value: 'lose', label: 'Kilo Ver', icon: 'trending-down', color: colors.warning },
    { value: 'maintain', label: 'Dengede Kal', icon: 'remove-circle', color: colors.workoutColor },
    { value: 'gain', label: 'Kilo Al', icon: 'trending-up', color: colors.primary },
  ];

  // Lokal form state — modal açılınca mevcut değerlerle başlar
  const [displayName, setDisplayName] = useState(store.displayName ?? '');
  const [height, setHeight] = useState(store.height?.toString() ?? '');
  const [weight, setWeight] = useState(store.weight?.toString() ?? '');
  const [targetWeight, setTargetWeight] = useState(store.targetWeight?.toString() ?? '');
  const [age, setAge] = useState(store.age?.toString() ?? '');
  const [goal, setGoal] = useState<Goal | null>(store.goal ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modal her açılışında store değerlerini yenile
  useEffect(() => {
    if (visible) {
      setDisplayName(store.displayName ?? '');
      setHeight(store.height?.toString() ?? '');
      setWeight(store.weight?.toString() ?? '');
      setTargetWeight(store.targetWeight?.toString() ?? '');
      setAge(store.age?.toString() ?? '');
      setGoal(store.goal ?? null);
      setSaved(false);
    }
  }, [visible]);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      displayName: displayName.trim() || undefined,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      age: age ? parseInt(age, 10) : null,
      goal,
    };

    // Zustand
    store.setProfile({ displayName: updates.displayName ?? store.displayName });
    store.setBodyMetrics({
      height: updates.height ?? undefined,
      weight: updates.weight ?? undefined,
      targetWeight: updates.targetWeight ?? undefined,
      goal: updates.goal ?? undefined,
    });

    // Firestore (fire-and-forget)
    if (uid) updateUserProfile(uid, updates).catch(console.error);

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={em.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={em.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={em.topBar}>
              <Text style={em.title}>Profili Düzenle</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Kişisel */}
            <View style={em.section}>
              <Text style={em.sectionLabel}>👤 Kişisel Bilgiler</Text>
              <EditField label="Ad Soyad" value={displayName} onChange={setDisplayName} placeholder="Adın ve soyadın" icon="person-outline" autoCapitalize="words" />
            </View>

            {/* Vücut */}
            <View style={em.section}>
              <Text style={em.sectionLabel}>📏 Vücut Ölçüleri</Text>
              <View style={em.row}>
                <View style={{ flex: 1 }}>
                  <EditField label="Boy (cm)" value={height} onChange={setHeight} placeholder="170" icon="resize-outline" keyboardType="numeric" maxLength={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Kilo (kg)" value={weight} onChange={setWeight} placeholder="70" icon="scale-outline" keyboardType="numeric" maxLength={3} />
                </View>
              </View>
              <View style={em.row}>
                <View style={{ flex: 1 }}>
                  <EditField label="Hedef Kilo (kg)" value={targetWeight} onChange={setTargetWeight} placeholder="65" icon="trophy-outline" keyboardType="numeric" maxLength={3} />
                </View>
                <View style={{ flex: 1 }}>
                  <EditField label="Yaş" value={age} onChange={setAge} placeholder="25" icon="calendar-outline" keyboardType="numeric" maxLength={2} />
                </View>
              </View>
            </View>

            {/* Hedef */}
            <View style={em.section}>
              <Text style={em.sectionLabel}>🎯 Hedefin</Text>
              <View style={em.goalRow}>
                {GOAL_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[em.goalChip, goal === opt.value && { backgroundColor: opt.color + '20', borderColor: opt.color }]}
                    onPress={() => setGoal(opt.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={opt.icon} size={16} color={goal === opt.value ? opt.color : colors.textMuted} />
                    <Text style={[em.goalChipText, goal === opt.value && { color: opt.color }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Kaydet */}
            <TouchableOpacity style={em.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving || saved}>
              <LinearGradient
                colors={saved ? [colors.primary, colors.primaryDark] : [colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={em.saveBtnGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : saved ? (
                  <>
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                    <Text style={em.saveBtnText}>Kaydedildi!</Text>
                  </>
                ) : (
                  <Text style={em.saveBtnText}>Kaydet</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const getEmStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 22, gap: 20, paddingBottom: 40 },
    topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
    title: { fontSize: 20, fontWeight: '800', color: colors.text },
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
    row: { flexDirection: 'row', gap: 12 },
    goalRow: { flexDirection: 'row', gap: 10 },
    goalChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
    },
    goalChipText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
    saveBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: colors.primary, shadowOpacity: 0.35, shadowOffset: { width: 0, height: 6 }, shadowRadius: 14, elevation: 6 },
    saveBtnGradient: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },
  });
