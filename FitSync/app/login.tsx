import React, { useState, useRef, useEffect } from 'react';
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
import { loginUser } from '@/services/authService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

// Renkler useTheme() hook'undan alınır

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
}

function Field({
  label, value, onChange, placeholder, icon,
  error, secureEntry, keyboardType = 'default', autoCapitalize = 'none',
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
    borderWidth: borderAnim.value === 1 || !!error ? 1.5 : 1.5,
  }));

  const onFocus = () => {
    setFocused(true);
    borderAnim.value = withTiming(1, { duration: 180 });
  };
  const onBlur = () => {
    setFocused(false);
    borderAnim.value = withTiming(0, { duration: 180 });
  };

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
          onFocus={onFocus}
          onBlur={onBlur}
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
      {!!error && <Text style={fStyles.error}>{error}</Text>}
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
});

export default function LoginScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Fade-in on mount
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    translateY.value = withSpring(0, { damping: 20, stiffness: 120 });
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const emailError = submitted && !validateEmail(email) ? 'Geçerli bir e-posta girin' : '';
  const passwordError = submitted && password.length < 6 ? 'En az 6 karakter olmalı' : '';
  const canSubmit = validateEmail(email) && password.length >= 6;

  const handleLogin = async () => {
    setSubmitted(true);
    setAuthError('');
    if (!canSubmit) return;
    setLoading(true);
    try {
      await loginUser(email, password);
      // Başarılı giriş — _layout.tsx'teki onAuthStateChanged yönlendirmeyi yapacak
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setAuthError('E-posta veya şifre hatalı.');
      } else if (code === 'auth/too-many-requests') {
        setAuthError('Çok fazla deneme. Lütfen daha sonra tekrar dene.');
      } else {
        setAuthError('Giriş yapılamadı. Bağlantını kontrol et.');
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
              <Ionicons name="fitness" size={38} color="#FFF" />
            </LinearGradient>
            <Text style={styles.appName}>FitSync</Text>
            <Text style={styles.tagline}>Sağlıklı yaşama hoş geldin</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.card, animStyle]}>
            <Text style={styles.cardTitle}>Giriş Yap</Text>

            <Field
              label="E-posta"
              value={email}
              onChange={setEmail}
              placeholder="ornek@email.com"
              icon="mail-outline"
              keyboardType="email-address"
              error={emailError}
            />

            <Field
              label="Şifre"
              value={password}
              onChange={setPassword}
              placeholder="Şifrenizi girin"
              icon="lock-closed-outline"
              secureEntry
              error={passwordError}
            />

            {!!authError && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorBoxText}>{authError}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Şifremi unuttum</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, (!canSubmit && submitted) && styles.primaryBtnError]}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchText}>Hesabın yok mu?</Text>
              <Link href="/register" asChild>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.switchLink}> Kayıt Ol</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>

          <Text style={styles.legal}>
            Devam ederek Gizlilik Politikası ve Kullanım Koşullarını kabul etmiş olursun.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, gap: 28, justifyContent: 'center' },

  hero: { alignItems: 'center', gap: 12 },
  logoGradient: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 10,
  },
  appName: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
  tagline: { fontSize: 14, color: colors.textSecondary, letterSpacing: 0.1 },

  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 28,
    padding: 28,
    gap: 18,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    elevation: 5,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: -6 },
  forgotText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  primaryBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.38,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
    marginTop: 4,
  },
  primaryBtnError: { backgroundColor: colors.textMuted, shadowOpacity: 0 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF', letterSpacing: 0.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 13, color: colors.textMuted },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  switchText: { fontSize: 14, color: colors.textSecondary },
  switchLink: { fontSize: 14, fontWeight: '700', color: colors.primary },

  legal: { fontSize: 11, color: colors.textMuted, textAlign: 'center', lineHeight: 16 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.error + '1A',
    borderRadius: 10,
    padding: 12,
  },
  errorBoxText: { flex: 1, fontSize: 13, color: colors.error, lineHeight: 18 },
});
