/**
 * CalorieBudgetCard.tsx
 *
 * Kullanıcının günlük kalori bütçesini ve manuel öğün günlüğünü gösterir.
 * - Halka grafik (DonutChart): tüketilen / hedef kalori
 * - Manuel öğün ekleme (modal: ad, kalori, opsiyonel makrolar)
 * - Bugünkü öğün listesi (silme özelliğiyle)
 * - Protein / Karbonhidrat / Yağ özeti
 * - Material Design 3 uyumlu, dark mode destekli
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { useUserStore } from '@/store/userStore';
import { addFoodLog, fetchTodayFoodLog, deleteFoodLog } from '@/services/userService';
import { scanBarcode } from '@/services/foodScanService';
import type { DailyCalorieSummary, FoodLog } from '@/types';

// ─── Donut Grafik ────────────────────────────────────────────────────────────
// "Rotating halves" tekniği: iki yarım daire + overflow clip ile
// saf React Native View'lardan halka grafik

const DONUT_SIZE = 120;
const DONUT_STROKE = 14;

interface DonutChartProps {
  progress: number;  // 0.0 – 1.0 (aşma durumunda 1.0'da sabitlenir)
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}

function DonutChart({ progress, color, bgColor, children }: DonutChartProps) {
  const clampedP = Math.min(Math.max(progress, 0), 1);
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: clampedP,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [clampedP]);

  // Yarım daire stili
  const half = DONUT_SIZE / 2;
  const halfCircleStyle: object = {
    width: half,
    height: DONUT_SIZE,
    borderRadius: 0,
    overflow: 'hidden' as const,
    position: 'absolute' as const,
  };

  // Sol yarım daire (0–50%)
  const leftRotation = animVal.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '180deg', '180deg'],
  });

  // Sağ yarım daire (50–100%)
  const rightRotation = animVal.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '0deg', '180deg'],
  });

  return (
    <View style={{ width: DONUT_SIZE, height: DONUT_SIZE, alignItems: 'center', justifyContent: 'center' }}>
      {/* Arka plan halkası */}
      <View style={{
        width: DONUT_SIZE,
        height: DONUT_SIZE,
        borderRadius: half,
        borderWidth: DONUT_STROKE,
        borderColor: bgColor,
        position: 'absolute',
      }} />

      {/* Sol yarım — 0–180deg dönerek %0–50 dolduruluyor */}
      <View style={[halfCircleStyle, { left: 0 }]}>
        <Animated.View style={{
          width: half,
          height: DONUT_SIZE,
          borderTopLeftRadius: half,
          borderBottomLeftRadius: half,
          backgroundColor: color,
          transformOrigin: 'right center',
          transform: [{ rotate: leftRotation }],
        }} />
      </View>

      {/* Sağ yarım — %50+ için ayrı döndürülen yarım daire */}
      <View style={[halfCircleStyle, { right: 0 }]}>
        <Animated.View style={{
          width: half,
          height: DONUT_SIZE,
          borderTopRightRadius: half,
          borderBottomRightRadius: half,
          backgroundColor: color,
          transformOrigin: 'left center',
          transform: [{ rotate: rightRotation }],
        }} />
      </View>

      {/* Arka plan (iç daire) — yüzde 50'den az doldurulduğunda sol yarımı temizler */}
      {clampedP < 0.5 && (
        <Animated.View style={{
          width: half - DONUT_STROKE,
          height: DONUT_SIZE - DONUT_STROKE * 2,
          backgroundColor: bgColor,
          position: 'absolute',
          left: DONUT_STROKE / 2,
          borderTopLeftRadius: (half - DONUT_STROKE),
          borderBottomLeftRadius: (half - DONUT_STROKE),
        }} />
      )}

      {/* İç boşluk */}
      <View style={{
        width: DONUT_SIZE - DONUT_STROKE * 2,
        height: DONUT_SIZE - DONUT_STROKE * 2,
        borderRadius: DONUT_SIZE / 2 - DONUT_STROKE,
        backgroundColor: 'transparent',
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {children}
      </View>
    </View>
  );
}

