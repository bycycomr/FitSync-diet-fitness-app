/**
 * WorkoutPlanCard.tsx
 *
 * Gemini'den parse edilen WorkoutPlan verisini etkileşimli antrenman listesi
 * olarak görselleştirir.
 *
 * Özellikler:
 * - Canlı kronometre (ilk set tamamlandığında başlar)
 * - Set bazlı takip (ExerciseRow'da her set ayrı işaretlenir)
 * - Set sonrası dinlenme sayacı (RestTimer — 60/90/120sn seçilebilir)
 * - Tüm egzersizler bitince animasyonlu özet kartı
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WorkoutPlan } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { ExerciseRow } from './workout/ExerciseRow';
import { RestTimer } from './workout/RestTimer';

// ─── Kronometre ───────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ─── Özet Modal ───────────────────────────────────────────────────────────────

function SummaryModal({
  visible,
  plan,
  elapsedSeconds,
  completedCount,
  onClose,
}: {
  visible: boolean;
  plan: WorkoutPlan;
  elapsedSeconds: number;
  completedCount: number;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const s = getSummaryStyles(colors);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const totalExercises = plan.exercises.length;
  const completionRate = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={s.overlay}>
        <Animated.View style={[s.sheet, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          {/* Başarı ikonu */}
          <View style={s.trophy}>
            <Text style={s.trophyEmoji}>🏆</Text>
          </View>

          <Text style={s.title}>Antrenman Tamamlandı!</Text>
          <Text style={s.subtitle}>{plan.name}</Text>

          {/* İstatistikler */}
          <View style={s.statsGrid}>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: colors.workoutColor }]}>
                {formatElapsed(elapsedSeconds)}
              </Text>
              <Text style={s.statLbl}>Süre</Text>
            </View>
            <View style={[s.statBox, s.statBoxMid]}>
              <Text style={[s.statVal, { color: colors.primary }]}>
                {completedCount}/{totalExercises}
              </Text>
              <Text style={s.statLbl}>Egzersiz</Text>
            </View>
            <View style={s.statBox}>
              <Text style={[s.statVal, { color: colors.tertiary }]}>
                {completionRate}%
              </Text>
              <Text style={s.statLbl}>Tamamlama</Text>
            </View>
          </View>

          {/* Tamamlanan egzersizler */}
          {completedCount > 0 && (
            <View style={s.listBox}>
              {plan.exercises.slice(0, 5).map((ex, i) => (
                <View key={i} style={s.listRow}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                  <Text style={s.listText} numberOfLines={1}>{ex.name}</Text>
                  {ex.sets && ex.reps && (
                    <Text style={s.listSub}>{ex.sets}×{ex.reps}</Text>
                  )}
                </View>
              ))}
              {plan.exercises.length > 5 && (
                <Text style={s.listMore}>+{plan.exercises.length - 5} egzersiz daha</Text>
              )}
            </View>
          )}

          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={s.closeBtnText}>Kapat</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const getSummaryStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: {
    backgroundColor: colors.cardBackground,
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 12,
  },
  trophy: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.workoutColor + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyEmoji: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: -6 },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLbl: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  listBox: { width: '100%', gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listText: { flex: 1, fontSize: 13, color: colors.text },
  listSub: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  listMore: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },
  closeBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.workoutColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  closeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function WorkoutPlanCard({
  plan,
  onExerciseComplete,
}: {
  plan: WorkoutPlan;
  onExerciseComplete?: (exerciseName: string) => void;
}) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Set tamamlanma durumu
  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(plan.exercises.length).fill(false),
  );

  // Kronometre
  const [elapsed, setElapsed]         = useState(0);
  const [chronoRunning, setChronoRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dinlenme zamanlayıcısı
  const [restVisible, setRestVisible]   = useState(false);
  const [restSeconds, setRestSeconds]   = useState(60);

  // Özet modal
  const [summaryVisible, setSummaryVisible] = useState(false);

  // Kronometre başlat/durdur
  useEffect(() => {
    if (chronoRunning) {
      intervalRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [chronoRunning]);

  const completedCount = checked.filter(Boolean).length;
  const total          = plan.exercises.length;
  const progress       = total > 0 ? completedCount / total : 0;
  const allDone        = completedCount === total && total > 0;

  // Set tamamlandı → dinlenme timer'ını başlat + kronometre çalıştır
  const handleSetComplete = useCallback((secs?: number) => {
    if (!chronoRunning) setChronoRunning(true);
    if (secs && secs > 0) {
      setRestSeconds(secs);
      setRestVisible(true);
    }
  }, [chronoRunning]);

  // Egzersiz toggle
  const toggleAt = useCallback((i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      if (next[i]) {
        if (!chronoRunning) setChronoRunning(true);
        onExerciseComplete?.(plan.exercises[i].name);
        // Tüm egzersizler tamamlandı mı?
        const newCompleted = next.filter(Boolean).length;
        if (newCompleted === total) {
          setChronoRunning(false);
          setTimeout(() => setSummaryVisible(true), 400);
        }
      }
      return next;
    });
  }, [chronoRunning, onExerciseComplete, plan.exercises, total]);

  return (
    <>
      <View style={styles.card}>
        {/* Başlık + Kronometre */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{plan.name}</Text>
          <View style={styles.chronoBox}>
            <Ionicons
              name={chronoRunning ? 'timer' : 'timer-outline'}
              size={14}
              color={chronoRunning ? colors.workoutColor : colors.textMuted}
            />
            <Text style={[styles.chronoText, chronoRunning && { color: colors.workoutColor }]}>
              {formatElapsed(elapsed)}
            </Text>
          </View>
        </View>

        {/* Süre rozeti */}
        <View style={styles.metaRow}>
          <View style={[styles.metaBadge, { backgroundColor: colors.workoutColor + '1A' }]}>
            <Ionicons name="time-outline" size={12} color={colors.workoutColor} />
            <Text style={[styles.metaText, { color: colors.workoutColor }]}>{plan.durationMinutes} dk plan</Text>
          </View>
          {allDone && (
            <TouchableOpacity
              style={[styles.metaBadge, { backgroundColor: colors.primary + '1A' }]}
              onPress={() => setSummaryVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy" size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>Özeti Gör</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* İlerleme Barı */}
        <View style={styles.progressBox}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>İlerleme</Text>
            <Text style={[styles.progressPct, { color: allDone ? colors.primary : colors.workoutColor }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[
              styles.progressFill,
              {
                width: `${progress * 100}%` as `${number}%`,
                backgroundColor: allDone ? colors.primary : colors.workoutColor,
              },
            ]} />
          </View>
        </View>

        {/* Egzersiz Listesi */}
        <View style={styles.list}>
          {total === 0 ? (
            <Text style={styles.footerText}>Egzersiz listesi boş.</Text>
          ) : (
            plan.exercises.map((ex, i) => (
              <ExerciseRow
                key={i}
                exercise={ex}
                index={i}
                checked={checked[i]}
                onToggle={() => toggleAt(i)}
                onSetComplete={handleSetComplete}
              />
            ))
          )}
        </View>
      </View>

      {/* Dinlenme Sayacı */}
      <RestTimer
        visible={restVisible}
        initialSeconds={restSeconds}
        onComplete={() => setRestVisible(false)}
        onDismiss={() => setRestVisible(false)}
      />

      {/* Antrenman Özet Modalı */}
      <SummaryModal
        visible={summaryVisible}
        plan={plan}
        elapsedSeconds={elapsed}
        completedCount={completedCount}
        onClose={() => setSummaryVisible(false)}
      />
    </>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  chronoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chronoText: { fontSize: 14, fontWeight: '700', color: colors.textMuted, fontVariant: ['tabular-nums'] },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: { fontSize: 11, fontWeight: '700' },
  progressBox: { marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  progressPct: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: colors.skeletonBg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  list: {},
  footerText: { fontSize: 11, color: colors.textMuted },
});
