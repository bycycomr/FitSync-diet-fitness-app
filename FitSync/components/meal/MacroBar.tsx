import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

interface MacroBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

export function MacroBar({ label, value, total, color }: MacroBarProps) {
  const { colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%` as `${number}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.value, { color }]}>{value}g</Text>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    label: {
      fontSize: 11,
      color: colors.textSecondary,
      width: 36,
    },
    barBg: {
      flex: 1,
      height: 6,
      backgroundColor: colors.skeletonBg,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
    value: {
      fontSize: 11,
      fontWeight: '600',
      width: 30,
      textAlign: 'right',
    },
  });
