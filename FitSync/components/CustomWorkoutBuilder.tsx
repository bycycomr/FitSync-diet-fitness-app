import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { addCustomWorkout, fetchCustomWorkouts, deleteCustomWorkout } from '@/services/userService';
import type { CustomWorkout, Exercise, WorkoutPlan } from '@/types';

// ─── Egzersiz Satırı (modal içi) ─────────────────────────────────────────────

interface ExerciseFormItem extends Exercise {
  key: string; // lokal key — React list rendering için
}

function ExerciseFormRow({
  item,
  index,
  colors,
  onUpdate,
  onRemove,
}: {
  item: ExerciseFormItem;
  index: number;
  colors: ReturnType<typeof useTheme>['colors'];
  onUpdate: (key: string, field: keyof Exercise, value: string) => void;
  onRemove: (key: string) => void;
}) {
  const s = getRowStyles(colors);
  return (
    <View style={s.row}>
      <View style={s.rowHeader}>
        <View style={[s.numBadge, { backgroundColor: colors.primary + '22' }]}>
          <Text style={[s.numText, { color: colors.primary }]}>{index + 1}</Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(item.key)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <TextInput
        style={s.nameInput}
        placeholder="Egzersiz adı (örn: Şınav)"
        placeholderTextColor={colors.textMuted}
        value={item.name}
        onChangeText={(v) => onUpdate(item.key, 'name', v)}
      />

      <View style={s.metricsRow}>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Set</Text>
          <TextInput
            style={s.metricInput}
            placeholder="3"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={item.sets !== undefined ? String(item.sets) : ''}
            onChangeText={(v) => onUpdate(item.key, 'sets', v)}
          />
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Tekrar</Text>
          <TextInput
            style={s.metricInput}
            placeholder="10"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={item.reps !== undefined ? String(item.reps) : ''}
            onChangeText={(v) => onUpdate(item.key, 'reps', v)}
          />
        </View>
        <View style={s.metricBox}>
          <Text style={s.metricLabel}>Dinlenme (sn)</Text>
          <TextInput
            style={s.metricInput}
            placeholder="60"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={item.restSeconds !== undefined ? String(item.restSeconds) : ''}
            onChangeText={(v) => onUpdate(item.key, 'restSeconds', v)}
          />
        </View>
      </View>
    </View>
  );
}

const getRowStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  numBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numText: { fontSize: 12, fontWeight: '700' },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.cardBackground,
    marginBottom: 8,
  },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricBox: { flex: 1 },
  metricLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 4, fontWeight: '600' },
  metricInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 6,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.cardBackground,
    textAlign: 'center',
  },
});

// ─── Şablon Kartı ─────────────────────────────────────────────────────────────

function WorkoutTemplateCard({
  workout,
  colors,
  onLoad,
  onDelete,
}: {
  workout: CustomWorkout;
  colors: ThemeColors;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const s = getCardStyles(colors);
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.iconBox, { backgroundColor: colors.workoutColor + '1A' }]}>
          <Ionicons name="barbell" size={16} color={colors.workoutColor} />
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardName}>{workout.name}</Text>
          <Text style={s.cardMeta}>
            {workout.exercises.length} egzersiz · {workout.durationMinutes} dk
          </Text>
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={s.exerciseChips}>
        {workout.exercises.slice(0, 3).map((ex, i) => (
          <View key={i} style={[s.chip, { backgroundColor: colors.workoutColor + '15' }]}>
            <Text style={[s.chipText, { color: colors.workoutColor }]} numberOfLines={1}>
              {ex.name}
            </Text>
          </View>
        ))}
        {workout.exercises.length > 3 && (
          <View style={[s.chip, { backgroundColor: colors.border }]}>
            <Text style={[s.chipText, { color: colors.textMuted }]}>+{workout.exercises.length - 3}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.loadBtn, { backgroundColor: colors.workoutColor }]} onPress={onLoad}>
        <Ionicons name="play" size={14} color="#FFF" />
        <Text style={s.loadBtnText}>Şablonu Yükle</Text>
      </TouchableOpacity>
    </View>
  );
}

const getCardStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  exerciseChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 120 },
  chipText: { fontSize: 11, fontWeight: '600' },
  loadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 9,
  },
  loadBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

interface CustomWorkoutBuilderProps {
  uid: string;
  onLoad: (plan: WorkoutPlan) => void;
}