// ─── Makro Çubuğu ────────────────────────────────────────────────────────────

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const { colors } = useTheme();
  const s = getMacroStyles(colors);
  return (
    <View style={[s.chip, { borderLeftColor: color }]}>
      <Text style={[s.val, { color }]}>{Math.round(value)}{unit}</Text>
      <Text style={s.lbl}>{label}</Text>
    </View>
  );
}

const getMacroStyles = (colors: ThemeColors) => StyleSheet.create({
  chip: { backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, borderLeftWidth: 3, minWidth: 70, alignItems: 'center' },
  val: { fontSize: 14, fontWeight: '700' },
  lbl: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
});

// ─── Öğün Satırı ─────────────────────────────────────────────────────────────

function FoodLogRow({ entry, onDelete }: { entry: FoodLog; onDelete: () => void }) {
  const { colors } = useTheme();
  const s = getRowStyles(colors);
  return (
    <View style={s.row}>
      <View style={s.dot} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{entry.name}</Text>
        {(entry.protein || entry.carbs || entry.fat) ? (
          <Text style={s.macro}>
            {entry.protein ? `P: ${entry.protein}g  ` : ''}
            {entry.carbs   ? `K: ${entry.carbs}g  `  : ''}
            {entry.fat     ? `Y: ${entry.fat}g`       : ''}
          </Text>
        ) : null}
      </View>
      <Text style={s.kcal}>{entry.calories} kcal</Text>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      </TouchableOpacity>
    </View>
  );
}

const getRowStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  info: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text },
  macro: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  kcal: { fontSize: 13, fontWeight: '700', color: colors.text },
});

// ─── Barkod Tarayıcı Modalı ───────────────────────────────────────────────────

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerModalProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) setScanned(false);
  }, [visible]);

  const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  }, [scanned, onScanned]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {!permission?.granted ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
            <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
              Barkod taramak için kamera izni gerekli
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              onPress={requestPermission}
            >
              <Text style={{ color: colors.white, fontWeight: '700' }}>İzin Ver</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.textSecondary }}>İptal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CameraView
              style={{ flex: 1 }}
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
            />
            {/* Tarama çerçevesi */}
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <View style={{
                width: 260, height: 160, borderRadius: 16,
                borderWidth: 2, borderColor: colors.primary,
                shadowColor: colors.primary, shadowOpacity: 0.5,
                shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
              }} />
              <Text style={{
                color: colors.white, marginTop: 16, fontSize: 14,
                fontWeight: '600', textShadowColor: '#000',
                textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 },
              }}>
                Barkodu çerçeve içine al
              </Text>
            </View>
            {/* Kapat butonu */}
            <TouchableOpacity
              style={{
                position: 'absolute', top: 52, right: 20,
                backgroundColor: '#000000AA', borderRadius: 20,
                padding: 8,
              }}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.white} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

// ─── Öğün Ekleme Modalı ───────────────────────────────────────────────────────

interface AddFoodModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => Promise<void>;
}

