/**
 * Text Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Typography component integrated with design tokens.
 */

import React from 'react'
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'

export interface TextProps extends RNTextProps {
  /** Typography variant */
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'label'

  /** Font weight */
  weight?: 'normal' | 'medium' | 'bold'

  /** Text color variant */
  color?: 'default' | 'muted' | 'primary' | 'error' | 'success' | 'warning'

  /** Children content */
  children?: React.ReactNode
}

export function Text({
  variant = 'body',
  weight = 'normal',
  color = 'default',
  style,
  children,
  ...rest
}: TextProps) {
  const { theme } = useTheme()
  const { typography, colors } = theme.tokens

  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'heading':
        return {
          fontSize: typography.fontSize.xxl,
          lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
          fontWeight: typography.fontWeight.bold,
        }
      case 'subheading':
        return {
          fontSize: typography.fontSize.xl,
          lineHeight: typography.fontSize.xl * typography.lineHeight.tight,
          fontWeight: typography.fontWeight.medium,
        }
      case 'caption':
        return {
          fontSize: typography.fontSize.sm,
          lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
          fontWeight: typography.fontWeight.normal,
        }
      case 'label':
        return {
          fontSize: typography.fontSize.sm,
          lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
          fontWeight: typography.fontWeight.medium,
        }
      case 'body':
      default:
        return {
          fontSize: typography.fontSize.base,
          lineHeight: typography.fontSize.base * typography.lineHeight.normal,
          fontWeight: typography.fontWeight.normal,
        }
    }
  }

  // Get weight styles (can override variant)
  const getWeightStyles = () => {
    switch (weight) {
      case 'medium':
        return { fontWeight: typography.fontWeight.medium }
      case 'bold':
        return { fontWeight: typography.fontWeight.bold }
      case 'normal':
      default:
        return { fontWeight: typography.fontWeight.normal }
    }
  }

  // Get color styles
  const getColorStyles = () => {
    switch (color) {
      case 'muted':
        return { color: colors.mutedForeground }
      case 'primary':
        return { color: colors.primary }
      case 'error':
        return { color: colors.error }
      case 'success':
        return { color: colors.success }
      case 'warning':
        return { color: colors.warning }
      case 'default':
      default:
        return { color: colors.foreground }
    }
  }

  const variantStyles = getVariantStyles()
  const weightStyles = getWeightStyles()
  const colorStyles = getColorStyles()

  return (
    <RNText
      style={[
        styles.text,
        {
          fontFamily: typography.fontFamily.regular,
          ...variantStyles,
          ...weightStyles,
          ...colorStyles,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  )
}

const styles = StyleSheet.create({
  text: {
    // Base styles
  },
})
