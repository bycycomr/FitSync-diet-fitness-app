import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Exercise } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  checked: boolean;
  onToggle: () => void;
}

export function ExerciseRow({
  exercise,
  index,
  checked,
  onToggle,
}: ExerciseRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onToggle();
  }, [onToggle, scaleAnim]);

  const subtitle: string[] = [];
  if (exercise.sets && exercise.reps)
    subtitle.push(`${exercise.sets} set × ${exercise.reps} tekrar`);
  else if (exercise.sets) subtitle.push(`${exercise.sets} set`);
  if (exercise.durationSeconds)
    subtitle.push(`${exercise.durationSeconds}sn`);
  if (exercise.restSeconds) subtitle.push(`Dinlenme: ${exercise.restSeconds}sn`);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.row, checked && styles.rowDone]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {/* Sıra numarası */}
        <View
          style={[
            styles.numBox,
            checked && { backgroundColor: colors.primary },
          ]}
        >
          {checked ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : (
            <Text style={styles.numText}>{index + 1}</Text>
          )}
        </View>

        {/* İçerik */}
        <View style={styles.content}>
          <Text
            style={[
              styles.name,
              checked && {
                color: colors.textSecondary,
                textDecorationLine: 'line-through',
              },
            ]}
          >
            {exercise.name}
          </Text>
          {subtitle.length > 0 && (
            <Text style={styles.sub}>{subtitle.join(' · ')}</Text>
          )}
          {exercise.notes && (
            <Text style={styles.notes}>{exercise.notes}</Text>
          )}
        </View>

        {/* Dinlenme rozeti */}
        {exercise.restSeconds != null && (
          <View
            style={[
              styles.restBadge,
              { backgroundColor: colors.carbColor + '1A' },
            ]}
          >
            <Ionicons name="timer-outline" size={10} color={colors.carbColor} />
            <Text style={[styles.restText, { color: colors.carbColor }]}>
              {exercise.restSeconds}"
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowDone: {
      opacity: 0.6,
    },
    numBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    sub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    notes: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: 2,
    },
    restBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 2,
    },
    restText: {
      fontSize: 10,
      fontWeight: '700',
    },
  });
