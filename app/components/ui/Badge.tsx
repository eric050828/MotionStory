/**
 * Badge Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Badge for displaying status, labels, and tags with variant support
 */

import React from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { useTheme } from '../theme/useTheme'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'
export type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  style?: ViewStyle
  testID?: string
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  style,
  testID = 'badge',
}: BadgeProps) {
  const { theme } = useTheme()

  // Get variant-specific colors
  const getVariantColors = () => {
    switch (variant) {
      case 'success':
        return {
          background: theme.tokens.colors.success,
          foreground: '#FFFFFF',
        }
      case 'warning':
        return {
          background: theme.tokens.colors.warning,
          foreground: '#000000',
        }
      case 'destructive':
        return {
          background: theme.tokens.colors.destructive,
          foreground: '#FFFFFF',
        }
      case 'info':
        return {
          background: theme.tokens.colors.info,
          foreground: '#FFFFFF',
        }
      case 'outline':
        return {
          background: 'transparent',
          foreground: theme.tokens.colors.foreground,
        }
      case 'default':
      default:
        return {
          background: theme.tokens.colors.primary,
          foreground: theme.tokens.colors.primaryForeground,
        }
    }
  }

  // Get size-specific styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.tokens.spacing.xs,
          paddingVertical: 2,
          fontSize: theme.tokens.typography.fontSize.xs,
          borderRadius: theme.tokens.borderRadius.sm,
        }
      case 'lg':
        return {
          paddingHorizontal: theme.tokens.spacing.md,
          paddingVertical: theme.tokens.spacing.xs,
          fontSize: theme.tokens.typography.fontSize.base,
          borderRadius: theme.tokens.borderRadius.md,
        }
      case 'md':
      default:
        return {
          paddingHorizontal: theme.tokens.spacing.sm,
          paddingVertical: 4,
          fontSize: theme.tokens.typography.fontSize.sm,
          borderRadius: theme.tokens.borderRadius.sm,
        }
    }
  }

  const colors = getVariantColors()
  const sizeStyles = getSizeStyles()

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.background,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: variant === 'outline' ? theme.tokens.colors.border : 'transparent',
        },
        style,
      ]}
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={typeof children === 'string' ? children : undefined}
    >
      <Text
        style={[
          styles.text,
          {
            color: colors.foreground,
            fontFamily: theme.tokens.typography.fontFamily.medium,
            fontSize: sizeStyles.fontSize,
          },
        ]}
        testID={`${testID}-text`}
      >
        {children}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
})
