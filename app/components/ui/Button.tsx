/**
 * Button Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * shadcn-inspired button with variants, sizes, and Reanimated animations.
 */

import React, { useCallback } from 'react'
import { Pressable, ActivityIndicator, StyleSheet, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../theme/useTheme'
import type { ButtonProps } from '../../types/theme'
import { Text } from './Text'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  onPress,
  disabled = false,
  loading = false,
  icon,
  children,
  variant = 'default',
  size = 'md',
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  testID,
  style,
}: ButtonProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  // Animation on press
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    })
    opacity.value = withTiming(0.8, { duration: theme.tokens.animation.duration.fast })
  }, [scale, opacity, theme])

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    })
    opacity.value = withTiming(1, { duration: theme.tokens.animation.duration.fast })
  }, [scale, opacity, theme])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  // Determine colors based on variant
  const getVariantStyles = () => {
    const { colors } = theme.tokens

    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          borderWidth: 1,
          textColor: colors.foreground,
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
          textColor: colors.foreground,
        }
      case 'destructive':
        return {
          backgroundColor: colors.error,
          borderColor: colors.error,
          borderWidth: 0,
          textColor: '#ffffff',
        }
      case 'default':
      default:
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 0,
          textColor: colors.primaryForeground,
        }
    }
  }

  // Determine size styles
  const getSizeStyles = () => {
    const { spacing, typography } = theme.tokens

    switch (size) {
      case 'sm':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          fontSize: typography.fontSize.sm,
          minHeight: 32,
        }
      case 'lg':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          fontSize: typography.fontSize.lg,
          minHeight: 56,
        }
      case 'md':
      default:
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          fontSize: typography.fontSize.base,
          minHeight: 44,
        }
    }
  }

  const variantStyles = getVariantStyles()
  const sizeStyles = getSizeStyles()
  const isDisabled = disabled || loading

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : onPress}
      onPressIn={isDisabled ? undefined : handlePressIn}
      onPressOut={isDisabled ? undefined : handlePressOut}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          borderRadius: theme.tokens.borderRadius.md,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          minHeight: sizeStyles.minHeight,
          opacity: isDisabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={variantStyles.textColor} />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text
              weight="medium"
              style={[
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
                icon && styles.textWithIcon,
              ]}
            >
              {children}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  textWithIcon: {
    marginLeft: 4,
  },
})
