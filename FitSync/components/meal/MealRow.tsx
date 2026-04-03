import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Meal } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MacroBar } from './MacroBar';

interface MealRowProps {
  meal: Meal;
  totalCals: number;
  onComplete?: () => void;
}

export function MealRow({ meal, totalCals, onComplete }: MealRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);
  const pct = totalCals > 0 ? Math.round((meal.calories / totalCals) * 100) : 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((p) => !p)}
        activeOpacity={0.75}
      >
        <View style={styles.left}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View>
            <Text
              style={[
                styles.name,
                done && {
                  textDecorationLine: 'line-through',
                  color: colors.textSecondary,
                },
              ]}
            >
              {meal.name}
            </Text>
            <Text style={styles.kcal}>
              {meal.calories} kcal · {pct}%
            </Text>
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
          style={[styles.checkBtn, done && { backgroundColor: colors.primary }]}
        >
          <Ionicons
            name={done ? 'checkmark' : 'checkmark-circle-outline'}
            size={20}
            color={done ? colors.white : colors.border}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.body}>
          {meal.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemAmount}>{item.amount}</Text>
            </View>
          ))}
          <View style={styles.macros}>
            <MacroBar
              label="P"
              value={meal.protein}
              total={meal.protein + meal.carbs + meal.fat}
              color={colors.proteinColor}
            />
            <MacroBar
              label="K"
              value={meal.carbs}
              total={meal.protein + meal.carbs + meal.fat}
              color={colors.carbColor}
            />
            <MacroBar
              label="Y"
              value={meal.fat}
              total={meal.protein + meal.carbs + meal.fat}
              color={colors.fatColor}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    name: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    kcal: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    checkBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.border,
    },
    body: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemName: {
      fontSize: 12,
      color: colors.textMuted,
      flex: 1,
    },
    itemAmount: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 16,
    },
    macros: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
