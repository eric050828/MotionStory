/**
 * Card Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * shadcn-inspired card with elevation and press interaction.
 */

import React, { useCallback } from 'react'
import { Pressable, View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { useTheme } from '../theme/useTheme'
import type { CardProps } from '../../types/theme'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const AnimatedView = Animated.createAnimatedComponent(View)

export function Card({
  children,
  onPress,
  elevation = 'md',
  variant = 'default',
  size,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
  testID,
  style,
}: CardProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)

  // Animation on press (only if pressable)
  const handlePressIn = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 300,
      })
    }
  }, [scale, onPress])

  const handlePressOut = useCallback(() => {
    if (onPress) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      })
    }
  }, [scale, onPress])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  // Get shadow/elevation styles
  const getElevationStyle = () => {
    const { shadows } = theme.tokens

    switch (elevation) {
      case 'sm':
        return shadows.sm
      case 'lg':
        return shadows.lg
      case 'md':
      default:
        return shadows.md
    }
  }

  // Get variant styles
  const getVariantStyles = () => {
    const { colors } = theme.tokens

    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: colors.border,
          borderWidth: 1,
        }
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          borderWidth: 0,
        }
      case 'default':
      default:
        return {
          backgroundColor: colors.card,
          borderColor: 'transparent',
          borderWidth: 0,
        }
    }
  }

  const elevationStyle = getElevationStyle()
  const variantStyles = getVariantStyles()

  const cardStyle = [
    styles.card,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
      borderRadius: theme.tokens.borderRadius.lg,
      padding: theme.tokens.spacing.md,
      ...elevationStyle,
    },
    animatedStyle,
    style,
  ]

  // If pressable, use AnimatedPressable
  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole || 'button'}
        testID={testID}
        style={cardStyle}
      >
        {children}
      </AnimatedPressable>
    )
  }

  // Otherwise, use AnimatedView
  return (
    <AnimatedView
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      testID={testID}
      style={cardStyle}
    >
      {children}
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
})
