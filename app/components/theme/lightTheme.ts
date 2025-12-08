/**
 * Light Theme Configuration
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Light theme implementation following shadcn design principles
 * and React Native Paper Material Design 3 integration.
 */

import { MD3LightTheme } from 'react-native-paper'
import type { ThemeConfiguration, DesignTokens } from '../../types/theme'
import { spacing, typography, borderRadius, shadows, animation } from '../../constants/Design'

// ============================================================================
// Light Color Tokens
// ============================================================================

const lightColors = {
  // Primary Colors
  primary: '#3b82f6', // blue-500
  primaryForeground: '#ffffff',

  // Secondary Colors
  secondary: '#64748b', // slate-500
  secondaryForeground: '#ffffff',

  // Semantic Colors
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500

  // Neutral Colors
  background: '#ffffff',
  foreground: '#0a0a0a',
  card: '#f8f9fa',
  cardForeground: '#0a0a0a',
  muted: '#f1f3f5',
  mutedForeground: '#6b7280',

  // UI Elements
  border: '#e5e7eb',
  input: '#ffffff',
  ring: '#3b82f6',

  // Navigation
  tabBarActive: '#3b82f6',
  tabBarInactive: '#6b7280',
  tabBarBackground: '#ffffff',
}

// ============================================================================
// Light Theme Design Tokens
// ============================================================================

const lightTokens: DesignTokens = {
  colors: lightColors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animation,
}

// ============================================================================
// React Native Paper Theme Integration
// ============================================================================

const lightPaperTheme = {
  ...MD3LightTheme,
  dark: false,
  colors: {
    ...MD3LightTheme.colors,
    // Map shadcn colors to Material Design 3
    primary: lightColors.primary,
    onPrimary: lightColors.primaryForeground,
    primaryContainer: lightColors.primary,
    secondary: lightColors.secondary,
    onSecondary: lightColors.secondaryForeground,
    background: lightColors.background,
    onBackground: lightColors.foreground,
    surface: lightColors.card,
    onSurface: lightColors.cardForeground,
    error: lightColors.error,
    outline: lightColors.border,
  },
  fonts: {
    ...MD3LightTheme.fonts,
    regular: { fontFamily: typography.fontFamily.regular },
    medium: { fontFamily: typography.fontFamily.medium },
    bold: { fontFamily: typography.fontFamily.bold },
  },
  roundness: borderRadius.md,
}

// ============================================================================
// Complete Light Theme Configuration
// ============================================================================

export const lightTheme: ThemeConfiguration = {
  mode: 'light',
  tokens: lightTokens,
  paperTheme: lightPaperTheme,
}
