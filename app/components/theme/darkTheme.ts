/**
 * Dark Theme Configuration
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Dark theme implementation following shadcn design principles
 * and React Native Paper Material Design 3 integration.
 */

import { MD3DarkTheme } from 'react-native-paper'
import type { ThemeConfiguration, DesignTokens } from '../../types/theme'
import { spacing, typography, borderRadius, shadows, animation } from '../../constants/Design'

// ============================================================================
// Dark Color Tokens
// ============================================================================

const darkColors = {
  // Primary Colors
  primary: '#60a5fa', // blue-400
  primaryForeground: '#0a0a0a',

  // Secondary Colors
  secondary: '#94a3b8', // slate-400
  secondaryForeground: '#0a0a0a',

  // Semantic Colors
  success: '#34d399', // green-400
  warning: '#fbbf24', // amber-400
  error: '#f87171', // red-400
  info: '#60a5fa', // blue-400

  // Neutral Colors
  background: '#0a0a0a',
  foreground: '#f8f9fa',
  card: '#18181b',
  cardForeground: '#f8f9fa',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',

  // UI Elements
  border: '#3f3f46',
  input: '#18181b',
  ring: '#60a5fa',

  // Navigation
  tabBarActive: '#60a5fa',
  tabBarInactive: '#a1a1aa',
  tabBarBackground: '#0a0a0a',
}

// ============================================================================
// Dark Theme Design Tokens
// ============================================================================

const darkTokens: DesignTokens = {
  colors: darkColors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animation,
}

// ============================================================================
// React Native Paper Theme Integration
// ============================================================================

const darkPaperTheme = {
  ...MD3DarkTheme,
  dark: true,
  colors: {
    ...MD3DarkTheme.colors,
    // Map shadcn colors to Material Design 3
    primary: darkColors.primary,
    onPrimary: darkColors.primaryForeground,
    primaryContainer: darkColors.primary,
    secondary: darkColors.secondary,
    onSecondary: darkColors.secondaryForeground,
    background: darkColors.background,
    onBackground: darkColors.foreground,
    surface: darkColors.card,
    onSurface: darkColors.cardForeground,
    error: darkColors.error,
    outline: darkColors.border,
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    regular: { fontFamily: typography.fontFamily.regular },
    medium: { fontFamily: typography.fontFamily.medium },
    bold: { fontFamily: typography.fontFamily.bold },
  },
  roundness: borderRadius.md,
}

// ============================================================================
// Complete Dark Theme Configuration
// ============================================================================

export const darkTheme: ThemeConfiguration = {
  mode: 'dark',
  tokens: darkTokens,
  paperTheme: darkPaperTheme,
}
