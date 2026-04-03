/**
 * MealPlanCard.tsx
 *
 * Gemini'den parse edilen MealPlan verisini etkileşimli öğün kartları
 * olarak görselleştirir. Her öğün genişletilebilir; kalori ve makro
 * dağılımı progress bar'larla gösterilir.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MealPlan, Meal } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

// ─── Makro Progress Bar ───────────────────────────────────────────────────────

function MacroBar({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const { colors: themeColors } = useTheme();
  const macroStyles = getMacroStyles(themeColors);
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <View style={macroStyles.row}>
      <Text style={macroStyles.label}>{label}</Text>
      <View style={macroStyles.barBg}>
        <View style={[macroStyles.barFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[macroStyles.value, { color }]}>{value}g</Text>
    </View>
  );
}

const getMacroStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  label: { fontSize: 11, color: colors.textSecondary, width: 36 },
  barBg: { flex: 1, height: 6, backgroundColor: colors.skeletonBg, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  value: { fontSize: 11, fontWeight: '600', width: 30, textAlign: 'right' },
});

// ─── Tek Öğün Kartı ───────────────────────────────────────────────────────────

function MealRow({ meal, totalCals, onComplete }: { meal: Meal; totalCals: number; onComplete?: () => void }) {
  const { colors } = useTheme();
  const mealStyles = getMealStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);
  const pct = totalCals > 0 ? Math.round((meal.calories / totalCals) * 100) : 0;

  return (
    <View style={mealStyles.card}>
      <TouchableOpacity
        style={mealStyles.header}
        onPress={() => setExpanded(p => !p)}
        activeOpacity={0.75}
      >
        <View style={mealStyles.left}>
          <View style={[mealStyles.dot, { backgroundColor: colors.primary }]} />
          <View>
            <Text style={[mealStyles.name, done && { textDecorationLine: 'line-through', color: colors.textSecondary }]}>{meal.name}</Text>
            <Text style={mealStyles.kcal}>{meal.calories} kcal · {pct}%</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (!done) {
              setDone(true);
              onComplete?.();
            }
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[mealStyles.checkBtn, done && { backgroundColor: colors.primary }]}
        >
          <Ionicons name={done ? 'checkmark' : 'checkmark-circle-outline'} size={20} color={done ? colors.white : colors.border} />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={mealStyles.body}>
          {meal.items.map((item, i) => (
            <View key={i} style={mealStyles.itemRow}>
              <Text style={mealStyles.itemName}>{item.name}</Text>
              <Text style={mealStyles.itemAmount}>{item.amount}</Text>
            </View>
          ))}
          <View style={mealStyles.macros}>
            <MacroBar label="P" value={meal.protein} total={meal.protein + meal.carbs + meal.fat} color={colors.proteinColor} />
            <MacroBar label="K" value={meal.carbs} total={meal.protein + meal.carbs + meal.fat} color={colors.carbColor} />
            <MacroBar label="Y" value={meal.fat} total={meal.protein + meal.carbs + meal.fat} color={colors.fatColor} />
          </View>
        </View>
      )}
    </View>
  );
}

const getMealStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  kcal: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  checkBtnDone: {},
  body: { paddingHorizontal: 12, paddingBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: { fontSize: 12, color: colors.textMuted, flex: 1 },
  itemAmount: { fontSize: 12, fontWeight: '600', color: colors.text, marginLeft: 16 },
  macros: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

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
