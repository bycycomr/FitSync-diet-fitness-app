import { useColorScheme } from 'react-native';
import { useUserStore } from '@/store/userStore';
import { lightTheme, darkTheme } from '@/constants/theme';

export type ThemeColors = typeof lightTheme.colors;

/**
 * useTheme Hook
 * Sistem görünümünü algılar ve Zustand themeMode ile kombinler
 * Material Design 3 token'larını döndürür
 */
export function useTheme() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeMode = useUserStore((s) => s.themeMode);

  const activeMode = themeMode === 'system' ? systemTheme : themeMode;
  const theme = activeMode === 'dark' ? darkTheme : lightTheme;

  return {
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    radius: theme.radius,
    activeMode,
  };
}
