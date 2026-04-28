/**
 * RestTimer.tsx
 *
 * Set tamamlandıktan sonra gösterilen animasyonlu dinlenme geri sayım sayacı.
 * - 60 / 90 / 120 saniye seçilebilir ön ayar
 * - Dairesel progress ring (saf RN, SVG yok)
 * - Süre dolunca otomatik kapanır
 * - "Geç" ile erken çıkılabilir
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

// ─── Dairesel Ring ────────────────────────────────────────────────────────────

const RING_SIZE = 140;
const RING_STROKE = 10;

function CircularCountdown({
  progress,   // 0 → 1 (1 = tam dolu / başlangıç)
  color,
  bgColor,
  children,
}: {
  progress: number;
  color: string;
  bgColor: string;
  children: React.ReactNode;
}) {
  const half = RING_SIZE / 2;
  const clampedP = Math.min(Math.max(progress, 0), 1);

  // "rotating halves" tekniği
  // Sol yarım: 0–50% (0–180deg)
  const leftDeg = `${Math.min(clampedP * 360, 180)}deg`;
  // Sağ yarım: 50–100%
  const rightDeg = `${Math.max((clampedP - 0.5) * 360, 0)}deg`;

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Arka plan halkası */}
      <View style={{
        position: 'absolute',
        width: RING_SIZE, height: RING_SIZE,
        borderRadius: half,
        borderWidth: RING_STROKE,
        borderColor: bgColor,
      }} />

      {/* Sol yarım (0–180 deg) */}
      <View style={{ position: 'absolute', left: 0, width: half, height: RING_SIZE, overflow: 'hidden' }}>
        <View style={{
          width: half,
          height: RING_SIZE,
          borderTopLeftRadius: half,
          borderBottomLeftRadius: half,
          backgroundColor: color,
          // @ts-ignore — transformOrigin destekleniyor ama TS tipi yok
          transformOrigin: 'right center',
          transform: [{ rotate: leftDeg }],
        }} />
      </View>

      {/* Sağ yarım (180–360 deg) */}
      <View style={{ position: 'absolute', right: 0, width: half, height: RING_SIZE, overflow: 'hidden' }}>
        <View style={{
          width: half,
          height: RING_SIZE,
          borderTopRightRadius: half,
          borderBottomRightRadius: half,
          backgroundColor: color,
          // @ts-ignore
          transformOrigin: 'left center',
          transform: [{ rotate: rightDeg }],
        }} />
      </View>

      {/* İç beyaz/koyu daire (halkayı kesmek için) */}
      <View style={{
        position: 'absolute',
        width: RING_SIZE - RING_STROKE * 2,
        height: RING_SIZE - RING_STROKE * 2,
        borderRadius: (RING_SIZE - RING_STROKE * 2) / 2,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </View>
    </View>
  );
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

const PRESETS = [60, 90, 120];

export interface RestTimerProps {
  visible: boolean;
  initialSeconds?: number;
  onComplete: () => void;
  onDismiss: () => void;
}

export function RestTimer({ visible, initialSeconds = 60, onComplete, onDismiss }: RestTimerProps) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [total, setTotal]     = useState(initialSeconds);
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;

  // Modal açıldığında / kapandığında
  useEffect(() => {
    if (visible) {
      setTotal(initialSeconds);
      setRemaining(initialSeconds);
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      fadeAnim.setValue(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [visible, initialSeconds]);

  // Geri sayım
  useEffect(() => {
    if (!visible) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [visible, total]);

  const changePreset = useCallback((secs: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTotal(secs);
    setRemaining(secs);
  }, []);

  const progress = total > 0 ? remaining / total : 0;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr = mins > 0
    ? `${mins}:${secs.toString().padStart(2, '0')}`
    : `${remaining}`;

  const isLow = remaining <= 10;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <View style={s.sheet}>
          {/* Başlık */}
          <View style={s.header}>
            <Ionicons name="timer" size={20} color={colors.workoutColor} />
            <Text style={s.title}>Dinlenme Süresi</Text>
            <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Dairesel sayaç */}
          <View style={s.ringWrap}>
            <CircularCountdown
              progress={progress}
              color={isLow ? colors.error : colors.workoutColor}
              bgColor={colors.skeletonBg}
            >
              <Text style={[s.timeText, { color: isLow ? colors.error : colors.text }]}>
                {timeStr}
              </Text>
              <Text style={s.timeSub}>sn kaldı</Text>
            </CircularCountdown>
          </View>

          {/* Preset butonları */}
          <View style={s.presets}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[s.presetBtn, total === p && { backgroundColor: colors.workoutColor }]}
                onPress={() => changePreset(p)}
                activeOpacity={0.8}
              >
                <Text style={[s.presetText, total === p && { color: colors.white }]}>{p}sn</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Atla butonu */}
          <TouchableOpacity style={s.skipBtn} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={s.skipText}>Geç</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  ringWrap: {
    marginVertical: 8,
  },
  timeText: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  timeSub: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  presets: {
    flexDirection: 'row',
    gap: 10,
  },
  presetBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.inputBg,
    minWidth: 72,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  skipBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
