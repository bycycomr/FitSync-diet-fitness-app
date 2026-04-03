/**
 * Material Design 3 Token Sistemi
 * FitSync brandingi ile entegre renk, tipografi, boşluk ve radius token'ları
 */

// ============================================================================
// RENK TOKEN'LARI (Material Design 3)
// ============================================================================

export const lightTheme = {
  colors: {
    // Temel renkler (Primary / Secondary / Tertiary)
    primary: '#4CAF82',
    primaryDark: '#388E5E',
    primaryContainer: '#C8E6C9',
    secondary: '#5C6BC0',
    secondaryContainer: '#C5CAE9',
    tertiary: '#FF7043',
    tertiaryContainer: '#FFD7CF',

    // Surface ve arka plan
    surface: '#FFFBFE',
    surfaceDim: '#F5F6FA',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F5F6FA',
    surfaceContainer: '#F0F0F0',
    surfaceContainerHigh: '#E8E8E8',
    surfaceContainerHighest: '#E0E0E0',

    background: '#FFFBFE',
    cardBackground: '#FFFFFF',

    // Text / On Surface
    onSurface: '#1A1A2E',
    onSurfaceVariant: '#9E9E9E',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1B5E20',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1A237E',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#5D1F08',

    // Error / Warning / Info
    error: '#B3261E',
    errorContainer: '#F9DEDC',
    onError: '#FFFFFF',
    onErrorContainer: '#410E0B',

    warning: '#FF7043',
    warningContainer: '#FFD7CF',

    info: '#29B6F6',
    infoContainer: '#B3E5FC',

    // Sohbet özelleştirilmiş
    chatUserBubble: '#4CAF82',
    chatBotBubble: '#F5F6FA',
    chatUserText: '#FFFFFF',
    chatBotText: '#1A1A2E',

    // Workout özel
    workoutColor: '#5C6BC0',

    // Makro nütrisyonlar
    proteinColor: '#5C6BC0',
    carbColor: '#FF7043',
    fatColor: '#FFB300',

    // Skeleton / Loading
    skeletonBg: '#E0E0E0',

    // Border ve focus
    border: '#F0F0F0',
    borderFocus: '#4CAF82',
    inputBg: '#F7F8FA',

    // Alias / Legacy uyumluluk
    text: '#1A1A2E',
    textSecondary: '#9E9E9E',
    textMuted: '#BDBDBD',
    white: '#FFFFFF',
  },

  typography: {
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400',
      letterSpacing: -0.25,
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400',
      letterSpacing: 0,
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400',
      letterSpacing: 0,
    },

    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400',
      letterSpacing: 0,
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400',
      letterSpacing: 0,
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400',
      letterSpacing: 0,
    },

    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '500',
      letterSpacing: 0,
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500',
      letterSpacing: 0.15,
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },

    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400',
      letterSpacing: 0.5,
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      letterSpacing: 0.25,
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      letterSpacing: 0.4,
    },

    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500',
      letterSpacing: 0.5,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 28,
    full: 9999,
  },
};

// Dark mode (Material Design 3 dark palette)
export const darkTheme = {
  colors: {
    // Temel renkler (açık versiyon)
    primary: '#A8D5BA',
    primaryDark: '#2E7D32',
    primaryContainer: '#2D6A4F',
    secondary: '#C5CAE9',
    secondaryContainer: '#37474F',
    tertiary: '#FFB4A1',
    tertiaryContainer: '#5D1F08',

    // Surface ve arka plan
    surface: '#121212',
    surfaceDim: '#121212',
    surfaceBright: '#3A3A3C',
    surfaceContainerLowest: '#0F0F0F',
    surfaceContainerLow: '#1A1A1A',
    surfaceContainer: '#1E1E1E',
    surfaceContainerHigh: '#282828',
    surfaceContainerHighest: '#323232',

    background: '#121212',
    cardBackground: '#1E1E1E',

    // Text / On Surface
    onSurface: '#E0E0E0',
    onSurfaceVariant: '#9E9E9E',
    onPrimary: '#1B5E20',
    onPrimaryContainer: '#A8D5BA',
    onSecondary: '#1A237E',
    onSecondaryContainer: '#C5CAE9',
    onTertiary: '#5D1F08',
    onTertiaryContainer: '#FFB4A1',

    // Error / Warning / Info
    error: '#E53935',
    errorContainer: '#5D1F08',
    onError: '#FFFFFF',
    onErrorContainer: '#FFB4A1',

    warning: '#FF8A65',
    warningContainer: '#D7A300',

    info: '#4FC3F7',
    infoContainer: '#01579B',

    // Sohbet özelleştirilmiş
    chatUserBubble: '#2D6A4F',
    chatBotBubble: '#1E1E1E',
    chatUserText: '#FFFFFF',
    chatBotText: '#E0E0E0',

    // Workout özel
    workoutColor: '#7986CB',

    // Makro nütrisyonlar
    proteinColor: '#7986CB',
    carbColor: '#FF8A65',
    fatColor: '#FFD54F',

    // Skeleton / Loading
    skeletonBg: '#333333',

    // Border ve focus
    border: '#333333',
    borderFocus: '#388E5E',
    inputBg: '#2A2A2A',

    // Alias / Legacy uyumluluk
    text: '#E0E0E0',
    textSecondary: '#9E9E9E',
    textMuted: '#757575',
    white: '#FFFFFF',
  },

  typography: lightTheme.typography,
  spacing: lightTheme.spacing,
  radius: lightTheme.radius,
};

export type ThemeType = typeof lightTheme;
export type ThemeColorType = typeof lightTheme.colors;
export type ThemeTypographyType = typeof lightTheme.typography;
