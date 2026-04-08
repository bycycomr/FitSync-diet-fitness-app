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
  isLast,
}: {
  item: WorkoutHistory;
  personalRecords: PersonalRecord[];
  colors: ThemeColors;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Egzersiz detaylarını format et (PR'ları highlight et)
  const exerciseList = item.exercises.map((ex) => {
    const isPR = personalRecords.some(
      (pr) => pr.exerciseName === ex.name && pr.maxSetsReps === `${ex.sets}×${ex.reps}`
    );
    return { ...ex, isPR };
  });

  // Tarihi format et: "Bugün" veya "Sal"
  const workoutDate = new Date(item.date + 'T00:00:00');
  const today = new Date();
  const isToday = workoutDate.toDateString() === today.toDateString();
  const dateStr = isToday
    ? 'Bugün'
    : workoutDate.toLocaleDateString('tr-TR', { weekday: 'short' });

  return (
    <View style={styles.timelineItemContainer}>
      {/* Timeline çizgisi */}
      {!isLast && (
        <View style={[styles.timelineLine, { backgroundColor: colors.primary }]} />
      )}

      {/* Nokta + Kart */}
      <View style={styles.timelineContent}>
        {/* Timeline noktası */}
        <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />

        {/* Antrenman kartı */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.cardBackground }]}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          {/* Başlık satırı */}
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <Text style={[styles.workoutName, { color: colors.text }]}>
                {item.workoutName}
              </Text>
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
            <View style={[styles.exerciseList, { borderTopColor: colors.border }]}>
              {exerciseList.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Egzersiz detayı kaydedilmedi
                </Text>
              ) : (
                exerciseList.map((ex, idx) => (
                  <View key={idx} style={styles.exerciseItem}>
                    {/* PR badge'i */}
                    {ex.isPR && (
                      <View
                        style={[
                          styles.prBadge,
                          { backgroundColor: colors.tertiary + '20' },
                        ]}
                      >
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
            <View style={styles.expandBtn}>
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

/**
 * Ana bileşen — Antrenman geçmişi timeline'ı
 */
export function WorkoutHistoryCard({
  history,
  personalRecords,
}: WorkoutHistoryCardProps) {
  const { colors } = useTheme();

  if (history.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.cardBackground }]}>
        <Ionicons name="barbell" size={40} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Henüz Antrenman Kaydı Yok
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Antrenmanları tamamladıkça burada timeline olarak gösterilecek
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>📜 Antrenman Geçmişi</Text>

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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {personalRecords.length > 0 && (
        <View
          style={[styles.prSection, { backgroundColor: colors.tertiary + '10' }]}
        >
          <View style={styles.prHeader}>
            <Ionicons name="trophy" size={16} color={colors.tertiary} />
            <Text style={[styles.prTitle, { color: colors.tertiary }]}>
              Personal Records ({personalRecords.length})
            </Text>
          </View>
          <View style={styles.prGrid}>
            {personalRecords.map((pr, idx) => (
              <View
                key={idx}
                style={[styles.prCard, { backgroundColor: colors.cardBackground }]}
              >
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

const styles = StyleSheet.create({
  // ── Container ─────────────────────────────────────────────────────────────
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  separator: {
    height: 4,
  },

  // ── Boş durum ─────────────────────────────────────────────────────────────
  emptyContainer: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Timeline ──────────────────────────────────────────────────────────────
  timelineItemContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 48,
    width: 2,
    bottom: -16,
  },
  timelineContent: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },

  // ── Kart ──────────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  workoutName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  date: {
    fontSize: 11,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Egzersiz listesi ──────────────────────────────────────────────────────
  exerciseList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingVertical: 4,
  },
  exerciseName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  setsReps: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  expandBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  // ── Personal Records ──────────────────────────────────────────────────────
  prSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  prTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  prExerciseName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  prValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
