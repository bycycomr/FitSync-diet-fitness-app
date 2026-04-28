/**
 * onboarding.tsx — Görev 13
 *
 * Animasyonlu 4 adımlı karşılama akışı:
 *   Adım 1: Hoş Geldin (isim/avatar göster)
 *   Adım 2: Vücut Ölçüleri (boy, kilo, yaş)
 *   Adım 3: Hedefin (hedef kilo + lose/maintain/gain)
 *   Adım 4: Hazır! (confetti tarzı başarı ekranı)
 *
 * Tamamlandıktan sonra Firestore + Zustand güncellenir,
 * _layout.tsx yeniden değerlendirip /(tabs)'a yönlendirir.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { updateUserProfile } from '@/services/userService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import type { Goal } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
// Renkler useTheme() hook'undan alınır

// ─── Adım Göstergesi ──────────────────────────────────────────────────────────

function StepDots({ current, total, primaryColor }: { current: number; total: number; primaryColor: string }) {
  const getDotStyles = () => StyleSheet.create({
    row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 32 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
    dotActive: { width: 24, backgroundColor: primaryColor },
    dotDone: { backgroundColor: primaryColor + '60' },
  });

  const dotStyles = getDotStyles();
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === current && dotStyles.dotActive,
            i < current && dotStyles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Sayısal Input ────────────────────────────────────────────────────────────

function NumInput({
  label, value, onChange, placeholder, unit, maxLength = 3, primaryColor, textColor, inputBg, textMutedColor,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
  maxLength?: number;
  primaryColor: string;
  textColor: string;
  inputBg: string;
  textMutedColor: string;
}) {
  const [focused, setFocused] = useState(false);
  const ninStyles = StyleSheet.create({
    wrap: { gap: 6 },
    label: { fontSize: 13, fontWeight: '600', color: textMutedColor, marginLeft: 2 },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: inputBg,
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 54,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    boxFocused: { borderColor: primaryColor },
    input: { flex: 1, fontSize: 18, fontWeight: '700', color: textColor },
    unit: { fontSize: 14, color: textMutedColor, fontWeight: '600' },
  });

  return (
    <View style={ninStyles.wrap}>
      <Text style={ninStyles.label}>{label}</Text>
      <View style={[ninStyles.box, focused && ninStyles.boxFocused]}>
        <TextInput
          style={ninStyles.input}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
          placeholder={placeholder}
          placeholderTextColor={textMutedColor}
          keyboardType="numeric"
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <Text style={ninStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

// ─── Hedef Seçici ─────────────────────────────────────────────────────────────
// GOAL_OPTIONS OnboardingScreen içinde dinamik olarak oluşturulur

// ─── Adım Ekranları ───────────────────────────────────────────────────────────

function Step1Welcome({ displayName, primaryColor, primaryDark }: { displayName: string; primaryColor: string; primaryDark: string }) {
  return (
    <View style={s.stepContainer}>
      <LinearGradient colors={[primaryColor, primaryDark]} style={s.heroBadge}>
        <Ionicons name="fitness" size={48} color="#FFF" />
      </LinearGradient>
      <Text style={s.welcomeTitle}>Hoş geldin,{'\n'}{displayName || 'Sporcu'} 👋</Text>
      <Text style={s.welcomeSub}>
        FitSync sana özel bir diyet ve antrenman deneyimi sunmak için birkaç bilgiye ihtiyaç duyuyor.
        {'\n\n'}Bu sadece 30 saniye sürer!
      </Text>
    </View>
  );
}

function Step2Metrics({
  height, setHeight, weight, setWeight, age, setAge, colors,
}: {
  height: string; setHeight: (v: string) => void;
  weight: string; setWeight: (v: string) => void;
  age: string;    setAge: (v: string) => void;
  colors: ThemeColors;
}) {
  const primaryColor = colors.warning || '#FF7043';
  return (
    <View style={s.stepContainer}>
      <View style={[s.stepIcon, { backgroundColor: primaryColor + '1A' }]}>
        <Ionicons name="body" size={32} color={primaryColor} />
      </View>
      <Text style={s.stepTitle}>Vücut Ölçülerin</Text>
      <Text style={s.stepSub}>AI asistanın sana en doğru planı yapabilsin diye bu bilgilere ihtiyacı var.</Text>
      <View style={s.fieldsGrid}>
        <NumInput
          label="Boyun"
          value={height}
          onChange={setHeight}
          placeholder="170"
          unit="cm"
          primaryColor={primaryColor}
          textColor={colors.text}
          inputBg={colors.cardBackground}
          textMutedColor={colors.textSecondary}
        />
        <NumInput
          label="Kilonj"
          value={weight}
          onChange={setWeight}
          placeholder="70"
          unit="kg"
          primaryColor={primaryColor}
          textColor={colors.text}
          inputBg={colors.cardBackground}
          textMutedColor={colors.textSecondary}
        />
        <NumInput
          label="Yaşın"
          value={age}
          onChange={setAge}
          placeholder="25"
          unit="yaş"
          maxLength={2}
          primaryColor={primaryColor}
          textColor={colors.text}
          inputBg={colors.cardBackground}
          textMutedColor={colors.textSecondary}
        />
      </View>
    </View>
  );
}

function Step3Goal({
  targetWeight, setTargetWeight, goal, setGoal, primaryColor, colors, goalOptions,
}: {
  targetWeight: string; setTargetWeight: (v: string) => void;
  goal: Goal | null;    setGoal: (g: Goal) => void;
  primaryColor: string; colors: ThemeColors;
  goalOptions: Array<{ value: Goal; label: string; sub: string; icon: any; color: string }>;
}) {
  return (
    <View style={s.stepContainer}>
      <View style={[s.stepIcon, { backgroundColor: primaryColor + '1A' }]}>
        <Ionicons name="trophy" size={32} color={primaryColor} />
      </View>
      <Text style={s.stepTitle}>Hedefin Ne?</Text>
      <Text style={s.stepSub}>Hedef kilonu belirt ve seni en iyi tanımlayan hedefe tıkla.</Text>

      <NumInput
        label="Hedef Kilonj"
        value={targetWeight}
        onChange={setTargetWeight}
        placeholder="65"
        unit="kg"
        primaryColor={primaryColor}
        textColor={colors.text}
        inputBg={colors.cardBackground}
        textMutedColor={colors.textSecondary}
      />

      <View style={s.goalGrid}>
        {goalOptions.map((opt: any) => (
          <TouchableOpacity
            key={opt.value}
            style={[s.goalCard, goal === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '12' }]}
            onPress={() => setGoal(opt.value)}
            activeOpacity={0.8}
          >
            <View style={[s.goalIcon, { backgroundColor: goal === opt.value ? opt.color : '#F0F0F0' }]}>
              <Ionicons name={opt.icon} size={22} color={goal === opt.value ? '#FFF' : '#9E9E9E'} />
            </View>
            <Text style={[s.goalLabel, goal === opt.value && { color: opt.color }]}>{opt.label}</Text>
            <Text style={s.goalSub}>{opt.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Step4Done({ primaryColor, primaryDark }: { primaryColor: string; primaryDark: string }) {
  return (
    <View style={[s.stepContainer, { alignItems: 'center' }]}>
      <LinearGradient colors={[primaryColor, primaryDark]} style={s.doneCircle}>
        <Ionicons name="checkmark" size={52} color="#FFF" />
      </LinearGradient>
      <Text style={s.doneTitle}>Her şey hazır! 🎉</Text>
      <Text style={s.doneSub}>
        Profilin oluşturuldu. Artık AI asistanın senin hedeflerini, ölçülerini ve tercihlerini biliyor.
        {'\n\n'}Hadi başlayalım!
      </Text>
    </View>
  );
}

// ─── Ana Onboarding Ekranı ────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const uid         = useUserStore((s) => s.uid);
  const displayName = useUserStore((s) => s.displayName);
  const setBodyMetrics = useUserStore((s) => s.setBodyMetrics);

  // Hedef seçenekleri — renkler dinamik
  const GOAL_OPTIONS: {
    value: Goal;
    label: string;
    sub: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
  }[] = [
    { value: 'lose',     label: 'Kilo Ver',  sub: 'Yağ yak, form koru',   icon: 'trending-down',    color: colors.warning },
    { value: 'maintain', label: 'Dengede Kal', sub: 'Kiloyu koru, güçlen', icon: 'remove-circle',    color: colors.workoutColor },
    { value: 'gain',     label: 'Kilo Al',   sub: 'Kas kazan, büyü',      icon: 'trending-up',      color: colors.primary },
  ];

  const [step, setStep]               = useState(0);
  const [height, setHeight]           = useState('');
  const [weight, setWeight]           = useState('');
  const [age, setAge]                 = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goal, setGoal]               = useState<Goal | null>(null);
  const [saving, setSaving]           = useState(false);

  // Slide animasyonu
  const slideX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animateStep = (nextStep: number) => {
    opacity.value = withTiming(0, { duration: 150 }, () => {
      slideX.value = withSpring(0, { damping: 20 });
      opacity.value = withTiming(1, { duration: 200 });
      runOnJS(setStep)(nextStep);
    });
  };

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  const isStep2Valid = height.trim() && weight.trim() && age.trim();
  const isStep3Valid = goal !== null;

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 2) {
      animateStep(step + 1);
      return;
    }
    // Step 2 → 3 kontrolü
    if (step === 1 && !isStep2Valid) return;
    if (step === 2 && !isStep3Valid) return;

    if (step === 2) {
      // Step 3 tamamlandı → Kaydet → Step 4
      setSaving(true);
      const metrics = {
        height:       height      ? parseFloat(height)       : null,
        weight:       weight      ? parseFloat(weight)       : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        age:          age         ? parseInt(age, 10)        : null,
        goal,
      };
      setBodyMetrics({ ...metrics, goal: goal ?? undefined });
      if (uid) {
        await updateUserProfile(uid, metrics).catch(console.error);
      }
      setSaving(false);
      animateStep(3);
      return;
    }

    // Step 4 → Ana sayfa
    router.replace('/(tabs)');
  };

  const btnLabel = step === TOTAL_STEPS - 1 ? "Hadi Başlayalım! 🚀" : step === 2 ? "Kaydet ve Devam Et" : "Devam Et";
  const btnDisabled = (step === 1 && !isStep2Valid) || (step === 2 && !isStep3Valid) || saving;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Adım göstergesi */}
          <StepDots current={step} total={TOTAL_STEPS} primaryColor={colors.primary} />

          {/* İçerik */}
          <Animated.View style={animStyle}>
            {step === 0 && <Step1Welcome displayName={displayName} primaryColor={colors.primary} primaryDark={colors.primaryDark} />}
            {step === 1 && (
              <Step2Metrics
                height={height} setHeight={setHeight}
                weight={weight} setWeight={setWeight}
                age={age}       setAge={setAge}
                colors={colors}
              />
            )}
            {step === 2 && (
              <Step3Goal
                targetWeight={targetWeight} setTargetWeight={setTargetWeight}
                goal={goal}                  setGoal={setGoal}
                primaryColor={colors.primary}
                colors={colors}
                goalOptions={GOAL_OPTIONS}
              />
            )}
            {step === 3 && <Step4Done primaryColor={colors.primary} primaryDark={colors.primaryDark} />}
          </Animated.View>

          {/* Buton */}
          <TouchableOpacity
            style={[s.btn, btnDisabled && s.btnDisabled]}
            onPress={handleNext}
            activeOpacity={0.85}
            disabled={btnDisabled}
          >
            <LinearGradient
              colors={btnDisabled ? [colors.textMuted, colors.textSecondary] : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.btnGradient}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={s.btnText}>{btnLabel}</Text>
                  {step < TOTAL_STEPS - 1 && <Ionicons name="arrow-forward" size={18} color="#FFF" />}
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Atla (sadece adım 1 ve 2'de) */}
          {step < TOTAL_STEPS - 2 && step > 0 && (
            <TouchableOpacity onPress={() => animateStep(step + 1)} style={s.skip}>
              <Text style={s.skipText}>Şimdilik Atla</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 40, gap: 24 },

  stepContainer: { gap: 16 },

  // Adım 1
  heroBadge: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#4CAF82',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  welcomeTitle: { fontSize: 28, fontWeight: '800', color: '#1A1A2E', textAlign: 'center', lineHeight: 36 },
  welcomeSub: { fontSize: 15, color: '#9E9E9E', textAlign: 'center', lineHeight: 24 },

  // Adımlar 2-3
  stepIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  stepTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  stepSub: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 22 },
  fieldsGrid: { gap: 14 },

  // Hedef kartları
  goalGrid: { flexDirection: 'row', gap: 10 },
  goalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EEEEEE',
    gap: 8,
    backgroundColor: '#FAFAFA',
  },
  goalIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  goalLabel: { fontSize: 12, fontWeight: '700', color: '#424242', textAlign: 'center' },
  goalSub: { fontSize: 10, color: '#9E9E9E', textAlign: 'center' },

  // Adım 4
  doneCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#4CAF82',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  doneTitle: { fontSize: 26, fontWeight: '800', color: '#1A1A2E', textAlign: 'center' },
  doneSub: { fontSize: 15, color: '#9E9E9E', textAlign: 'center', lineHeight: 24 },

  // Buton
  btn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4CAF82',
    shadowOpacity: 0.38,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  btnDisabled: { shadowOpacity: 0, elevation: 0 },
  btnGradient: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  // Atla
  skip: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 13, color: '#BDBDBD', fontWeight: '500' },
});
