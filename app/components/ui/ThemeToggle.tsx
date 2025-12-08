/**
 * Theme Toggle Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Three-way toggle for Light / Dark / System theme selection
 * Uses Lucide icons instead of emojis
 */

import React from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { Sun, Moon, Monitor } from '@tamagui/lucide-icons'
import { useTheme } from '../theme/useTheme'
import type { ThemeMode } from '../theme/types'

export interface ThemeToggleProps {
  testID?: string
}

const THEME_OPTIONS: { value: ThemeMode; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { value: 'light', label: '淺色', Icon: Sun },
  { value: 'dark', label: '深色', Icon: Moon },
  { value: 'system', label: '自動', Icon: Monitor },
]

export function ThemeToggle({ testID = 'theme-toggle' }: ThemeToggleProps) {
  const { theme, themeMode, setThemeMode } = useTheme()
  const scale = useSharedValue(1)

  const handlePress = (mode: ThemeMode) => {
    // Haptic feedback
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    // Scale animation
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
    })

    // Update theme
    setThemeMode(mode)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={[styles.container, animatedStyle]} testID={testID}>
      {THEME_OPTIONS.map((option) => {
        const isActive = themeMode === option.value
        const opacity = useSharedValue(isActive ? 1 : 0.6)
        const buttonScale = useSharedValue(isActive ? 1 : 0.95)
        const IconComponent = option.Icon

        React.useEffect(() => {
          opacity.value = withTiming(isActive ? 1 : 0.6, {
            duration: theme.tokens.animation.duration.fast,
          })
          buttonScale.value = withSpring(isActive ? 1 : 0.95, {
            damping: 15,
            stiffness: 300,
          })
        }, [isActive])

        const buttonAnimatedStyle = useAnimatedStyle(() => ({
          opacity: opacity.value,
          transform: [{ scale: buttonScale.value }],
        }))

        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${option.label}主題`}
            testID={`theme-option-${option.value}`}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: isActive
                  ? theme.tokens.colors.primary
                  : theme.tokens.colors.secondary,
                borderColor: theme.tokens.colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Animated.View style={[styles.optionContent, buttonAnimatedStyle]}>
              <IconComponent
                size={24}
                color={isActive
                  ? theme.tokens.colors.primaryForeground
                  : theme.tokens.colors.secondaryForeground
                }
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive
                      ? theme.tokens.colors.primaryForeground
                      : theme.tokens.colors.secondaryForeground,
                    fontFamily: theme.tokens.typography.fontFamily.medium,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Animated.View>
          </Pressable>
        )
      })}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
})
