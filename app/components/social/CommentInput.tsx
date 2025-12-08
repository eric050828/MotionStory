/**
 * CommentInput Component
 * 留言輸入框
 */

import React, { useState, useCallback } from 'react'
import { View, TextInput, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '../theme/useTheme'
import { Text } from '../ui/Text'

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>
  placeholder?: string
  disabled?: boolean
  testID?: string
}

export function CommentInput({
  onSubmit,
  placeholder = '寫留言...',
  disabled = false,
  testID,
}: CommentInputProps) {
  const { theme } = useTheme()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    const trimmedContent = content.trim()
    if (!trimmedContent || submitting) return

    if (trimmedContent.length > 200) {
      setError('留言不能超過 200 字')
      return
    }

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit(trimmedContent)
      setContent('')
    } catch (err: any) {
      setError(err.message || '發送失敗，請稍後再試')
    } finally {
      setSubmitting(false)
    }
  }, [content, submitting, onSubmit])

  const canSubmit = content.trim().length > 0 && !submitting && !disabled

  return (
    <View style={styles.container} testID={testID}>
      {error && (
        <Text variant="caption" color="error" style={styles.error}>
          {error}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.tokens.colors.muted,
            borderRadius: theme.tokens.borderRadius.lg,
          },
        ]}
      >
        <TextInput
          value={content}
          onChangeText={(text) => {
            setContent(text)
            if (error) setError(null)
          }}
          placeholder={placeholder}
          placeholderTextColor={theme.tokens.colors.mutedForeground}
          style={[
            styles.input,
            {
              color: theme.tokens.colors.foreground,
              fontFamily: theme.tokens.typography.fontFamily.regular,
              fontSize: theme.tokens.typography.fontSize.base,
            },
          ]}
          multiline
          maxLength={200}
          editable={!disabled && !submitting}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          blurOnSubmit
          testID={`${testID}-input`}
        />
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.sendButton,
            {
              backgroundColor: canSubmit
                ? theme.tokens.colors.primary
                : theme.tokens.colors.muted,
              borderRadius: theme.tokens.borderRadius.md,
            },
          ]}
          accessibilityLabel="發送留言"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          testID={`${testID}-submit`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.tokens.colors.primaryForeground} />
          ) : (
            <Text
              style={{
                color: canSubmit
                  ? theme.tokens.colors.primaryForeground
                  : theme.tokens.colors.mutedForeground,
                fontSize: 16,
              }}
            >
              發送
            </Text>
          )}
        </Pressable>
      </View>
      <Text
        variant="caption"
        color="muted"
        style={styles.charCount}
      >
        {content.length}/200
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  error: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
})
