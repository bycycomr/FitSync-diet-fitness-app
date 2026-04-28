import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { registerUser } from '@/services/authService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

// Renkler useTheme() hook'undan alınır

type Goal = 'lose' | 'maintain' | 'gain';

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  error?: string;
  secureEntry?: boolean;
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  maxLength?: number;
  hint?: string;
}

function Field({
  label, value, onChange, placeholder, icon,
  error, secureEntry, keyboardType = 'default',
  autoCapitalize = 'none', maxLength, hint,
}: FieldProps) {
  const { colors } = useTheme();
  const fStyles = getFStyles(colors);
  
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const borderAnim = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    borderColor: borderAnim.value === 1
      ? colors.borderFocus
      : error ? colors.error : 'transparent',
    borderWidth: 1.5,
  }));

  return (
    <View style={fStyles.wrap}>
      <Text style={fStyles.label}>{label}</Text>
      <Animated.View style={[fStyles.box, animStyle]}>
        <Ionicons
          name={icon}
          size={19}
          color={focused ? colors.primary : error ? colors.error : colors.textMuted}
          style={fStyles.icon}
        />
        <TextInput
          style={fStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureEntry && !showPw}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => {
            setFocused(true);
            borderAnim.value = withTiming(1, { duration: 180 });
          }}
          onBlur={() => {
            setFocused(false);
            borderAnim.value = withTiming(0, { duration: 180 });
          }}
        />
        {secureEntry && (
          <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={8}>
            <Ionicons
              name={showPw ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </Animated.View>
      {!!error && <Text style={[fStyles.error, { color: colors.error }]}>{error}</Text>}
      {!!hint && !error && <Text style={fStyles.hint}>{hint}</Text>}
    </View>
  );
}

const getFStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginLeft: 2 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderColor: 'transparent',
    borderWidth: 1.5,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: colors.text, letterSpacing: 0.1 },
  error: { fontSize: 12, color: colors.error, marginLeft: 4 },
  hint: { fontSize: 12, color: colors.textMuted, marginLeft: 4 },
});

// GOAL_OPTIONS dinamik olarak RegisterScreen içinde oluşturulur

