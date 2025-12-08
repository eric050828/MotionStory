/**
 * ActivityTypeIcon Component
 * 動態類型圖示（workout/achievement/challenge）
 * 使用 Lucide 圖示取代 emoji
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'
import { Activity, Trophy, Target, FileText } from '@tamagui/lucide-icons'
import type { ActivityType } from '../../src/types/social'

interface ActivityTypeIconProps {
  type: ActivityType
  size?: 'sm' | 'md' | 'lg'
  showBackground?: boolean
  testID?: string
}

export function ActivityTypeIcon({
  type,
  size = 'md',
  showBackground = true,
  testID,
}: ActivityTypeIconProps) {
  const { theme } = useTheme()

  const getTypeConfig = () => {
    switch (type) {
      case 'workout':
        return {
          Icon: Activity,
          label: '運動',
          color: theme.tokens.colors.primary,
          backgroundColor: theme.tokens.colors.primary + '20',
        }
      case 'achievement':
        return {
          Icon: Trophy,
          label: '成就',
          color: theme.tokens.colors.warning,
          backgroundColor: theme.tokens.colors.warning + '20',
        }
      case 'challenge':
        return {
          Icon: Target,
          label: '挑戰',
          color: theme.tokens.colors.success,
          backgroundColor: theme.tokens.colors.success + '20',
        }
      default:
        return {
          Icon: FileText,
          label: '動態',
          color: theme.tokens.colors.mutedForeground,
          backgroundColor: theme.tokens.colors.muted,
        }
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { container: 24, iconSize: 14 }
      case 'lg':
        return { container: 48, iconSize: 28 }
      case 'md':
      default:
        return { container: 32, iconSize: 18 }
    }
  }

  const config = getTypeConfig()
  const sizeStyles = getSizeStyles()
  const IconComponent = config.Icon

  return (
    <View
      style={[
        styles.container,
        showBackground && {
          backgroundColor: config.backgroundColor,
          width: sizeStyles.container,
          height: sizeStyles.container,
          borderRadius: sizeStyles.container / 2,
        },
      ]}
      testID={testID}
      accessibilityLabel={config.label}
    >
      <IconComponent size={sizeStyles.iconSize} color={config.color} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
