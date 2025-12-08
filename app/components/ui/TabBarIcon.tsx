/**
 * TabBarIcon Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Custom tab bar icon with focused state and Reanimated scale animation.
 */

import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useTheme } from '../theme/useTheme'

export interface TabBarIconProps {
  /** Icon element (emoji or icon component) */
  icon: React.ReactNode

  /** Whether this tab is currently focused */
  focused: boolean

  /** Accessibility label */
  accessibilityLabel?: string

  /** Test ID for testing */
  testID?: string
}

export function TabBarIcon({
  icon,
  focused,
  accessibilityLabel,
  testID,
}: TabBarIconProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(focused ? 1 : 0.9)
  const opacity = useSharedValue(focused ? 1 : 0.6)

  // Animate on focus change
  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.9, {
      damping: 15,
      stiffness: 300,
    })
    opacity.value = withTiming(focused ? 1 : 0.6, {
      duration: theme.tokens.animation.duration.fast,
    })
  }, [focused, scale, opacity, theme])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      testID={testID}
      style={[styles.container, animatedStyle]}
    >
      {icon}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
})
