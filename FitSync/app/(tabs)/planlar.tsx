/**
 * planlar.tsx — Faz 4 Görev 10 & 11
 *
 * - Gemini'den gelen JSON verilerini MealPlanCard + WorkoutPlanCard ile gösterir
 * - Tamamlanan öğün/egzersizler Firestore'a kaydedilir (Görev 11)
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { useUserStore } from '@/store/userStore';
import { MealPlanCard } from '@/components/MealPlanCard';
import { WorkoutPlanCard } from '@/components/WorkoutPlanCard';
import { WorkoutHistoryCard } from '@/components/WorkoutHistoryCard';
import { addCompletion, fetchWeeklyCompletions, addWorkoutHistory, fetchWorkoutHistory, fetchPersonalRecords, updatePersonalRecords } from '@/services/userService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { analyzeMealFromImage, createMealPlanFromAnalysis } from '@/services/visionService';
import { generateWeeklyProgram } from '@/services/weeklyProgramService';

// ─── Boş Durum Bileşeni ───────────────────────────────────────────────────────

function EmptyState({ icon, color, title, subtitle, onPress }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const emptyStyles = getEmptyStyles(colors);
  return (
    <TouchableOpacity style={emptyStyles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={[emptyStyles.iconRing, { borderColor: color + '30', backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={30} color={color} />
      </View>
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.sub}>{subtitle}</Text>
      <View style={[emptyStyles.btn, { backgroundColor: color }]}>
        <Ionicons name="chatbubble-ellipses" size={14} color="#FFF" />
        <Text style={emptyStyles.btnText}>AI'dan Plan İste</Text>
      </View>
    </TouchableOpacity>
  );
}

const getEmptyStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  sub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});

// ─── Bölüm Başlığı ────────────────────────────────────────────────────────────

function SectionHeader({ icon, label, color, onClear }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onClear: () => void;
}) {
  const { colors } = useTheme();
  const secStyles = getSecStyles(colors);
  return (
    <View style={secStyles.row}>
      <View style={secStyles.left}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={secStyles.label}>{label}</Text>
      </View>
      <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-circle-outline" size={20} color={colors.border} />
      </TouchableOpacity>
    </View>
  );
}

const getSecStyles = (colors: ThemeColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 15, fontWeight: '700', color: colors.text },
});

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function PlanlarScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const router = useRouter();
  const uid = useUserStore((s) => s.uid);
  const activeMealPlan    = useUserStore((s) => s.activeMealPlan);
  const activeWorkoutPlan = useUserStore((s) => s.activeWorkoutPlan);
  const setActiveMealPlan    = useUserStore((s) => s.setActiveMealPlan);
  const setActiveWorkoutPlan = useUserStore((s) => s.setActiveWorkoutPlan);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const userProfile = useUserStore((s) => ({
    displayName: s.displayName,
    email: s.email,
    height: s.height,
    weight: s.weight,
    targetWeight: s.targetWeight,
    age: s.age,
    goal: s.goal,
    bmi: s.bmi,
  }));

  const goToChat = () => router.push('/(tabs)');

  // Antrenman geçmişi ve personal records'ları yükle
  useEffect(() => {
    if (!uid) return;

    const loadHistory = async () => {
      try {
        setLoadingHistory(true);
        const [history, records] = await Promise.all([
          fetchWorkoutHistory(uid, 50),
          fetchPersonalRecords(uid),
        ]);
        setWorkoutHistory(history);
        setPersonalRecords(records);
      } catch (error) {
        console.error('Antrenman geçmişi yükleme hatası:', error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [uid]);

  const pickAndAnalyzeImage = useCallback(async (source: 'camera' | 'gallery') => {
    try {
      setIsAnalyzing(true);
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });

      if (result.canceled) {
        setIsAnalyzing(false);
        return;
      }

      const imageUri = result.assets[0].uri;
      const analysis = await analyzeMealFromImage(imageUri);
      const mealPlan = createMealPlanFromAnalysis(analysis);

      setActiveMealPlan(mealPlan);
      Alert.alert(
        '✅ Analiz Tamamlandı',
        `${analysis.mealName} (Güven: ${analysis.confidence})\n\nKalori: ${analysis.estimatedCalories}kcal`
      );
    } catch (error) {
      Alert.alert(
        '❌ Hata',
        error instanceof Error ? error.message : 'Fotoğraf analizi başarısız oldu'
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [setActiveMealPlan]);

  const showImageSourcePicker = () => {
    Alert.alert(
      '📸 Yemek Fotoğrafı Seç',
      'Fotoğrafın kaynağını seçin',
      [
        { text: 'Kamera', onPress: () => pickAndAnalyzeImage('camera') },
        { text: 'Galeri', onPress: () => pickAndAnalyzeImage('gallery') },
        { text: 'İptal', onPress: () => {}, style: 'cancel' },
      ]
    );
  };

  const generateWeeklyProgramHandler = useCallback(async () => {
    if (!uid) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      setIsGeneratingWeekly(true);
      const completions = await fetchWeeklyCompletions(uid);
      const program = await generateWeeklyProgram(userProfile as any, completions, uid);

      if (program.mealPlans && program.mealPlans.length > 0) {
        setActiveMealPlan(program.mealPlans[0]);
      }
      if (program.workoutPlans && program.workoutPlans.length > 0) {
        setActiveWorkoutPlan(program.workoutPlans[0]);
      }

      Alert.alert(
        '✅ Haftalık Plan Oluşturuldu',
        `${program.mealPlans.length} beslenme ve ${program.workoutPlans.length} antrenman planı hazır!`
      );
    } catch (error) {
      Alert.alert(
        '❌ Hata',
        error instanceof Error ? error.message : 'Haftalık plan oluşturulamadı'
      );
    } finally {
      setIsGeneratingWeekly(false);
    }
  }, [uid, userProfile, setActiveMealPlan, setActiveWorkoutPlan]);

  /** Öğün tamamlandığında Firestore'a kaydet (fire-and-forget) */
  const handleMealComplete = useCallback((mealName: string) => {
    if (!uid) return;
    addCompletion(uid, 'meal', mealName).catch(console.error);
  }, [uid]);

  /** Tüm antrenman tamamlandığında Firestore'a kaydet (fire-and-forget) */
  const handleWorkoutComplete = useCallback(async () => {
    if (!uid || !activeWorkoutPlan) return;

    try {
      // Tamamlama kaydını ekle
      await addCompletion(uid, 'workout', activeWorkoutPlan.name);

      // Antrenman geçmişine kaydet (detaylı egzersiz bilgileri ile)
      const exercises = activeWorkoutPlan.exercises.map((ex) => ({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        durationSeconds: ex.durationSeconds,
      }));

      await addWorkoutHistory(uid, activeWorkoutPlan.name, activeWorkoutPlan.durationMinutes, exercises);

      // Personal records'ları güncelle (fire-and-forget)
      updatePersonalRecords(uid, exercises).catch(console.error);
    } catch (error) {
      console.error('Antrenman kaydetme hatası:', error);
    }
  }, [uid, activeWorkoutPlan]);

  const PRIMARY = colors.primary;
  const WORKOUT_COLOR = colors.workoutColor;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Başlık */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Aktif Planların</Text>
          <Text style={styles.heroSub}>
            {activeMealPlan || activeWorkoutPlan
              ? 'Tamamladıkça işaretle — ilerleme Profile yansıyacak ✅'
              : 'AI asistanından plan iste ve burada takip et'}
          </Text>

          {/* Fotoğraf Analiz Butonu */}
          <TouchableOpacity
            style={[styles.photoBtn, { backgroundColor: colors.primary }]}
            onPress={showImageSourcePicker}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#FFF" size={18} />
            ) : (
              <>
                <Ionicons name="camera" size={16} color="#FFF" />
                <Text style={styles.photoBtnText}>Fotoğraftan Beslenme Analizi</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Haftalık Plan Butonu */}
          <TouchableOpacity
            style={[styles.weeklyBtn, { backgroundColor: colors.workoutColor }]}
            onPress={generateWeeklyProgramHandler}
            disabled={isGeneratingWeekly}
          >
            {isGeneratingWeekly ? (
              <ActivityIndicator color="#FFF" size={18} />
            ) : (
              <>
                <Ionicons name="calendar" size={16} color="#FFF" />
                <Text style={styles.photoBtnText}>Haftalık Plan Oluştur</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Beslenme Planı ─────────────────────────────────── */}
        {activeMealPlan ? (
          <>
            <SectionHeader
              icon="nutrition"
              label="Beslenme Planı"
              color={PRIMARY}
              onClear={() => setActiveMealPlan(null)}
            />
            <MealPlanCard plan={activeMealPlan} onMealComplete={handleMealComplete} />
          </>
        ) : (
          <EmptyState
            icon="nutrition"
            color={PRIMARY}
            title="Beslenme Planı Yok"
            subtitle="AI asistanından günlük öğün planı iste. Makrolar ve kalori dağılımı burada gösterilir."
            onPress={goToChat}
          />
        )}

        {/* ── Antrenman Planı ────────────────────────────────── */}
        {activeWorkoutPlan ? (
          <>
            <SectionHeader
              icon="barbell"
              label="Antrenman Planı"
              color={WORKOUT_COLOR}
              onClear={() => setActiveWorkoutPlan(null)}
            />
            <WorkoutPlanCard
              plan={activeWorkoutPlan}
              onExerciseComplete={(exName) => {
                if (uid) addCompletion(uid, 'workout', exName).catch(console.error);
              }}
            />
          </>
        ) : (
          <EmptyState
            icon="barbell"
            color={WORKOUT_COLOR}
            title="Antrenman Planı Yok"
            subtitle="Antrenman programı iste. Egzersizleri tamamladıkça checkbox işaretleyebilirsin."
            onPress={goToChat}
          />
        )}

        {/* ── Antrenman Geçmişi ve Personal Records ────────────────────────── */}
        {!loadingHistory && (workoutHistory.length > 0 || personalRecords.length > 0) && (
          <WorkoutHistoryCard
            history={workoutHistory}
            personalRecords={personalRecords}
          />
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20 },
  hero: { marginBottom: 20 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: colors.text },
  heroSub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, lineHeight: 20, marginBottom: 12 },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
    justifyContent: 'center',
  },
  weeklyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    justifyContent: 'center',
  },
  photoBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