function PasswordStrength({ password }: { password: string }) {
  const { colors: themeColors } = useTheme();

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;
  const strengthColors = [themeColors.border, themeColors.error, themeColors.warning, themeColors.primary];
  const labels = ['', 'Zayıf', 'Orta', 'Güçlü'];

  if (password.length === 0) return null;
  return (
    <View style={psStyles.row}>
      {[1, 2, 3].map(i => (
        <View
          key={i}
          style={[psStyles.bar, { backgroundColor: i <= strength ? strengthColors[strength] : themeColors.border }]}
        />
      ))}
      <Text style={[psStyles.label, { color: strengthColors[strength] }]}>{labels[strength]}</Text>
    </View>
  );
}
const psStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  bar: { flex: 1, height: 3, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '600', width: 40, textAlign: 'right' },
});

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const authErrStyle = getAuthErrStyle(colors);

  // Hedef seçenekleri — renkler dinamik
  const GOAL_OPTIONS: {
    value: Goal;
    label: string;
    sub: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
  }[] = [
    { value: 'lose', label: 'Kilo Ver', sub: 'Yağ yak', icon: 'trending-down', color: colors.warning },
    { value: 'maintain', label: 'Koru', sub: 'Dengede kal', icon: 'remove-circle', color: colors.workoutColor },
    { value: 'gain', label: 'Kilo Al', sub: 'Kas kazan', icon: 'trending-up', color: colors.primary },
  ];

  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    translateY.value = withSpring(0, { damping: 18, stiffness: 110 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const isValid =
    displayName.trim().length >= 2 &&
    validateEmail(email) &&
    password.length >= 6 &&
    goal !== null;

  const handleRegister = async () => {
    setSubmitted(true);
    setAuthError('');
    if (!isValid) return;
    setLoading(true);
    try {
      await registerUser({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        targetWeight: null,
        goal,
      });
      // Başarılı kayıt — _layout.tsx'teki onAuthStateChanged yönlendirmeyi yapacak
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/email-already-in-use') {
        setAuthError('Bu e-posta zaten kullanılıyor.');
      } else if (code === 'auth/weak-password') {
        setAuthError('Şifren çok zayıf. Lütfen daha güçlü bir şifre seç.');
      } else {
        setAuthError('Kayıt olunamadı. Bağlantını kontrol et.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View style={[styles.hero, animStyle]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="person-add" size={34} color="#FFF" />
            </LinearGradient>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Hedeflerine ulaşmaya başla</Text>
          </Animated.View>

          {/* Kişisel Bilgiler */}
          <Animated.View style={[styles.card, animStyle]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.workoutColor }]} />
              <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
            </View>

            <Field
              label="Ad Soyad"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Adın ve soyadın"
              icon="person-outline"
              autoCapitalize="words"
              error={submitted && displayName.trim().length < 2 ? 'En az 2 karakter girin' : ''}
            />
            <Field
              label="E-posta"
              value={email}
              onChange={setEmail}
              placeholder="ornek@email.com"
              icon="mail-outline"
              keyboardType="email-address"
              error={submitted && !validateEmail(email) ? 'Geçerli bir e-posta girin' : ''}
            />
            <View>
              <Field
                label="Şifre"
                value={password}
                onChange={setPassword}
                placeholder="En az 6 karakter"
                icon="lock-closed-outline"
                secureEntry
                error={submitted && password.length < 6 ? 'En az 6 karakter olmalı' : ''}
              />
              <PasswordStrength password={password} />
            </View>
          </Animated.View>

          {/* Vücut Ölçüleri */}
          <Animated.View style={[styles.card, animStyle]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.warning }]} />
              <Text style={styles.sectionTitle}>Vücut Ölçüleri</Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Boy (cm)"
                  value={height}
                  onChange={setHeight}
                  placeholder="170"
                  icon="resize-outline"
                  keyboardType="numeric"
                  maxLength={3}
                  hint="İsteğe bağlı"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Kilo (kg)"
                  value={weight}
                  onChange={setWeight}
                  placeholder="70"
                  icon="scale-outline"
                  keyboardType="numeric"
                  maxLength={3}
                  hint="İsteğe bağlı"
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.card, animStyle]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.sectionTitle}>Hedefin Ne?</Text>
            </View>
            {submitted && !goal && (
              <Text style={styles.goalError}>Lütfen bir hedef seç</Text>
            )}
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.goalCard,
                    goal === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '1A' },
                  ]}
                  onPress={() => setGoal(opt.value)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.goalIconBox,
                    { backgroundColor: opt.color + (goal === opt.value ? '30' : '1A') },
                  ]}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={goal === opt.value ? opt.color : colors.textSecondary}
                    />
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[
                      styles.goalLabel,
                      goal === opt.value && { color: opt.color },
                    ]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.goalSub}>{opt.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {!!authError && (
            <Animated.View style={[authErrStyle.box, animStyle]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={authErrStyle.text}>{authError}</Text>
            </Animated.View>
          )}

          <Animated.View style={animStyle}>
            <TouchableOpacity
              style={[styles.primaryBtn, !isValid && submitted && styles.primaryBtnError]}
              onPress={handleRegister}
              activeOpacity={0.88}
              disabled={loading}
            >
              <LinearGradient
                colors={isValid || !submitted ? [colors.primary, colors.primaryDark] : [colors.textMuted, colors.textSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Kayıt Ol</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Zaten hesabın var mı?</Text>
              <Link href="/login" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.switchLink}> Giriş Yap</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>

          <Text style={styles.legal}>
            Kayıt olarak Gizlilik Politikası ve Kullanım Koşullarını kabul etmiş olursun.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingVertical: 24, paddingBottom: 40, gap: 24, justifyContent: 'center' },

  hero: { alignItems: 'center', gap: 10, marginTop: 10 },
  logoGradient: {
    width: 72, height: 72, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.textSecondary },

  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },

  metricsRow: { flexDirection: 'row', gap: 14 },

  goalError: { fontSize: 12, color: colors.error, marginTop: -8 },
  goalGrid: { flexDirection: 'row', gap: 10 },
  goalCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 8,
    backgroundColor: colors.inputBg,
  },
  goalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  goalSub: { fontSize: 11, color: colors.textMuted },

  primaryBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOpacity: 0.38,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtnError: { shadowOpacity: 0 },
  btnGradient: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.3 },

  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: colors.textSecondary },
  switchLink: { fontSize: 14, fontWeight: '700', color: colors.primary },

  legal: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
});

const getAuthErrStyle = (colors: ThemeColors) => StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error + '1A',
    borderRadius: 12,
    padding: 14,
  },
  text: { flex: 1, fontSize: 13, color: colors.error, lineHeight: 18 },
});
