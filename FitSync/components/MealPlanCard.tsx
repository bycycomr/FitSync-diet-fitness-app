/**
 * MealPlanCard.tsx
 *
 * Gemini'den parse edilen MealPlan verisini etkileşimli öğün kartları
 * olarak görselleştirir. Her öğün genişletilebilir; kalori ve makro
 * dağılımı progress bar'larla gösterilir.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import type { MealPlan } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MealRow } from './meal/MealRow';

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function MealPlanCard({ plan, onMealComplete }: { plan: MealPlan; onMealComplete?: (mealName: string) => void }) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const totalCals = plan.totalCalories;
  const completedCount = 0;
  const pct = Math.round((completedCount / plan.meals.length) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Beslenme Planı</Text>
        <View style={[styles.badge, { backgroundColor: colors.primary + '1A' }]}>
          <Text style={[styles.badgeText, { color: colors.primary }]}>{pct}% Tamamlandı</Text>
        </View>
      </View>

      <View style={styles.totalsRow}>
        <Text style={styles.totalText}>{plan.meals.length} Öğün</Text>
        <Text style={styles.totalText}>•</Text>
        <Text style={styles.totalText}>{totalCals} kcal</Text>
      </View>

      <View style={styles.progressBox}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Günlük İlerleme</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{pct}%</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>

      <View style={styles.list}>
        {plan.meals.map((meal, i) => (
          <MealRow
            key={i}
            meal={meal}
            totalCals={totalCals}
            onComplete={() => onMealComplete?.(meal.name)}
          />
        ))}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.text },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  totalsRow: { flexDirection: 'row', gap: 14, marginBottom: 14, marginTop: 4 },
  totalText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  progressBox: { marginBottom: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  progressPct: { fontSize: 12, fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: colors.skeletonBg, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  list: { marginTop: 4 },
  footer: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notesTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  notesBody: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
});
