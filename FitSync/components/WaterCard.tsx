/**
 * components/WaterCard.tsx
 *
 * Su içme takibi kartı — günlük bardak sayacı ve haftalık grafik
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { addWaterIntake, removeLastWaterIntake, fetchTodayWaterIntake, fetchWeeklyWaterIntake } from '@/services/userService';

const GLASS_ICON_SIZE = 24;
const GLASS_SPACING = 12;

const getGlassStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    glassButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
  });

interface GlassItemProps {
  index: number;
  isFilled: boolean;
  onPress: (isFilled: boolean) => void;
}

function GlassItem({ index, isFilled, onPress }: GlassItemProps) {
  const { colors } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
    onPress(isFilled);
  };

  const styles_themed = getGlassStyles(colors);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles_themed.glassButton,
          {
            backgroundColor: isFilled ? colors.primary : colors.inputBg,
            borderColor: colors.border,
          },
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFilled ? 'water' : 'water-outline'}
          size={GLASS_ICON_SIZE}
          color={isFilled ? colors.surface : colors.textMuted}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface WeeklyWaterBarProps {
  day: string;
  glasses: number;
  maxGlasses: number;
  isToday: boolean;
}

const getWeeklyBarStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    weeklyBarContainer: {
      alignItems: 'center',
      width: '14%',
    },
    weeklyBarBackground: {
      width: 32,
      height: 80,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 8,
    },
    weeklyBarFill: {
      width: '100%',
    },
    weeklyBarLabel: {
      fontSize: 11,
      fontWeight: '500',
      marginBottom: 4,
    },
    weeklyBarValue: {
      fontSize: 10,
      marginBottom: 4,
    },
    weeklyBarDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 4,
    },
  });

function WeeklyWaterBar({ day, glasses, maxGlasses, isToday }: WeeklyWaterBarProps) {
  const { colors } = useTheme();
  const styles = getWeeklyBarStyles(colors);
  const heightAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: (glasses / maxGlasses) * 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [glasses, maxGlasses]);

  const barHeight = heightAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.weeklyBarContainer}>
      <View
        style={[
          styles.weeklyBarBackground,
          { backgroundColor: colors.inputBg },
        ]}
      >
        <Animated.View
          style={[
            styles.weeklyBarFill,
            { backgroundColor: colors.primary, height: barHeight },
          ]}
        />
      </View>
      <Text style={[styles.weeklyBarLabel, { color: colors.text }]}>{day}</Text>
      <Text style={[styles.weeklyBarValue, { color: colors.textMuted }]}>
        {glasses}
      </Text>
      {isToday && (
        <View
          style={[
            styles.weeklyBarDot,
            { backgroundColor: colors.primary },
          ]}
        />
      )}
    </View>
  );
}

interface WaterCardProps {
  uid: string;
}

export function WaterCard({ uid }: WaterCardProps) {
  const { colors } = useTheme();
  const styles_themed = getStyles(colors);

  const [waterStats, setWaterStats] = useState({ todayGlasses: 0, dailyGoal: 8 });
  const [weeklyData, setWeeklyData] = useState<Array<{ date: string; day: string; glasses: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Unmount sonrası state güncellemesini önler
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadWaterData = useCallback(async () => {
    try {
      setLoading(true);
      const stats = await fetchTodayWaterIntake(uid);
      const weekly = await fetchWeeklyWaterIntake(uid);
      if (!mountedRef.current) return;
      setWaterStats(stats);
      setWeeklyData(weekly);
    } catch (err) {
      console.error('Su veri yükleme hatası:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadWaterData();
  }, [loadWaterData]);

  const handleAddWater = useCallback(async () => {
    try {
      setAdding(true);
      await addWaterIntake(uid);
      const stats = await fetchTodayWaterIntake(uid);
      if (!mountedRef.current) return;
      setWaterStats(stats);
    } catch (err) {
      console.error('Su ekleme hatası:', err);
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  }, [uid]);

  const handleRemoveWater = useCallback(async () => {
    try {
      setAdding(true);
      await removeLastWaterIntake(uid);
      const stats = await fetchTodayWaterIntake(uid);
      if (!mountedRef.current) return;
      setWaterStats(stats);
    } catch (err) {
      console.error('Su silme hatası:', err);
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  }, [uid]);

  const handleGlassPress = useCallback((isFilled: boolean) => {
    if (isFilled) {
      handleRemoveWater();
    } else {
      handleAddWater();
    }
  }, [handleAddWater, handleRemoveWater]);

  const progressPercent = Math.min((waterStats.todayGlasses / waterStats.dailyGoal) * 100, 100);

  return (
    <View style={[styles_themed.container, { backgroundColor: colors.cardBackground }]}>
      {/* Başlık */}
      <View style={styles_themed.header}>
        <View style={styles_themed.headerLeft}>
          <Ionicons name="water" size={24} color={colors.primary} />
          <Text style={[styles_themed.title, { color: colors.text }]}>
            Su İçme Takibi
          </Text>
        </View>
        <Text style={[styles_themed.goalText, { color: colors.textMuted }]}>
          {waterStats.dailyGoal} bardak hedef
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles_themed.loader} />
      ) : (
        <>
          {/* Günlük Bardak Sayacı */}
          <View style={styles_themed.dailySection}>
            <View style={styles_themed.dailyLeft}>
              <Text style={[styles_themed.dailyCount, { color: colors.primary }]}>
                {waterStats.todayGlasses}
              </Text>
              <Text style={[styles_themed.dailyLabel, { color: colors.textMuted }]}>
                bardak
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={[styles_themed.progressBar, { backgroundColor: colors.inputBg }]}>
              <View
                style={[
                  styles_themed.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${progressPercent}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Bardak Butonları Izgarası (8 bardak) */}
          <View style={styles_themed.glassesGrid}>
            {Array.from({ length: waterStats.dailyGoal }).map((_, i) => (
              <GlassItem
                key={i}
                index={i}
                isFilled={i < waterStats.todayGlasses}
                onPress={handleGlassPress}
              />
            ))}
          </View>

          {/* Bardak Ekleme Butonu */}
          <TouchableOpacity
            style={[
              styles_themed.addButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleAddWater}
            disabled={adding}
            activeOpacity={0.8}
          >
            {adding ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Ionicons name="add" size={20} color={colors.surface} />
                <Text style={[styles_themed.addButtonText, { color: colors.surface }]}>
                  Bardak Ekle
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Haftalık Grafik */}
          <View style={styles_themed.weeklySection}>
            <Text style={[styles_themed.weeklyTitle, { color: colors.text }]}>
              Bu Haftanın Su İçme
            </Text>
            <View style={styles_themed.weeklyBars}>
              {weeklyData.map((day, idx) => {
                const today = new Date().toISOString().slice(0, 10);
                return (
                  <WeeklyWaterBar
                    key={idx}
                    day={day.day}
                    glasses={day.glasses}
                    maxGlasses={12}
                    isToday={day.date === today}
                  />
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    goalText: {
      fontSize: 13,
    },
    loader: {
      marginVertical: 24,
    },
    dailySection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
    },
    dailyLeft: {
      alignItems: 'center',
      minWidth: 50,
    },
    dailyCount: {
      fontSize: 36,
      fontWeight: '700',
    },
    dailyLabel: {
      fontSize: 12,
      marginTop: 4,
    },
    progressBar: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    glassesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GLASS_SPACING,
      marginBottom: 20,
      justifyContent: 'center',
    },
    addButton: {
      flexDirection: 'row',
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 24,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    weeklySection: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    weeklyTitle: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 16,
    },
    weeklyBars: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 120,
    },
  });
