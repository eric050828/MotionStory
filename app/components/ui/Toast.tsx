/**
 * Toast Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Toast notification with success/warning/error/info types and auto-dismiss
 */

import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { useTheme } from '../theme/useTheme'

export type ToastType = 'success' | 'error' | 'warning' | 'info'
export type ToastPosition = 'top' | 'bottom'

export interface ToastProps {
  visible: boolean
  message: string
  title?: string
  type?: ToastType
  duration?: number // 0 means no auto-dismiss
  onDismiss?: () => void
  dismissible?: boolean
  position?: ToastPosition
  testID?: string
}

export function Toast({
  visible,
  message,
  title,
  type = 'info',
  duration = 3000,
  onDismiss,
  dismissible = true,
  position = 'top',
  testID = 'toast',
}: ToastProps) {
  const { theme } = useTheme()
  const translateY = useSharedValue(position === 'top' ? -100 : 100)
  const opacity = useSharedValue(0)

  // Auto-dismiss timer
  useEffect(() => {
    if (visible && duration > 0 && onDismiss) {
      const timer = setTimeout(() => {
        onDismiss()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, duration, onDismiss])

  // Animation
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 300,
      })
      opacity.value = withTiming(1, {
        duration: theme.tokens.animation.duration.fast,
      })
    } else {
      translateY.value = withTiming(position === 'top' ? -100 : 100, {
        duration: theme.tokens.animation.duration.fast,
      })
      opacity.value = withTiming(0, {
        duration: theme.tokens.animation.duration.fast,
      })
    }
  }, [visible, position, translateY, opacity, theme])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  // Get type-specific colors
  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return {
          background: theme.tokens.colors.success,
          foreground: '#FFFFFF',
          icon: '✓',
        }
      case 'error':
        return {
          background: theme.tokens.colors.destructive,
          foreground: '#FFFFFF',
          icon: '✕',
        }
      case 'warning':
        return {
          background: theme.tokens.colors.warning,
          foreground: '#000000',
          icon: '⚠',
        }
      case 'info':
      default:
        return {
          background: theme.tokens.colors.info,
          foreground: '#FFFFFF',
          icon: 'ℹ',
        }
    }
  }

  const colors = getTypeColors()

  if (!visible) {
    return null
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.positionTop : styles.positionBottom,
        animatedStyle,
      ]}
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
    >
      <View
        style={[
          styles.toast,
          {
            backgroundColor: colors.background,
            borderRadius: theme.tokens.borderRadius.md,
            padding: theme.tokens.spacing.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={[styles.icon, { color: colors.foreground }]}>
              {colors.icon}
            </Text>
          </View>

          <View style={styles.textContainer}>
            {title && (
              <Text
                style={[
                  styles.title,
                  {
                    color: colors.foreground,
                    fontFamily: theme.tokens.typography.fontFamily.medium,
                    fontSize: theme.tokens.typography.fontSize.base,
                    marginBottom: title && message ? 4 : 0,
                  },
                ]}
                testID="toast-title"
              >
                {title}
              </Text>
            )}

            <Text
              style={[
                styles.message,
                {
                  color: colors.foreground,
                  fontFamily: theme.tokens.typography.fontFamily.regular,
                  fontSize: theme.tokens.typography.fontSize.sm,
                },
              ]}
            >
              {message}
            </Text>
          </View>

          {dismissible && (
            <Pressable
              onPress={() => onDismiss?.()}
              style={styles.dismissButton}
              testID="toast-dismiss-button"
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
            >
              <Text style={[styles.dismissIcon, { color: colors.foreground }]}>
                ✕
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  positionTop: {
    top: Platform.OS === 'ios' ? 60 : 40,
  },
  positionBottom: {
    bottom: Platform.OS === 'ios' ? 60 : 40,
  },
  toast: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
  },
  message: {
    fontWeight: '400',
  },
  dismissButton: {
    marginLeft: 12,
    padding: 4,
  },
  dismissIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
})
