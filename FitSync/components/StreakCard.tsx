import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { useUserStore } from '@/store/userStore';
import type { Achievement, StreakData } from '@/types';

export function StreakCard() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const streak = useUserStore((s) => s.streak);
  const achievements = useUserStore((s) => s.achievements);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    setUnlockedCount(achievements.length);
  }, [achievements]);

  return (
    <View style={styles.container}>
      {/* Streak Section */}
      <View style={styles.streakBox}>
        <Text style={styles.streakLabel}>Aktiflik Serisi</Text>
        <View style={styles.streakValue}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={styles.streakNumber}>{streak.streakCount}</Text>
        </View>
        <Text style={styles.streakSubtext}>
          {streak.streakCount > 0 ? `${streak.streakCount} gün arka arka` : 'Henüz başla'}
        </Text>
        {streak.longestStreak > 0 && (
          <Text style={styles.recordText}>Rekor: {streak.longestStreak} gün</Text>
        )}
      </View>

      {/* Achievements Section */}
      <View style={styles.achievementsBox}>
        <View style={styles.achievementsHeader}>
          <Text style={styles.achievementsLabel}>Başarılar</Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '1A' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {unlockedCount}/4
            </Text>
          </View>
        </View>

        <View style={styles.achievementsList}>
          {achievements.length === 0 ? (
            <Text style={styles.emptyText}>
              Hedefine ulaş ve başarı rozetlerini aç! 🎯
            </Text>
          ) : (
            achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <Text style={styles.achievementEmoji}>{achievement.emoji}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: 16,
      marginBottom: 20,
    },
    streakBox: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 18,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary + '33',
      shadowColor: colors.primary,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
      elevation: 2,
    },
    streakLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 8,
    },
    streakValue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    fireEmoji: {
      fontSize: 32,
    },
    streakNumber: {
      fontSize: 36,
      fontWeight: '800',
      color: colors.primary,
    },
    streakSubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    recordText: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
    },

    achievementsBox: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 18,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 10,
      elevation: 3,
    },
    achievementsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    achievementsLabel: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },

    achievementsList: {
      gap: 10,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 16,
      fontStyle: 'italic',
    },
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 12,
      gap: 12,
    },
    achievementEmoji: {
      fontSize: 24,
    },
    achievementInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    achievementName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    achievementDesc: {
      fontSize: 11,
      color: colors.textSecondary,
    },
  });
