import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { User } from 'firebase/auth';

import { useTheme } from '@/hooks/useTheme';
import { subscribeToAuthState } from '@/services/authService';
import { fetchUserProfile, fetchWeeklyCompletions } from '@/services/userService';
import { useUserStore } from '@/store/userStore';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {
  // expo-keep-awake Expo Go'da başlatılamayabilir; uygulamayı bloklamaz
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { activeMode } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const storeHeight = useUserStore((s) => s.height);

  // Firebase Auth durumunu dinle
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) setProfileLoaded(true); // giriş yok — yüklemeye gerek yok
    });
    return unsubscribe;
  }, []);

  // Kullanıcı girişi yapınca profili Firestore'dan yükle + son 5 günü çek
  useEffect(() => {
    if (!user) return;
    const loadUserData = async () => {
      try {
        await fetchUserProfile(user.uid);
        // Son 5 günün istatistiklerini çek (konuşma hafızası için)
        const weeklyStats = await fetchWeeklyCompletions(user.uid);
        const setLast5DaysStats = useUserStore.getState().setLast5DaysStats;
        setLast5DaysStats(weeklyStats.slice(0, 5)); // Son 5 gün
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
      } finally {
        setProfileLoaded(true);
      }
    };
    loadUserData();
  }, [user?.uid]);

  // Auth + profil durumuna göre yönlendirme
  useEffect(() => {
    if (user === undefined || !profileLoaded) return;

    const inAuthGroup     = segments[0] === 'login' || segments[0] === 'register';
    const inOnboarding    = segments[0] === 'onboarding';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Yeni kullanıcı veya eksik profil → onboarding
      if (storeHeight === null || storeHeight === undefined) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else if (user && storeHeight !== null && storeHeight !== undefined && inOnboarding) {
      // Profil zaten dolu iken onboarding'e gelme — ana sayfaya at
      router.replace('/(tabs)');
    }
  }, [user, segments, profileLoaded, storeHeight]);

  return (
    <ThemeProvider value={activeMode === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="login"      options={{ headerShown: false }} />
        <Stack.Screen name="register"   options={{ headerShown: false }} />
        <Stack.Screen name="modal"      options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