function AddFoodModal({ visible, onClose, onAdd }: AddFoodModalProps) {
  const { colors } = useTheme();
  const s = getModalStyles(colors);
  const [name, setName]         = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein]   = useState('');
  const [carbs, setCarbs]       = useState('');
  const [fat, setFat]           = useState('');
  const [saving, setSaving]     = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(false);

  const reset = () => { setName(''); setCalories(''); setProtein(''); setCarbs(''); setFat(''); };

  const handleBarcodeResult = useCallback(async (barcode: string) => {
    setScannerVisible(false);
    setScanning(true);
    try {
      const food = await scanBarcode(barcode);
      if (!food) {
        Alert.alert('Ürün Bulunamadı', 'Bu barkod için besin bilgisi bulunamadı. Manuel olarak girebilirsin.');
        return;
      }
      setName(food.name);
      setCalories(String(food.calories));
      if (food.protein > 0) setProtein(String(food.protein));
      if (food.carbs > 0) setCarbs(String(food.carbs));
      if (food.fat > 0) setFat(String(food.fat));
    } catch {
      Alert.alert('Hata', 'Ürün bilgisi alınamadı.');
    } finally {
      setScanning(false);
    }
  }, []);

  const handleAdd = async () => {
    const kcal = parseInt(calories.replace(',', '.'), 10);
    if (!name.trim()) { Alert.alert('Hata', 'Öğün adını girin.'); return; }
    if (isNaN(kcal) || kcal <= 0) { Alert.alert('Hata', 'Geçerli bir kalori değeri girin.'); return; }

    setSaving(true);
    try {
      await onAdd({
        name: name.trim(),
        calories: kcal,
        protein:  protein  ? parseFloat(protein.replace(',', '.'))  : undefined,
        carbs:    carbs    ? parseFloat(carbs.replace(',', '.'))    : undefined,
        fat:      fat      ? parseFloat(fat.replace(',', '.'))      : undefined,
      });
      reset();
      onClose();
    } catch {
      Alert.alert('Hata', 'Öğün eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, unit }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; unit?: string;
  }) => (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <TextInput
          style={[s.input, unit ? { flex: 1 } : null]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={label === 'Öğün Adı' ? 'default' : 'decimal-pad'}
        />
        {unit && <Text style={s.unit}>{unit}</Text>}
      </View>
    </View>
  );

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Öğün Ekle</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Barkod tarama butonu */}
                <TouchableOpacity
                  style={s.scanBtn}
                  onPress={() => setScannerVisible(true)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  disabled={scanning}
                >
                  {scanning
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Ionicons name="barcode-outline" size={22} color={colors.primary} />
                  }
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {scanning && (
              <View style={s.scanningBanner}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={s.scanningText}>Ürün bilgisi aranıyor...</Text>
              </View>
            )}

            <Field label="Öğün Adı"  value={name}     onChange={setName}     placeholder="Yulaf ezmesi, muz..." />
            <Field label="Kalori"     value={calories} onChange={setCalories} placeholder="350" unit="kcal" />

            <Text style={s.optLabel}>Makrolar (opsiyonel)</Text>
            <View style={s.macroRow}>
              <View style={{ flex: 1 }}>
                <Field label="Protein" value={protein} onChange={setProtein} placeholder="20" unit="g" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Karbonhidrat" value={carbs} onChange={setCarbs} placeholder="50" unit="g" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Yağ" value={fat} onChange={setFat} placeholder="10" unit="g" />
              </View>
            </View>

            <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.85} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={s.addBtnText}>Ekle</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarcodeResult}
      />
    </>
  );
}

const getModalStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, gap: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  scanBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center' },
  scanningBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary + '15', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  scanningText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  fieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10 },
  unit: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  optLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
  macroRow: { flexDirection: 'row', gap: 8 },
  addBtn: { height: 50, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
});

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

interface CalorieBudgetCardProps {
  uid: string;
  targetCalories?: number;
}

