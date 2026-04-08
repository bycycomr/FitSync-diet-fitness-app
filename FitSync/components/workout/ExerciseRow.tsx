/**
 * ExerciseRow.tsx
 *
 * Antrenman planındaki tek egzersiz satırı.
 * - Birden fazla set varsa her seti ayrı ayrı işaretlenebilir
 * - Set tamamlandığında opsiyonel olarak dinlenme timer'ı tetikler
 * - Tüm setler bitince egzersiz tamamlanmış sayılır
 */

import React, { useCallback, useState } from 'react';
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

export interface ExerciseRowProps {
  exercise: Exercise;
  index: number;
  checked: boolean;
  onToggle: () => void;
  /** Set tamamlandığında çağrılır; rest saniyesi opsiyonel olarak iletilir */
  onSetComplete?: (restSeconds?: number) => void;
}

export function ExerciseRow({
  exercise,
  index,
  checked,
  onToggle,
  onSetComplete,
}: ExerciseRowProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Set bazlı takip (sets > 1 ise aktif)
  const setCount = exercise.sets ?? 1;
  const [completedSets, setCompletedSets] = useState(0);

  const handlePress = useCallback(() => {
    // Set takibi yoksa (tek set) → doğrudan toggle
    if (setCount <= 1) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
      onToggle();
      return;
    }

    // Set takibi var; ileri/geri toggle
    if (checked) {
      // Tamamlanmış egzersizi geri al
      setCompletedSets(0);
      onToggle();
    }
  }, [checked, setCount, scaleAnim, onToggle]);

  const handleSetTap = useCallback(
    (setIndex: number) => {
      if (checked) return; // egzersiz bitti, kilitle
      const newCount = setIndex + 1;
      const wasCompleted = newCount <= completedSets;

      if (wasCompleted) {
        // Önceden tamamlanmış → geri al
        setCompletedSets(newCount - 1);
        return;
      }

      // Seti tamamla
      setCompletedSets(newCount);
      onSetComplete?.(exercise.restSeconds);

      // Tüm setler bitti → egzersizi tamamla
      if (newCount >= setCount) {
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
        onToggle();
      }
    },
    [checked, completedSets, setCount, scaleAnim, onToggle, onSetComplete, exercise.restSeconds],
  );

  // Alt başlık metni
  const subtitle: string[] = [];
  if (exercise.sets && exercise.reps)
    subtitle.push(`${exercise.sets} set × ${exercise.reps} tekrar`);
  else if (exercise.sets) subtitle.push(`${exercise.sets} set`);
  if (exercise.durationSeconds)
    subtitle.push(`${exercise.durationSeconds}sn`);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.row, checked && styles.rowDone]}
        onPress={setCount <= 1 ? handlePress : undefined}
        activeOpacity={setCount <= 1 ? 0.8 : 1}
      >
        {/* Sıra numarası / tamamlandı ikonu */}
        <View style={[styles.numBox, checked && { backgroundColor: colors.primary }]}>
          {checked ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : (
            <Text style={styles.numText}>{index + 1}</Text>
          )}
        </View>

        {/* İçerik */}
        <View style={styles.content}>
          <Text style={[styles.name, checked && styles.nameDone]}>
            {exercise.name}
          </Text>
          {subtitle.length > 0 && (
            <Text style={styles.sub}>{subtitle.join(' · ')}</Text>
          )}
          {exercise.notes && (
            <Text style={styles.notes}>{exercise.notes}</Text>
          )}

          {/* Set butonları (setCount > 1 ise göster) */}
          {setCount > 1 && !checked && (
            <View style={styles.setRow}>
              {Array.from({ length: setCount }).map((_, si) => {
                const done = si < completedSets;
                return (
                  <TouchableOpacity
                    key={si}
                    style={[styles.setBtn, done && { backgroundColor: colors.workoutColor }]}
                    onPress={() => handleSetTap(si)}
                    activeOpacity={0.75}
                  >
                    {done ? (
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    ) : (
                      <Text style={styles.setBtnText}>{si + 1}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              <Text style={styles.setProgress}>
                {completedSets}/{setCount}
              </Text>
            </View>
          )}
        </View>

        {/* Dinlenme rozeti */}
        {exercise.restSeconds != null && (
          <View style={[styles.restBadge, { backgroundColor: colors.carbColor + '1A' }]}>
            <Ionicons name="timer-outline" size={10} color={colors.carbColor} />
            <Text style={[styles.restText, { color: colors.carbColor }]}>
              {exercise.restSeconds}"
            </Text>
          </View>
        )}

        {/* Geri al butonu (tamamlanmış egzersiz için) */}
        {checked && setCount > 1 && (
          <TouchableOpacity
            onPress={() => { setCompletedSets(0); onToggle(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="refresh" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowDone: { opacity: 0.6 },
    numBox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    numText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    content: { flex: 1 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
    nameDone: { color: colors.textSecondary, textDecorationLine: 'line-through' },
    sub: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
    notes: { fontSize: 11, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },
    setBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.workoutColor + '66',
      alignItems: 'center',
      justifyContent: 'center',
    },
    setBtnText: { fontSize: 11, fontWeight: '700', color: colors.workoutColor },
    setProgress: { fontSize: 11, color: colors.textMuted, marginLeft: 2 },
    restBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: 8,
      gap: 2,
      marginTop: 2,
    },
    restText: { fontSize: 10, fontWeight: '700' },
  });
