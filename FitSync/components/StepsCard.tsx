import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { getTodaySteps, subscribeToSteps, type HealthData } from '@/services/healthKitService';

// ─── Dairesel İlerleme Halkası ────────────────────────────────────────────────

const RING_SIZE = 100;
const RING_STROKE = 10;

function StepRing({ progress, color, bgColor, children }: {
  progress: number;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const half = RING_SIZE / 2;
  const leftDeg  = `${Math.min(clamped * 360, 180)}deg`;
  const rightDeg = `${Math.max((clamped - 0.5) * 360, 0)}deg`;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        position: 'absolute', width: RING_SIZE, height: RING_SIZE,
        borderRadius: half, borderWidth: RING_STROKE, borderColor: bgColor,
      }} />
      <View style={{ position: 'absolute', left: 0, width: half, height: RING_SIZE, overflow: 'hidden' }}>
        <View style={{
          width: half, height: RING_SIZE,
          borderTopLeftRadius: half, borderBottomLeftRadius: half,
          backgroundColor: color,
          // @ts-ignore
          transformOrigin: 'right center',
          transform: [{ rotate: leftDeg }],
        }} />
      </View>
      <View style={{ position: 'absolute', right: 0, width: half, height: RING_SIZE, overflow: 'hidden' }}>
        <View style={{
          width: half, height: RING_SIZE,
          borderTopRightRadius: half, borderBottomRightRadius: half,
          backgroundColor: color,
          // @ts-ignore
          transformOrigin: 'left center',
          transform: [{ rotate: rightDeg }],
        }} />
      </View>
      <View style={{
        position: 'absolute',
        width: RING_SIZE - RING_STROKE * 2, height: RING_SIZE - RING_STROKE * 2,
        borderRadius: (RING_SIZE - RING_STROKE * 2) / 2,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </View>
    </View>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function StepsCard() {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [health, setHealth] = useState<HealthData>({
    steps: 0, activeCalories: 0, stepGoal: 10000, isAvailable: false,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const data = await getTodaySteps();
    setHealth(data);
    setLoading(false);
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  };

  useEffect(() => {
    load();
    // Gerçek zamanlı adım güncellemesi
    const unsubscribe = subscribeToSteps((liveSteps) => {
      setHealth((prev) => ({
        ...prev,
        steps: prev.steps + liveSteps,
        activeCalories: Math.round((prev.steps + liveSteps) * 0.04),
      }));
    });
    return unsubscribe;
  }, []);

  const progress = health.stepGoal > 0 ? health.steps / health.stepGoal : 0;
  const pct = Math.min(Math.round(progress * 100), 100);
  const ringColor = pct >= 100 ? colors.primary : pct >= 50 ? colors.workoutColor : colors.tertiary;

  if (!health.isAvailable && !loading) {
    return (
      <Animated.View style={[s.card, { opacity: fadeAnim }]}>
        <View style={s.header}>
          <View style={[s.iconBox, { backgroundColor: colors.tertiary + '1A' }]}>
            <Ionicons name="walk" size={18} color={colors.tertiary} />
          </View>
          <Text style={s.title}>Adım Sayacı</Text>
        </View>
        <View style={s.unavailableBox}>
          <Ionicons name="phone-portrait-outline" size={28} color={colors.textMuted} />
          <Text style={s.unavailableText}>Bu cihazda adım sayacı mevcut değil</Text>
          <Text style={s.unavailableHint}>Fiziksel cihazda ve hareket izniyle çalışır</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[s.card, { opacity: fadeAnim }]}>
      {/* Başlık */}
      <View style={s.header}>
        <View style={[s.iconBox, { backgroundColor: colors.tertiary + '1A' }]}>
          <Ionicons name="walk" size={18} color={colors.tertiary} />
        </View>
        <Text style={s.title}>Günlük Adımlar</Text>
        <TouchableOpacity onPress={load} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      <View style={s.body}>
        {/* Halka */}
        <StepRing progress={progress} color={ringColor} bgColor={colors.skeletonBg}>
          <Text style={[s.ringMain, { color: ringColor }]}>
            {loading ? '…' : health.steps.toLocaleString('tr-TR')}
          </Text>
          <Text style={s.ringSub}>adım</Text>
        </StepRing>

        {/* İstatistikler */}
        <View style={s.statsCol}>
          <View style={s.statRow}>
            <Ionicons name="flag-outline" size={13} color={colors.textMuted} />
            <Text style={s.statLabel}>Hedef</Text>
            <Text style={s.statVal}>{health.stepGoal.toLocaleString('tr-TR')}</Text>
          </View>
          <View style={s.statRow}>
            <Ionicons name="flame-outline" size={13} color={colors.tertiary} />
            <Text style={s.statLabel}>Yakılan</Text>
            <Text style={[s.statVal, { color: colors.tertiary }]}>
              {loading ? '—' : `${health.activeCalories} kcal`}
            </Text>
          </View>
          <View style={s.statRow}>
            <Ionicons name="trending-up-outline" size={13} color={ringColor} />
            <Text style={s.statLabel}>İlerleme</Text>
            <Text style={[s.statVal, { color: ringColor }]}>{loading ? '—' : `%${pct}`}</Text>
          </View>
          {pct >= 100 && (
            <Text style={[s.congrats, { color: colors.primary }]}>
              Hedefine ulaştın! 🎉
            </Text>
          )}
        </View>
      </View>

      {/* Alt bar */}
      <View style={s.barBg}>
        <View style={[s.barFill, { width: `${pct}%` as unknown as number, backgroundColor: ringColor }]} />
      </View>
      <View style={s.barLabels}>
        <Text style={s.barLabel}>0</Text>
        <Text style={s.barLabel}>{health.stepGoal.toLocaleString('tr-TR')}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  ringMain: { fontSize: 16, fontWeight: '800' },
  ringSub: { fontSize: 10, color: colors.textMuted, fontWeight: '500' },
  statsCol: { flex: 1, gap: 8 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { flex: 1, fontSize: 12, color: colors.textSecondary },
  statVal: { fontSize: 12, fontWeight: '700', color: colors.text },
  congrats: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  barBg: {
    height: 6, borderRadius: 3,
    backgroundColor: colors.skeletonBg,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -6,
  },
  barLabel: { fontSize: 9, color: colors.textMuted },
  unavailableBox: {
    alignItems: 'center', paddingVertical: 12, gap: 6,
  },
  unavailableText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  unavailableHint: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
});