export function CalorieBudgetCard({ uid, targetCalories = 2000 }: CalorieBudgetCardProps) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [summary, setSummary] = useState<DailyCalorieSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showList, setShowList] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadSummary = async () => {
    try {
      const data = await fetchTodayFoodLog(uid, targetCalories);
      setSummary(data);
    } catch {
      // sessiz başarısızlık
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }
  };

  useEffect(() => { loadSummary(); }, [uid]);

  const handleAddFood = async (entry: { name: string; calories: number; protein?: number; carbs?: number; fat?: number }) => {
    await addFoodLog(uid, entry);
    await loadSummary();
  };

  const handleDelete = async (logId: string) => {
    try {
      await deleteFoodLog(uid, logId);
      await loadSummary();
    } catch {
      Alert.alert('Hata', 'Kayıt silinemedi.');
    }
  };

  const consumed     = summary?.totalCalories    ?? 0;
  const targetCal    = (summary?.targetCalories ?? targetCalories) || 2000;
  const remaining    = Math.max(targetCal - consumed, 0);
  const progress     = consumed / targetCal;
  const isOverBudget = consumed > targetCal;
  const dotColor     = isOverBudget ? colors.error : colors.primary;

  return (
    <>
      <Animated.View style={[s.card, { opacity: fadeAnim }]}>
        {/* Başlık */}
        <View style={s.header}>
          <View style={s.iconBox}>
            <Ionicons name="flame" size={18} color={colors.tertiary} />
          </View>
          <Text style={s.title}>Kalori Bütçesi</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={s.addBtnText}>Öğün Ekle</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : (
          <>
            {/* Donut + İstatistikler */}
            <View style={s.chartRow}>
              <DonutChart
                progress={progress}
                color={dotColor}
                bgColor={colors.skeletonBg}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={[s.donutMain, { color: dotColor }]}>{Math.round(consumed)}</Text>
                  <Text style={s.donutSub}>kcal</Text>
                </View>
              </DonutChart>

              <View style={s.statsCol}>
                <View style={s.statRow}>
                  <View style={[s.statDot, { backgroundColor: dotColor }]} />
                  <Text style={s.statLbl}>Tüketilen</Text>
                  <Text style={[s.statVal, { color: dotColor }]}>{Math.round(consumed)} kcal</Text>
                </View>
                <View style={s.statRow}>
                  <View style={[s.statDot, { backgroundColor: colors.skeletonBg }]} />
                  <Text style={s.statLbl}>Kalan</Text>
                  <Text style={s.statVal}>{Math.round(remaining)} kcal</Text>
                </View>
                <View style={s.statRow}>
                  <View style={[s.statDot, { backgroundColor: colors.textMuted }]} />
                  <Text style={s.statLbl}>Hedef</Text>
                  <Text style={s.statVal}>{targetCal} kcal</Text>
                </View>
                {isOverBudget && (
                  <Text style={[s.overBudget, { color: colors.error }]}>
                    Hedef aşıldı! +{Math.round(consumed - targetCal)} kcal
                  </Text>
                )}
              </View>
            </View>

            {/* Makro özeti */}
            {(summary && (summary.totalProtein > 0 || summary.totalCarbs > 0 || summary.totalFat > 0)) && (
              <View style={s.macroRow}>
                <MacroChip label="Protein"       value={summary.totalProtein} unit="g" color={colors.proteinColor} />
                <MacroChip label="Karbonhidrat"  value={summary.totalCarbs}   unit="g" color={colors.carbColor}    />
                <MacroChip label="Yağ"           value={summary.totalFat}     unit="g" color={colors.fatColor}     />
              </View>
            )}

            {/* Öğün listesi toggle */}
            {summary && summary.entries.length > 0 && (
              <TouchableOpacity style={s.toggleBtn} onPress={() => setShowList((v) => !v)} activeOpacity={0.7}>
                <Text style={s.toggleText}>{summary.entries.length} öğün kaydı</Text>
                <Ionicons name={showList ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {showList && summary && summary.entries.length > 0 && (
              <View style={s.listBox}>
                {summary.entries.map((entry) => (
                  <FoodLogRow key={entry.id} entry={entry} onDelete={() => handleDelete(entry.id)} />
                ))}
              </View>
            )}

            {summary && summary.entries.length === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyText}>Bugün henüz öğün kaydı yok</Text>
                <Text style={s.emptyHint}>Yediklerini manuel ekleyerek bütçeni takip et</Text>
              </View>
            )}
          </>
        )}
      </Animated.View>

      <AddFoodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddFood}
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
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tertiary + '1A',
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
  loadingBox: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  donutMain: {
    fontSize: 18,
    fontWeight: '800',
  },
  donutSub: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  statsCol: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLbl: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  overBudget: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    marginTop: 4,
  },
  toggleText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listBox: {
    marginTop: 4,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  emptyHint: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
