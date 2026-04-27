/**
 * components/WeeklyReportModal.tsx
 *
 * Haftalık AI ilerleme raporu modal'ı.
 * Profil ekranındaki "Bu Hafta" kartından açılır.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { generateWeeklyReport, type WeeklyReportData } from '@/services/weeklyReportService';

interface WeeklyReportModalProps {
  visible: boolean;
  onClose: () => void;
  uid: string;
  streakCount: number;
}

interface StatChipProps {
  icon: string;
  label: string;
  value: string;
  color: string;
}

function StatChip({ icon, label, value, color }: StatChipProps) {
  const { colors } = useTheme();
  const s = getStyles(colors);
  return (
    <View style={[s.chip, { borderColor: color + '33' }]}>
      <Text style={s.chipIcon}>{icon}</Text>
      <Text style={[s.chipValue, { color }]}>{value}</Text>
      <Text style={s.chipLabel}>{label}</Text>
    </View>
  );
}

export function WeeklyReportModal({ visible, onClose, uid, streakCount }: WeeklyReportModalProps) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setReport(null);
    setError(null);
    setLoading(true);
    generateWeeklyReport(uid, streakCount)
      .then(setReport)
      .catch(() => setError('Rapor oluşturulamadı. Lütfen tekrar dene.'))
      .finally(() => setLoading(false));
  }, [visible, uid, streakCount]);

  const weightLabel =
    report?.weightChange === null
      ? 'veri yok'
      : report?.weightChange !== undefined
        ? `${report.weightChange > 0 ? '+' : ''}${report.weightChange} kg`
        : '—';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Ionicons name="bar-chart" size={22} color={colors.primary} />
              <Text style={s.title}>Bu Haftanın Raporu</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading && (
              <View style={s.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.loadingText}>AI rapor hazırlıyor...</Text>
              </View>
            )}

            {error && !loading && (
              <View style={s.center}>
                <Ionicons name="warning-outline" size={36} color={colors.error} />
                <Text style={[s.loadingText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            {report && !loading && (
              <>
                {/* İstatistik Chips */}
                <View style={s.chipGrid}>
                  <StatChip icon="🍽️" label="Öğün"     value={String(report.totalMeals)}    color={colors.primary} />
                  <StatChip icon="💪" label="Antrenman" value={String(report.totalWorkouts)} color={colors.workoutColor} />
                  <StatChip icon="💧" label="Su (bardak)" value={String(report.totalWaterGlasses)} color="#42A5F5" />
                  <StatChip icon="⚖️" label="Kilo farkı" value={weightLabel}               color={colors.secondary} />
                  <StatChip icon="🔥" label="Streak"    value={`${report.streakDays} gün`} color={colors.tertiary} />
                </View>

                {/* AI Özeti */}
                <View style={s.summaryBox}>
                  <View style={s.summaryHeader}>
                    <Ionicons name="sparkles" size={16} color={colors.primary} />
                    <Text style={s.summaryTitle}>AI Değerlendirmesi</Text>
                  </View>
                  <Text style={s.summaryText}>{report.aiSummary}</Text>
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={[s.closeBtn, { backgroundColor: colors.primary }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={[s.closeBtnText, { color: colors.surface }]}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  center: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    width: '46%',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  chipIcon: { fontSize: 22 },
  chipValue: { fontSize: 20, fontWeight: '700' },
  chipLabel: { fontSize: 12, color: colors.textMuted },
  summaryBox: {
    backgroundColor: colors.inputBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  summaryText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  closeBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 16, fontWeight: '700' },
});
