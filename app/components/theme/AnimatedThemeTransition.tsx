/**
 * Animated Theme Transition Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Provides smooth color interpolation during theme transitions
 */

import React, { useEffect } from 'react'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated'
import type { ViewStyle } from 'react-native'
import { useTheme } from './useTheme'

export interface AnimatedThemeTransitionProps {
  children: React.ReactNode
  style?: ViewStyle
}

/**
 * Wrapper component that animates background color during theme changes
 * Uses color interpolation for smooth transitions
 *
 * @example
 * ```tsx
 * <AnimatedThemeTransition>
 *   <YourComponent />
 * </AnimatedThemeTransition>
 * ```
 */
export function AnimatedThemeTransition({
  children,
  style,
}: AnimatedThemeTransitionProps) {
  const { theme, themeMode } = useTheme()
  const progress = useSharedValue(themeMode === 'dark' ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(themeMode === 'dark' ? 1 : 0, {
      duration: theme.tokens.animation.duration.normal,
    })
  }, [themeMode, theme, progress])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        [
          '#FFFFFF', // light background
          '#09090B', // dark background
        ]
      ),
    }
  })

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

/**
 * Hook for creating custom color interpolation animations
 * Useful for animating specific colors during theme transitions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const animatedColor = useAnimatedThemeColor(
 *     theme.tokens.colors.primary,
 *     theme.tokens.colors.primaryForeground
 *   )
 *
 *   const animatedStyle = useAnimatedStyle(() => ({
 *     color: animatedColor.value
 *   }))
 *
 *   return <Animated.Text style={animatedStyle}>Hello</Animated.Text>
 * }
 * ```
 */
export function useAnimatedThemeColor(lightColor: string, darkColor: string) {
  const { theme, themeMode } = useTheme()
  const progress = useSharedValue(themeMode === 'dark' ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(themeMode === 'dark' ? 1 : 0, {
      duration: theme.tokens.animation.duration.normal,
    })
  }, [themeMode, theme, progress])

  return useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [lightColor, darkColor]),
  }))
}