export function CustomWorkoutBuilder({ uid, onLoad }: CustomWorkoutBuilderProps) {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const [workouts, setWorkouts] = useState<CustomWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal form state
  const [workoutName, setWorkoutName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [exercises, setExercises] = useState<ExerciseFormItem[]>([
    { key: '1', name: '', sets: 3, reps: 10, restSeconds: 60 },
  ]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCustomWorkouts(uid);
      setWorkouts(data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [uid, fadeAnim]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setWorkoutName('');
    setDurationMinutes('45');
    setExercises([{ key: '1', name: '', sets: 3, reps: 10, restSeconds: 60 }]);
  };

  const openModal = () => { resetForm(); setModalVisible(true); };
  const closeModal = () => setModalVisible(false);

  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      { key: String(Date.now()), name: '', sets: 3, reps: 10, restSeconds: 60 },
    ]);
  };

  const updateExercise = (key: string, field: keyof Exercise, value: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.key !== key) return ex;
        const numFields: (keyof Exercise)[] = ['sets', 'reps', 'restSeconds', 'durationSeconds'];
        if (numFields.includes(field)) {
          const num = parseInt(value, 10);
          return { ...ex, [field]: isNaN(num) ? undefined : num };
        }
        return { ...ex, [field]: value };
      }),
    );
  };

  const removeExercise = (key: string) => {
    setExercises((prev) => prev.filter((ex) => ex.key !== key));
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Hata', 'Antrenman adı girilmesi zorunludur.');
      return;
    }
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      Alert.alert('Hata', 'En az bir egzersiz eklemelisin.');
      return;
    }

    try {
      setSaving(true);
      const cleanExercises: Exercise[] = validExercises.map(({ key: _key, ...ex }) => ex);
      await addCustomWorkout(uid, {
        name: workoutName.trim(),
        exercises: cleanExercises,
        durationMinutes: parseInt(durationMinutes, 10) || 45,
      });
      closeModal();
      await load();
    } catch (e) {
      Alert.alert('Hata', 'Şablon kaydedilemedi. Tekrar dene.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (workout: CustomWorkout) => {
    Alert.alert(
      'Şablonu Sil',
      `"${workout.name}" şablonunu kalıcı olarak silmek istiyor musun?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomWorkout(uid, workout.id);
              setWorkouts((prev) => prev.filter((w) => w.id !== workout.id));
            } catch {
              Alert.alert('Hata', 'Silme işlemi başarısız.');
            }
          },
        },
      ],
    );
  };

  const handleLoad = (workout: CustomWorkout) => {
    const plan: WorkoutPlan = {
      name: workout.name,
      durationMinutes: workout.durationMinutes,
      exercises: workout.exercises,
    };
    onLoad(plan);
    Alert.alert('✅ Şablon Yüklendi', `"${workout.name}" aktif antrenman planına ayarlandı.`);
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Başlık */}
      <View style={s.header}>
        <View style={[s.iconBox, { backgroundColor: colors.workoutColor + '1A' }]}>
          <Ionicons name="clipboard" size={18} color={colors.workoutColor} />
        </View>
        <Text style={s.title}>Şablonlarım</Text>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.workoutColor }]} onPress={openModal}>
          <Ionicons name="add" size={16} color="#FFF" />
          <Text style={s.addBtnText}>Yeni</Text>
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      {loading ? (
        <ActivityIndicator color={colors.workoutColor} style={{ marginVertical: 20 }} />
      ) : workouts.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="barbell-outline" size={32} color={colors.textMuted} />
          <Text style={s.emptyText}>Henüz şablon yok</Text>
          <Text style={s.emptyHint}>Kendi antrenman şablonlarını oluştur ve tek tıkla yükle</Text>
        </View>
      ) : (
        workouts.map((w) => (
          <WorkoutTemplateCard
            key={w.id}
            workout={w}
            colors={colors}
            onLoad={() => handleLoad(w)}
            onDelete={() => handleDelete(w)}
          />
        ))
      )}

      {/* Oluşturma Modalı */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={s.modal}>
          {/* Modal Başlık */}
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Yeni Şablon</Text>
            <TouchableOpacity onPress={closeModal}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.modalScroll} keyboardShouldPersistTaps="handled">
            {/* Antrenman Adı */}
            <Text style={s.fieldLabel}>Antrenman Adı</Text>
            <TextInput
              style={s.fieldInput}
              placeholder="Örn: Üst Vücut Günü"
              placeholderTextColor={colors.textMuted}
              value={workoutName}
              onChangeText={setWorkoutName}
            />

            {/* Süre */}
            <Text style={s.fieldLabel}>Tahmini Süre (dakika)</Text>
            <TextInput
              style={[s.fieldInput, { width: 100 }]}
              placeholder="45"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={durationMinutes}
              onChangeText={setDurationMinutes}
            />

            {/* Egzersizler */}
            <View style={s.exHeader}>
              <Text style={s.fieldLabel}>Egzersizler</Text>
              <TouchableOpacity onPress={addExercise} style={[s.addExBtn, { borderColor: colors.workoutColor }]}>
                <Ionicons name="add" size={14} color={colors.workoutColor} />
                <Text style={[s.addExText, { color: colors.workoutColor }]}>Egzersiz Ekle</Text>
              </TouchableOpacity>
            </View>

            {exercises.map((ex, i) => (
              <ExerciseFormRow
                key={ex.key}
                item={ex}
                index={i}
                colors={colors}
                onUpdate={updateExercise}
                onRemove={removeExercise}
              />
            ))}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Kaydet Butonu */}
          <View style={s.modalFooter}>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: colors.workoutColor }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size={18} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFF" />
                  <Text style={s.saveBtnText}>Şablonu Kaydet</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 24, borderBottomWidth: 1, borderColor: colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalScroll: { flex: 1, padding: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 16 },
  fieldInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: colors.text,
    backgroundColor: colors.cardBackground,
  },
  exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  addExBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  addExText: { fontSize: 12, fontWeight: '600' },
  modalFooter: { padding: 20, borderTopWidth: 1, borderColor: colors.border },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, paddingVertical: 14,
  },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
