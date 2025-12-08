/**
 * UserAvatar Component
 * 使用者頭像（支援 fallback）
 */

import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'
import { Text } from '../ui/Text'

interface UserAvatarProps {
  uri: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  testID?: string
}

export function UserAvatar({ uri, name, size = 'md', testID }: UserAvatarProps) {
  const { theme } = useTheme()

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { width: 32, height: 32, fontSize: 12 }
      case 'lg':
        return { width: 56, height: 56, fontSize: 20 }
      case 'md':
      default:
        return { width: 40, height: 40, fontSize: 16 }
    }
  }

  const sizeStyles = getSizeStyles()
  const initial = name?.charAt(0)?.toUpperCase() || '?'

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.avatar,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            borderRadius: sizeStyles.width / 2,
            backgroundColor: theme.tokens.colors.muted,
          },
        ]}
        testID={testID}
        accessibilityLabel={`${name} 的頭像`}
      />
    )
  }

  return (
    <View
      style={[
        styles.avatar,
        styles.fallback,
        {
          width: sizeStyles.width,
          height: sizeStyles.height,
          borderRadius: sizeStyles.width / 2,
          backgroundColor: theme.tokens.colors.primary,
        },
      ]}
      testID={testID}
      accessibilityLabel={`${name} 的頭像`}
    >
      <Text
        weight="bold"
        style={{
          color: theme.tokens.colors.primaryForeground,
          fontSize: sizeStyles.fontSize,
        }}
      >
        {initial}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatar: {
    overflow: 'hidden',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
