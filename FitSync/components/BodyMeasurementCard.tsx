/**
 * components/BodyMeasurementCard.tsx
 *
 * Beden ölçüm günlüğü — bel, göğüs, kalça, kol (cm) takibi + trend çizgisi
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { addBodyMeasurement, fetchBodyMeasurements } from '@/services/userService';
import type { BodyMeasurement } from '@/types';

// ─── Ölçüm Alanları ──────────────────────────────────────────────────────────

interface MeasurementField {
  key: keyof Pick<BodyMeasurement, 'waist' | 'chest' | 'hip' | 'arm'>;
  label: string;
  icon: string;
}

const FIELDS: MeasurementField[] = [
  { key: 'waist', label: 'Bel',   icon: 'body' },
  { key: 'chest', label: 'Göğüs', icon: 'fitness' },
  { key: 'hip',   label: 'Kalça', icon: 'man' },
  { key: 'arm',   label: 'Kol',   icon: 'barbell' },
];

// ─── Mini Trend Grafiği ───────────────────────────────────────────────────────

interface TrendLineProps {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}

function TrendLine({ values, color, width = 80, height = 32 }: TrendLineProps) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {points.slice(0, -1).map((pt, i) => {
        const next = points[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y - 1,
              width: len,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            } as object}
          />
        );
      })}
    </View>
  );
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────

interface BodyMeasurementCardProps {
  uid: string;
}

export function BodyMeasurementCard({ uid }: BodyMeasurementCardProps) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [records, setRecords] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      const data = await fetchBodyMeasurements(uid, 30);
      if (!mountedRef.current) return;
      setRecords(data);
    } catch (err) {
      console.error('Beden ölçüm yükleme hatası:', err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [uid]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const latest = records[records.length - 1];

  const handleSave = async () => {
    const entry: Partial<Record<string, number>> = {};
    for (const f of FIELDS) {
      const val = parseFloat(inputs[f.key] ?? '');
      if (!isNaN(val) && val > 0) entry[f.key] = val;
    }
    if (Object.keys(entry).length === 0) {
      Alert.alert('Hata', 'En az bir ölçüm girin.');
      return;
    }
    try {
      setSaving(true);
      await addBodyMeasurement(uid, entry as Parameters<typeof addBodyMeasurement>[1]);
      await loadRecords();
      setModalVisible(false);
      setInputs({});
    } catch (err) {
      console.error('Beden ölçüm kaydetme hatası:', err);
      Alert.alert('Hata', 'Kayıt sırasında bir sorun oluştu.');
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [loading]);

  return (
    <View style={s.container}>
      {/* Başlık */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Ionicons name="body" size={22} color={colors.primary} />
          <Text style={s.title}>Beden Ölçümleri</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={colors.surface} />
          <Text style={s.addBtnText}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Güncel ölçümler */}
          <View style={s.grid}>
            {FIELDS.map((f) => {
              const currentVal = latest?.[f.key];
              const histVals = records
                .map((r) => r[f.key])
                .filter((v): v is number => v !== undefined && v !== null);
              return (
                <View key={f.key} style={s.cell}>
                  <Ionicons name={f.icon as 'body'} size={16} color={colors.primary} />
                  <Text style={s.cellLabel}>{f.label}</Text>
                  <Text style={s.cellValue}>
                    {currentVal !== undefined ? `${currentVal} cm` : '—'}
                  </Text>
                  <TrendLine values={histVals} color={colors.primary} />
                </View>
              );
            })}
          </View>

          {records.length === 0 && (
            <Text style={s.empty}>Henüz ölçüm kaydı yok. "Kaydet" butonuyla ekle.</Text>
          )}
        </Animated.View>
      )}

      {/* Kayıt Modalı */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Bugünkü Ölçümler (cm)</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {FIELDS.map((f) => (
                <View key={f.key} style={s.inputRow}>
                  <Text style={s.inputLabel}>{f.label}</Text>
                  <TextInput
                    style={s.input}
                    value={inputs[f.key] ?? ''}
                    onChangeText={(t) => setInputs((prev) => ({ ...prev, [f.key]: t }))}
                    placeholder="cm"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Text style={s.saveBtnText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
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
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 17, fontWeight: '600', color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: colors.surface },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '46%',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
    gap: 4,
  },
  cellLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cellValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginVertical: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputLabel: { fontSize: 15, color: colors.text, fontWeight: '500' },
  input: {
    width: 100,
    height: 44,
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  saveBtn: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.surface },
});
