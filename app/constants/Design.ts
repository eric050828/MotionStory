/**
 * Design Tokens: shadcn-inspired Design System
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Base design tokens for the application design system.
 * These tokens are platform-agnostic and used by theme configurations.
 */

import type {
  SpacingTokens,
  TypographyTokens,
  BorderRadiusTokens,
  ShadowTokens,
  AnimationTokens,
} from '../types/theme'

// ============================================================================
// Spacing Tokens (4dp grid system)
// ============================================================================

export const spacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

// ============================================================================
// Typography Tokens
// ============================================================================

export const typography: TypographyTokens = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    bold: '700',
  },
}

// ============================================================================
// Border Radius Tokens
// ============================================================================

export const borderRadius: BorderRadiusTokens = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
}

// ============================================================================
// Shadow Tokens
// ============================================================================

export const shadows: ShadowTokens = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
}

// ============================================================================
// Animation Tokens
// ============================================================================

export const animation: AnimationTokens = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: [0.4, 0, 1, 1],
    easeOut: [0, 0, 0.2, 1],
    easeInOut: [0.4, 0, 0.2, 1],
  },
}

// ============================================================================
// Exports
// ============================================================================

export const Design = {
  spacing,
  typography,
  borderRadius,
  shadows,
  animation,
} as const
