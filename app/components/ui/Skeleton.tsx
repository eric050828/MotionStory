/**
 * Skeleton Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-08
 *
 * Loading skeleton with optional animation.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../theme/useTheme'
import type { SkeletonProps } from '../../types/theme'

export function Skeleton({
  width,
  height,
  borderRadius,
  animated = true,
  variant,
  size,
  accessibilityLabel,
  testID,
  style,
}: SkeletonProps) {
  const { theme } = useTheme()
  const opacity = useSharedValue(1)

  // Pulse animation
  useEffect(() => {
    if (animated) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: theme.tokens.animation.duration.slow }),
          withTiming(1, { duration: theme.tokens.animation.duration.slow })
        ),
        -1, // infinite repeat
        false
      )
    }
  }, [animated, opacity, theme])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const skeletonBorderRadius = borderRadius !== undefined
    ? borderRadius
    : theme.tokens.borderRadius.md

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel || 'Loading content'}
      accessibilityRole="none"
      testID={testID}
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: skeletonBorderRadius,
          backgroundColor: theme.tokens.colors.muted,
        },
        animated && animatedStyle,
        style,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
})
