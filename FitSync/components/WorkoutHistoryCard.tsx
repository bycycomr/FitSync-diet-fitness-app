/**
 * WorkoutHistoryCard.tsx — Faz 9 Görev 33
 *
 * Tamamlanan antrenmanları timeline'da gösterir
 * - Antrenman tarihi, adı, süresi
 * - Egzersiz sayısı ve detayları
 * - Personal Record'lar ile highlight
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import type { WorkoutHistory, PersonalRecord } from '@/types';

interface WorkoutHistoryCardProps {
  history: WorkoutHistory[];
  personalRecords: PersonalRecord[];
}

/**
 * Timeline item bileşeni — tek bir antrenman kaydını gösterir
 */
function TimelineItem({
  item,
  personalRecords,
  colors,
  isFirst,
  isLast,
}: {
  item: WorkoutHistory;
  personalRecords: PersonalRecord[];
  colors: ThemeColors;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const styles = getTimelineItemStyles(colors);

  // Egzersiz detaylarını format et (PR'ları highlight et)
  const exerciseList = item.exercises.map((ex) => {
    const isPR = personalRecords.some(
      (pr) => pr.exerciseName === ex.name && pr.maxSetsReps === `${ex.sets}×${ex.reps}`
    );
    return { ...ex, isPR };
  });

  // Tarihi format et: "Bugün, 14:30" veya "Salı, 10:45"
  const workoutDate = new Date(item.date + 'T00:00:00');
  const today = new Date();
  const isToday = workoutDate.toDateString() === today.toDateString();
  const dateStr = isToday
    ? 'Bugün'
    : workoutDate.toLocaleDateString('tr-TR', { weekday: 'short' });

  return (
    <View style={styles.timelineItemContainer as any}>
      {/* Timeline çizgisi */}
      {!isLast && <View style={[styles.timelineLine as any, { backgroundColor: colors.primary }]} />}

      {/* Nokta + Kart */}
      <View style={styles.timelineContent as any}>
        {/* Timeline noktası */}
        <View style={[styles.timelineDot as any, { backgroundColor: colors.primary }]} />

        {/* Antrenman kartı */}
        <TouchableOpacity
          style={[styles.card as any, { backgroundColor: colors.cardBackground }]}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          {/* Başlık satırı */}
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={styles.workoutName}>{item.workoutName}</Text>
              <Text style={[styles.date, { color: colors.textSecondary }]}>
                {dateStr}
              </Text>
            </View>

            {/* Süre ve egzersiz sayısı */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="timer" size={14} color={colors.primary} />
                <Text style={[styles.statText, { color: colors.text }]}>
                  {item.durationMinutes}m
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="barbell" size={14} color={colors.workoutColor} />
                <Text style={[styles.statText, { color: colors.text }]}>
                  {item.exerciseCount}
                </Text>
              </View>
            </View>
          </View>

          {/* Expandable egzersiz listesi */}
          {expanded && (
            <View style={styles.exerciseList as any}>
              {exerciseList.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Egzersiz detayı kaydedilmedi
                </Text>
              ) : (
                exerciseList.map((ex, idx) => (
                  <View key={idx} style={styles.exerciseItem as any}>
                    {/* PR badge'i */}
                    {ex.isPR && (
                      <View style={[styles.prBadge as any, { backgroundColor: colors.tertiary + '20' }]}>
                        <Ionicons name="trophy" size={11} color={colors.tertiary} />
                        <Text style={[styles.prBadgeText, { color: colors.tertiary }]}>
                          PR
                        </Text>
                      </View>
                    )}

                    {/* Egzersiz adı */}
                    <Text style={[styles.exerciseName, { color: colors.text }]}>
                      {ex.name}
                    </Text>

                    {/* Set × Rep bilgisi */}
                    {ex.sets && ex.reps ? (
                      <Text style={[styles.setsReps, { color: colors.textSecondary }]}>
                        {ex.sets}×{ex.reps}
                      </Text>
                    ) : ex.durationSeconds ? (
                      <Text style={[styles.setsReps, { color: colors.textSecondary }]}>
                        {Math.floor(ex.durationSeconds / 60)}m{ex.durationSeconds % 60}s
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>
          )}

          {/* Expand butonu */}
          {item.exerciseCount > 0 && (
            <View style={styles.expandBtn as any}>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.primary}
              />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getTimelineItemStyles = (colors: ThemeColors) => ({
    timelineItemContainer: {
      position: 'relative' as const,
      marginBottom: 16,
    } as any,
    timelineLine: {
      position: 'absolute' as const,
      left: 24,
      top: 48,
      width: 2,
      height: 200,
    } as any,
    timelineContent: {
      flexDirection: 'row' as const,
      gap: 12,
    } as any,
    timelineDot: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      opacity: 0.7,
    } as any,
    card: {
      flex: 1,
      borderRadius: 16,
      padding: 12,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    } as any,
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 8,
    } as any,
    titleBlock: {
      flex: 1,
      marginRight: 8,
    } as any,
    workoutName: {
      fontSize: 14,
      fontWeight: '700' as const,
      marginBottom: 3,
    } as any,
    date: {
      fontSize: 11,
    } as any,
    stats: {
      flexDirection: 'row' as const,
      gap: 8,
    } as any,
    stat: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 3,
    } as any,
    statText: {
      fontSize: 11,
      fontWeight: '600' as const,
    } as any,
    exerciseList: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    } as any,
    exerciseItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      marginBottom: 6,
      paddingVertical: 4,
    } as any,
    exerciseName: {
      flex: 1,
      fontSize: 12,
      fontWeight: '500' as const,
    } as any,
    setsReps: {
      fontSize: 11,
      fontWeight: '600' as const,
    } as any,
    emptyText: {
      fontSize: 12,
      textAlign: 'center' as const,
      paddingVertical: 8,
    } as any,
    prBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    } as any,
    prBadgeText: {
      fontSize: 10,
      fontWeight: '700' as const,
    } as any,
    expandBtn: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 4,
    } as any,
  });

/**
 * Ana bileşen — Antrenman geçmişi timeline'ı
 */
export function WorkoutHistoryCard({
  history,
  personalRecords,
}: WorkoutHistoryCardProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  if (history.length === 0) {
    return (
      <View style={[styles.container as any, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.emptyStateContainer as any}>
          <Ionicons name="barbell" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            Henüz Antrenman Kaydı Yok
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            Antrenmanları tamamladıkça burada timeline olarak gösterilecek
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container as any}>
      <Text style={[styles.title as any, { color: colors.text }]}>📜 Antrenman Geçmişi</Text>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <TimelineItem
            item={item}
            personalRecords={personalRecords}
            colors={colors}
            isFirst={index === 0}
            isLast={index === history.length - 1}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
      />

      {personalRecords.length > 0 && (
        <View style={[styles.prSection as any, { backgroundColor: colors.tertiary + '10' }]}>
          <View style={styles.prHeader as any}>
            <Ionicons name="trophy" size={16} color={colors.tertiary} />
            <Text style={[styles.prTitle, { color: colors.tertiary }]}>
              Personal Records ({personalRecords.length})
            </Text>
          </View>
          <View style={styles.prGrid as any}>
            {personalRecords.map((pr, idx) => (
              <View key={idx} style={styles.prCard as any}>
                <Text style={[styles.prExerciseName, { color: colors.text }]}>
                  {pr.exerciseName}
                </Text>
                <Text style={[styles.prValue, { color: colors.tertiary }]}>
                  {pr.maxSetsReps}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => ({
    container: {
      marginBottom: 24,
    } as any,
    title: {
      fontSize: 16,
      fontWeight: '700' as const,
      marginBottom: 12,
    } as any,
    emptyStateContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as any,
    emptyStateTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      marginTop: 12,
      marginBottom: 6,
    } as any,
    emptyStateSubtitle: {
      fontSize: 12,
      textAlign: 'center' as const,
      lineHeight: 18,
    } as any,
    prSection: {
      borderRadius: 16,
      padding: 16,
      marginTop: 12,
    } as any,
    prHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      marginBottom: 12,
    } as any,
    prTitle: {
      fontSize: 13,
      fontWeight: '700' as const,
    } as any,
    prGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    } as any,
    prCard: {
      flex: 1,
      minWidth: '45%' as any,
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center' as const,
    } as any,
    prExerciseName: {
      fontSize: 11,
      fontWeight: '600' as const,
      marginBottom: 4,
    } as any,
    prValue: {
      fontSize: 14,
      fontWeight: '700' as const,
    } as any,
  });
