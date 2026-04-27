/**
 * FitSync Design System — Material Design 3 Token Sistemi
 * Modern minimal purple palette (tokens.js kaynaklı)
 * Primary: #7C4DFF (deep purple) | Secondary: #4CAF82 (brand green)
 */

// ============================================================================
// RENK TOKEN'LARI
// ============================================================================

export const lightTheme = {
  colors: {
    // Temel renkler — Primary (purple)
    primary: '#7C4DFF',
    primaryDark: '#512DB8',
    primarySoft: '#B39DDB',
    primaryContainer: '#EDE7FF',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#21005D',

    // Secondary — Fitness green
    secondary: '#4CAF82',
    secondaryDark: '#388E5E',
    secondaryContainer: '#C8E6C9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1B5E20',

    // Tertiary — Warm orange
    tertiary: '#FF7043',
    tertiaryContainer: '#FFD7CF',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#5D1F08',

    // Surface ve arka plan
    surface: '#F7F5FF',
    surfaceDim: '#EDE8F8',
    surfaceBright: '#FFFFFF',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F4F0FF',
    surfaceContainer: '#EDE8F8',
    surfaceContainerHigh: '#E5DFFF',
    surfaceContainerHighest: '#DDD6FF',

    background: '#F7F5FF',
    cardBackground: '#FFFFFF',

    // Text / On Surface
    onSurface: '#1A1A2E',
    onSurfaceVariant: '#8B7BAB',

    // Error
    error: '#E53935',
    errorContainer: '#FFF0F0',
    onError: '#FFFFFF',
    onErrorContainer: '#E53935',

    warning: '#FF7043',
    warningContainer: '#FFD7CF',

    info: '#29B6F6',
    infoContainer: '#B3E5FC',

    // Sohbet özelleştirilmiş
    chatUserBubble: '#7C4DFF',
    chatBotBubble: '#FFFFFF',
    chatUserText: '#FFFFFF',
    chatBotText: '#1A1A2E',

    // Workout özel
    workoutColor: '#4CAF82',

    // Makro nütrisyonlar
    proteinColor: '#7C4DFF',
    carbColor: '#FF7043',
    fatColor: '#FFB300',

    // Skeleton / Loading
    skeletonBg: '#EDE8F8',

    // Border ve focus
    border: '#EDE8F8',
    borderFocus: '#7C4DFF',
    inputBg: '#F7F5FF',

    // Alias / Legacy uyumluluk
    text: '#1A1A2E',
    textSecondary: '#8B7BAB',
    textMuted: '#C4B8DC',
    white: '#FFFFFF',
  },

  typography: {
    fontFamily: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      semiBold: 'Poppins-SemiBold',
      bold: 'Poppins-Bold',
      extraBold: 'Poppins-ExtraBold',
      black: 'Poppins-Black',
      light: 'Poppins-Light',
      thin: 'Poppins-Thin',
      italic: 'Poppins-Italic',
    },
    displayLarge: {
      fontSize: 57,
      lineHeight: 64,
      fontWeight: '400' as const,
      letterSpacing: -0.25,
      fontFamily: 'Poppins-Regular',
    },
    displayMedium: {
      fontSize: 45,
      lineHeight: 52,
      fontWeight: '400' as const,
      letterSpacing: 0,
      fontFamily: 'Poppins-Regular',
    },
    displaySmall: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '400' as const,
      letterSpacing: 0,
      fontFamily: 'Poppins-Regular',
    },

    headlineLarge: {
      fontSize: 32,
      lineHeight: 40,
      fontWeight: '400' as const,
      letterSpacing: 0,
      fontFamily: 'Poppins-Regular',
    },
    headlineMedium: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '400' as const,
      letterSpacing: 0,
      fontFamily: 'Poppins-Regular',
    },
    headlineSmall: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '400' as const,
      letterSpacing: 0,
      fontFamily: 'Poppins-Regular',
    },

    titleLarge: {
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '500' as const,
      letterSpacing: 0,
      fontFamily: 'Poppins-Medium',
    },
    titleMedium: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '500' as const,
      letterSpacing: 0.15,
      fontFamily: 'Poppins-Medium',
    },
    titleSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      fontFamily: 'Poppins-Medium',
    },

    bodyLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      letterSpacing: 0.5,
      fontFamily: 'Poppins-Regular',
    },
    bodyMedium: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: 0.25,
      fontFamily: 'Poppins-Regular',
    },
    bodySmall: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
      fontFamily: 'Poppins-Regular',
    },

    labelLarge: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      fontFamily: 'Poppins-Medium',
    },
    labelMedium: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      fontFamily: 'Poppins-Medium',
    },
    labelSmall: {
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      fontFamily: 'Poppins-Medium',
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
    xl: 20,
    card: 18,
    full: 9999,
  },
};

// ── Dark Mode ─────────────────────────────────────────────────────────────────
export const darkTheme = {
  colors: {
    // Primary (light purple for dark bg)
    primary: '#B39DDB',
    primaryDark: '#7C4DFF',
    primarySoft: '#7C4DFF',
    primaryContainer: '#3D2B6E',
    onPrimary: '#21005D',
    onPrimaryContainer: '#EDE7FF',

    // Secondary — green remains
    secondary: '#81C784',
    secondaryDark: '#4CAF82',
    secondaryContainer: '#2D6A4F',
    onSecondary: '#1B5E20',
    onSecondaryContainer: '#C8E6C9',

    // Tertiary
    tertiary: '#FFB4A1',
    tertiaryContainer: '#5D1F08',
    onTertiary: '#5D1F08',
    onTertiaryContainer: '#FFB4A1',

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

    // Error
    error: '#E53935',
    errorContainer: '#5D1F08',
    onError: '#FFFFFF',
    onErrorContainer: '#FFB4A1',

    warning: '#FF8A65',
    warningContainer: '#D7A300',

    info: '#4FC3F7',
    infoContainer: '#01579B',

    // Sohbet özelleştirilmiş
    chatUserBubble: '#3D2B6E',
    chatBotBubble: '#1E1E1E',
    chatUserText: '#FFFFFF',
    chatBotText: '#E0E0E0',

    // Workout özel
    workoutColor: '#81C784',

    // Makro nütrisyonlar
    proteinColor: '#B39DDB',
    carbColor: '#FF8A65',
    fatColor: '#FFD54F',

    // Skeleton / Loading
    skeletonBg: '#333333',

    // Border ve focus
    border: '#333333',
    borderFocus: '#7C4DFF',
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
export type ThemeColors = typeof lightTheme.colors;
export type ThemeTypographyType = typeof lightTheme.typography;
