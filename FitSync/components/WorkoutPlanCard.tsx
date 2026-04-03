/**
 * WorkoutPlanCard.tsx
 *
 * Gemini'den parse edilen WorkoutPlan verisini etkileşimli
 * antrenman listesi olarak görselleştirir. Her egzersiz
 * tamamlandığında checkbox + üstü çizili efekti uygulanır.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import type { WorkoutPlan } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { ExerciseRow } from './workout/ExerciseRow';

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function WorkoutPlanCard({ plan, onExerciseComplete }: { plan: WorkoutPlan; onExerciseComplete?: (exerciseName: string) => void }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(plan.exercises.length).fill(false),
  );

  const toggleAt = useCallback((i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      if (next[i]) onExerciseComplete?.(plan.exercises[i].name);
      return next;
    });
  }, [onExerciseComplete, plan.exercises]);

  const completedCount = checked.filter(Boolean).length;
  const total = plan.exercises.length;
  const progress = total > 0 ? completedCount / total : 0;

  return (
    <View style={styles.card}>
      {/* Başlık */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{plan.name}</Text>
        <View style={[styles.levelBadge, { backgroundColor: colors.workoutColor + '1A' }]}>
          <Text style={[styles.levelText, { color: colors.workoutColor }]}>{plan.durationMinutes} dk</Text>
        </View>
      </View>

      {/* İlerleme Barı */}
      <View style={styles.progressBox}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>İlerleme</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as `${number}%`, backgroundColor: colors.primary }]} />
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
            />
          ))
        )}
      </View>
    </View>
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
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  statsRow: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

  progressBox: { marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  progressPct: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: colors.skeletonBg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  list: {},
  footerRow: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: { fontSize: 11, color: colors.textMuted },

  congratsCard: {
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  congratsTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  congratsSub: { fontSize: 12, color: colors.textSecondary },
});
