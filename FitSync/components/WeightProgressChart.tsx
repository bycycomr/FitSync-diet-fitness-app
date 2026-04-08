/**
 * WeightProgressChart.tsx
 *
 * Kullanıcının kilo gidişatını animasyonlu bir trend grafiğiyle gösterir.
 * - Günlük kilo kaydı girişine izin verir
 * - Hedef kiloya gidiş trend çizgisi
 * - Material Design 3 uyumlu, dark mode destekli
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { useUserStore } from '@/store/userStore';
import { addWeightLog, fetchWeightLog } from '@/services/userService';
import type { WeightLog } from '@/types';

// ─── Grafik Yardımcıları ──────────────────────────────────────────────────────

const CHART_HEIGHT = 100;
const DOT_RADIUS = 5;

function getChartPoints(
  logs: WeightLog[],
  chartWidth: number,
): { x: number; y: number; weight: number; date: string }[] {
  if (logs.length === 0) return [];

  const weights = logs.map((l) => l.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  return logs.map((log, i) => ({
    x: logs.length === 1 ? chartWidth / 2 : (i / (logs.length - 1)) * chartWidth,
    y: CHART_HEIGHT - ((log.weight - minW) / range) * CHART_HEIGHT,
    weight: log.weight,
    date: log.date,
  }));
}

// ─── Animasyonlu Nokta ────────────────────────────────────────────────────────

function ChartDot({
  x, y, color, isLast,
}: {
  x: number; y: number; color: string; isLast: boolean;
}) {
  const scale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, delay: 200 }).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - DOT_RADIUS,
        top: y - DOT_RADIUS,
        width: DOT_RADIUS * 2,
        height: DOT_RADIUS * 2,
        borderRadius: DOT_RADIUS,
        backgroundColor: isLast ? color : color + 'BB',
        borderWidth: isLast ? 2 : 1,
        borderColor: '#fff',
        transform: [{ scale }],
      }}
    />
  );
}

// ─── Çizgi Segmenti ────────────────────────────────────────────────────────────

function ChartLine({
  x1, y1, x2, y2, color,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - 1,
        width: length,
        height: 2,
        backgroundColor: color + '88',
        transformOrigin: '0% 50%',
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// ─── Kilo Girişi Modalı ───────────────────────────────────────────────────────

function WeightInputModal({
  visible,
  currentWeight,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentWeight: number | null;
  onClose: () => void;
  onSave: (weight: number) => Promise<void>;
}) {
  const { colors } = useTheme();
  const styles = getModalStyles(colors);
  const [value, setValue] = useState(currentWeight?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setValue(currentWeight?.toString() ?? '');
  }, [visible, currentWeight]);

  const handleSave = async () => {
    const parsed = parseFloat(value.replace(',', '.'));
    if (isNaN(parsed) || parsed < 20 || parsed > 400) {
      Alert.alert('Hata', 'Lütfen geçerli bir kilo girin (20–400 kg arası).');
      return;
    }
    setSaving(true);
    try {
      await onSave(parsed);
      onClose();
    } catch {
      Alert.alert('Hata', 'Kilo kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Bugünkü Kilonu Kaydet</Text>
          <Text style={styles.sub}>kg cinsinden mevcut kilonu gir</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder={currentWeight?.toString() ?? '70.0'}
              placeholderTextColor={colors.textMuted}
              autoFocus
              selectTextOnFocus
            />
            <Text style={styles.unit}>kg</Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveText}>Kaydet</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getModalStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { backgroundColor: colors.cardBackground, borderRadius: 24, padding: 24, width: '100%', gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, paddingHorizontal: 16, marginTop: 4 },
  input: { flex: 1, fontSize: 32, fontWeight: '700', color: colors.text, paddingVertical: 12, textAlign: 'center' },
  unit: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  saveBtn: { flex: 1, height: 48, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

interface WeightProgressChartProps {
  uid: string;
}

export function WeightProgressChart({ uid }: WeightProgressChartProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const targetWeight = useUserStore((s) => s.targetWeight);

  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadLogs = async () => {
    try {
      const data = await fetchWeightLog(uid, 30);
      setLogs(data);
    } catch {
      // sessiz başarısızlık
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }
  };

  useEffect(() => {
    loadLogs();
  }, [uid]);

  const handleSaveWeight = async (weight: number) => {
    await addWeightLog(uid, weight);
    await loadLogs();
  };

  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;
  const firstWeight  = logs.length > 1 ? logs[0].weight : null;
  const points = chartWidth > 0 ? getChartPoints(logs, chartWidth - DOT_RADIUS * 2) : [];

  // Hedef kilo çizgisi Y pozisyonu
  let targetY: number | null = null;
  if (targetWeight && logs.length > 0 && chartWidth > 0) {
    const weights = logs.map((l) => l.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const range = maxW - minW || 1;
    const ty = CHART_HEIGHT - ((targetWeight - minW) / range) * CHART_HEIGHT;
    if (ty >= 0 && ty <= CHART_HEIGHT) targetY = ty;
  }

  // İlerleme bilgisi
  const progressKg = latestWeight && firstWeight ? firstWeight - latestWeight : null;
  const progressToTarget = latestWeight && targetWeight ? latestWeight - targetWeight : null;

  return (
    <>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {/* Başlık */}
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Ionicons name="scale" size={18} color={colors.warning} />
          </View>
          <Text style={styles.title}>Kilo Takibi</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Kaydet</Text>
          </TouchableOpacity>
        </View>

        {/* İstatistik satırı */}
        {latestWeight !== null && (
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{latestWeight} kg</Text>
              <Text style={styles.statLabel}>Mevcut</Text>
            </View>
            {targetWeight && (
              <View style={styles.statChip}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{targetWeight} kg</Text>
                <Text style={styles.statLabel}>Hedef</Text>
              </View>
            )}
            {progressToTarget !== null && (
              <View style={styles.statChip}>
                <Text style={[
                  styles.statValue,
                  { color: progressToTarget <= 0 ? colors.primary : colors.warning },
                ]}>
                  {progressToTarget <= 0 ? '🎉 Hedef!' : `${Math.abs(progressToTarget).toFixed(1)} kg`}
                </Text>
                <Text style={styles.statLabel}>{progressToTarget <= 0 ? 'Tebrikler' : 'Kalan'}</Text>
              </View>
            )}
            {progressKg !== null && Math.abs(progressKg) > 0.1 && (
              <View style={styles.statChip}>
                <Text style={[
                  styles.statValue,
                  { color: progressKg > 0 ? colors.primary : colors.workoutColor },
                ]}>
                  {progressKg > 0 ? `−${progressKg.toFixed(1)}` : `+${Math.abs(progressKg).toFixed(1)}`} kg
                </Text>
                <Text style={styles.statLabel}>Toplam</Text>
              </View>
            )}
          </View>
        )}

        {/* Grafik */}
        {loading ? (
          <View style={styles.chartPlaceholder}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="scale-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>Henüz kilo kaydı yok</Text>
            <Text style={styles.emptyHint}>Yukarıdaki "Kaydet" butonuna tıklayarak başla</Text>
          </View>
        ) : (
          <View
            style={styles.chartArea}
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
          >
            {chartWidth > 0 && (
              <View style={{ position: 'relative', height: CHART_HEIGHT }}>
                {/* Hedef kilo yatay çizgi */}
                {targetY !== null && (
                  <View style={[styles.targetLine, { top: targetY }]}>
                    <Text style={styles.targetLineLabel}>Hedef</Text>
                  </View>
                )}

                {/* Çizgi segmentleri */}
                {points.map((pt, i) => {
                  if (i === 0) return null;
                  const prev = points[i - 1];
                  return (
                    <ChartLine
                      key={`line-${i}`}
                      x1={prev.x + DOT_RADIUS}
                      y1={prev.y}
                      x2={pt.x + DOT_RADIUS}
                      y2={pt.y}
                      color={colors.warning}
                    />
                  );
                })}

                {/* Noktalar */}
                {points.map((pt, i) => (
                  <ChartDot
                    key={`dot-${i}`}
                    x={pt.x + DOT_RADIUS}
                    y={pt.y}
                    color={colors.warning}
                    isLast={i === points.length - 1}
                  />
                ))}

                {/* Son kilo etiketi */}
                {points.length > 0 && (
                  <View style={[
                    styles.lastLabel,
                    {
                      left: Math.max(0, Math.min(points[points.length - 1].x - 16, chartWidth - 48)),
                      top: Math.max(0, points[points.length - 1].y - 22),
                    },
                  ]}>
                    <Text style={styles.lastLabelText}>{points[points.length - 1].weight} kg</Text>
                  </View>
                )}
              </View>
            )}

            {/* X ekseni etiketleri */}
            {logs.length > 1 && (
              <View style={styles.xAxis}>
                <Text style={styles.xLabel}>{logs[0].date.slice(5)}</Text>
                <Text style={styles.xLabel}>{logs[logs.length - 1].date.slice(5)}</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>

      <WeightInputModal
        visible={modalVisible}
        currentWeight={latestWeight}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveWeight}
      />
    </>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warning + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primary + '1A',
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  statChip: {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 72,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  chartPlaceholder: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  chartArea: {
    marginTop: 4,
  },
  targetLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.primary + '66',
  },
  targetLineLabel: {
    position: 'absolute',
    right: 0,
    top: -12,
    fontSize: 9,
    color: colors.primary,
    fontWeight: '600',
  },
  lastLabel: {
    position: 'absolute',
    backgroundColor: colors.warning + 'DD',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  lastLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  xLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
