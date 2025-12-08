/**
 * Input Component
 * Feature: Modern Mobile App UI Redesign with shadcn
 * Date: 2025-11-09
 *
 * Modern input field with error states, icons, and multiline support
 */

import React, { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { useTheme } from '../theme/useTheme'

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerStyle?: ViewStyle
  testID?: string
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  testID = 'input-container',
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme()
  const [isFocused, setIsFocused] = useState(false)

  const hasError = Boolean(error)

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.tokens.colors.foreground,
              fontFamily: theme.tokens.typography.fontFamily.medium,
              fontSize: theme.tokens.typography.fontSize.sm,
              marginBottom: theme.tokens.spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.tokens.colors.input,
            borderColor: hasError
              ? theme.tokens.colors.destructive
              : isFocused
              ? theme.tokens.colors.primary
              : theme.tokens.colors.border,
            borderWidth: 1,
            borderRadius: theme.tokens.borderRadius.md,
            paddingHorizontal: theme.tokens.spacing.sm,
            paddingVertical: theme.tokens.spacing.sm,
          },
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.tokens.colors.foreground,
              fontFamily: theme.tokens.typography.fontFamily.regular,
              fontSize: theme.tokens.typography.fontSize.base,
            },
            textInputProps.multiline && styles.multilineInput,
          ]}
          placeholderTextColor={theme.tokens.colors.mutedForeground}
          onFocus={(e) => {
            setIsFocused(true)
            textInputProps.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            textInputProps.onBlur?.(e)
          }}
          {...textInputProps}
        />

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {hasError && (
        <Text
          style={[
            styles.errorText,
            {
              color: theme.tokens.colors.destructive,
              fontFamily: theme.tokens.typography.fontFamily.regular,
              fontSize: theme.tokens.typography.fontSize.xs,
              marginTop: theme.tokens.spacing.xs,
            },
          ]}
          testID="input-error"
        >
          {error}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 0, // Remove default padding for consistent height
    textAlignVertical: 'top',
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 8,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontWeight: '400',
  },
})
