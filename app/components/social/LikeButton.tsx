/**
 * LikeButton Component
 * 按讚按鈕（心形圖示 + 數字 + 動畫）
 * 使用 Lucide 圖示取代 emoji
 */

import React, { useCallback } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated'
import { Heart } from '@tamagui/lucide-icons'
import { useTheme } from '../theme/useTheme'
import { Text } from '../ui/Text'

interface LikeButtonProps {
  isLiked: boolean
  likesCount: number
  onPress: () => void
  disabled?: boolean
  testID?: string
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function LikeButton({
  isLiked,
  likesCount,
  onPress,
  disabled = false,
  testID,
}: LikeButtonProps) {
  const { theme } = useTheme()
  const scale = useSharedValue(1)

  const handlePress = useCallback(() => {
    // Animation
    scale.value = withSequence(
      withSpring(1.3, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    )

    onPress()
  }, [onPress, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const heartColor = isLiked
    ? theme.tokens.colors.error
    : theme.tokens.colors.mutedForeground

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        {
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      accessibilityLabel={isLiked ? '取消按讚' : '按讚'}
      accessibilityRole="button"
      accessibilityState={{ selected: isLiked }}
      testID={testID}
    >
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Heart
          size={20}
          color={heartColor}
          fill={isLiked ? heartColor : 'transparent'}
        />
      </Animated.View>
      <Text
        variant="caption"
        weight="medium"
        style={{
          color: isLiked
            ? theme.tokens.colors.error
            : theme.tokens.colors.mutedForeground,
          marginLeft: 4,
        }}
      >
        {likesCount > 0 ? likesCount : ''}
      </Text>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iconContainer: {
    // Animation container
  },
})
