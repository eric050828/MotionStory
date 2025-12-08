/**
 * ActivityCard Component
 * 精美社群動態卡片 - Instagram 風格設計
 * 支援全幅圖片、短文、運動數據展示
 * 使用 Lucide 圖示取代 emoji
 */

import React from 'react'
import { View, Pressable, StyleSheet, Image, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Activity,
  Bike,
  Waves,
  Flower2,
  Dumbbell,
  Mountain,
  Trophy,
  Timer,
  Route,
  Flame,
  MessageCircle,
} from '@tamagui/lucide-icons'
import { useTheme } from '../theme/useTheme'
import { Card } from '../ui/Card'
import { Text } from '../ui/Text'
import { UserAvatar } from './UserAvatar'
import { ActivityTypeIcon } from './ActivityTypeIcon'
import { LikeButton } from './LikeButton'
import { socialService } from '../../src/services/socialService'
import type { Activity as ActivityData, Comment, WorkoutContent, AchievementContent, ChallengeContent } from '../../src/types/social'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IMAGE_HEIGHT = 280

interface ActivityCardProps {
  activity: ActivityData
  comments?: Comment[]
  onLike: () => void
  onCommentPress: () => void
  testID?: string
}

// 運動類型對應的 Lucide 圖示組件
const workoutIcons: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  running: Activity,
  cycling: Bike,
  swimming: Waves,
  yoga: Flower2,
  gym: Dumbbell,
  hiking: Mountain,
}

export function ActivityCard({
  activity,
  comments = [],
  onLike,
  onCommentPress,
  testID,
}: ActivityCardProps) {
  const { theme } = useTheme()
  const router = useRouter()

  const handleCardPress = () => {
    router.push(`/social/activity/${activity.activity_id}`)
  }

  // 取得運動統計
  const getWorkoutStats = () => {
    if (activity.activity_type !== 'workout') return null
    const content = activity.content as WorkoutContent
    return {
      type: content.workout_type || '運動',
      duration: content.duration_minutes,
      distance: content.distance_km,
      calories: content.calories,
    }
  }

  // 取得成就資訊
  const getAchievementInfo = () => {
    if (activity.activity_type !== 'achievement') return null
    const content = activity.content as AchievementContent
    return {
      title: content.title || '新成就',
      description: content.description,
    }
  }

  // 取得運動類型對應的圖示組件
  const getWorkoutIcon = (type: string) => {
    return workoutIcons[type] || Activity
  }

  const stats = getWorkoutStats()
  const achievement = getAchievementInfo()
  const previewComments = comments.slice(0, 2)
  const hasMoreComments = activity.comments_count > 2

  // 取得運動類型的圖示
  const WorkoutIcon = stats ? getWorkoutIcon(stats.type) : Activity

  return (
    <Card
      elevation="md"
      style={styles.card}
      testID={testID}
    >
      {/* 用戶資訊 Header */}
      <View style={styles.header}>
        <Pressable onPress={handleCardPress} style={styles.headerLeft}>
          <UserAvatar
            uri={activity.user_avatar}
            name={activity.user_name}
            size="md"
          />
          <View style={styles.headerInfo}>
            <Text variant="body" weight="semibold">
              {activity.user_name}
            </Text>
            <Text variant="caption" color="muted">
              {socialService.formatRelativeTime(activity.created_at)}
            </Text>
          </View>
        </Pressable>
        <ActivityTypeIcon type={activity.activity_type} size="sm" showBackground />
      </View>

      {/* 圖片區域 */}
      {activity.image_url ? (
        <Pressable onPress={handleCardPress}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: activity.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
            {/* 漸層遮罩 - 底部運動數據 */}
            {stats && (
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageOverlay}
              >
                <View style={styles.statsOverlay}>
                  <View style={styles.workoutTypeRow}>
                    <WorkoutIcon size={18} color="#fff" />
                    <Text style={styles.workoutType}>{stats.type}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    {stats.duration && (
                      <View style={styles.statBadge}>
                        <Text style={styles.statValue}>{stats.duration}</Text>
                        <Text style={styles.statLabel}>分鐘</Text>
                      </View>
                    )}
                    {stats.distance && (
                      <View style={styles.statBadge}>
                        <Text style={styles.statValue}>{stats.distance.toFixed(1)}</Text>
                        <Text style={styles.statLabel}>公里</Text>
                      </View>
                    )}
                    {stats.calories && (
                      <View style={styles.statBadge}>
                        <Text style={styles.statValue}>{stats.calories}</Text>
                        <Text style={styles.statLabel}>大卡</Text>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            )}
            {/* 成就徽章 */}
            {achievement && (
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.imageOverlay}
              >
                <View style={styles.achievementOverlay}>
                  <Trophy size={40} color="#FFD700" />
                  <Text style={styles.achievementTitle}>{achievement.title}</Text>
                </View>
              </LinearGradient>
            )}
          </View>
        </Pressable>
      ) : (
        // 無圖片時的備用顯示
        <Pressable onPress={handleCardPress} style={[styles.noImageContainer, { backgroundColor: theme.tokens.colors.muted + '20' }]}>
          {stats && (
            <View style={styles.noImageStats}>
              <WorkoutIcon size={48} color={theme.tokens.colors.primary} />
              <Text style={[styles.noImageType, { color: theme.tokens.colors.foreground }]}>{stats.type}</Text>
              <View style={styles.noImageStatsRow}>
                {stats.duration && (
                  <View style={styles.noImageStatItem}>
                    <Timer size={16} color={theme.tokens.colors.mutedForeground} />
                    <Text style={[styles.noImageStat, { color: theme.tokens.colors.mutedForeground }]}>
                      {stats.duration} 分鐘
                    </Text>
                  </View>
                )}
                {stats.distance && (
                  <View style={styles.noImageStatItem}>
                    <Route size={16} color={theme.tokens.colors.mutedForeground} />
                    <Text style={[styles.noImageStat, { color: theme.tokens.colors.mutedForeground }]}>
                      {stats.distance.toFixed(1)} 公里
                    </Text>
                  </View>
                )}
                {stats.calories && (
                  <View style={styles.noImageStatItem}>
                    <Flame size={16} color={theme.tokens.colors.mutedForeground} />
                    <Text style={[styles.noImageStat, { color: theme.tokens.colors.mutedForeground }]}>
                      {stats.calories} 大卡
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          {achievement && (
            <View style={styles.noImageAchievement}>
              <Trophy size={48} color={theme.tokens.colors.warning} />
              <Text style={[styles.noImageType, { color: theme.tokens.colors.foreground }]}>{achievement.title}</Text>
              {achievement.description && (
                <Text style={[styles.noImageDescription, { color: theme.tokens.colors.mutedForeground }]}>
                  {achievement.description}
                </Text>
              )}
            </View>
          )}
        </Pressable>
      )}

      {/* 短文/心得 */}
      {activity.caption && (
        <View style={styles.captionContainer}>
          <Text variant="body" style={styles.caption}>
            <Text weight="semibold">{activity.user_name}</Text>
            {'  '}
            {activity.caption}
          </Text>
        </View>
      )}

      {/* 按讚與留言按鈕 */}
      <View
        style={[
          styles.actions,
          {
            borderTopWidth: 1,
            borderTopColor: theme.tokens.colors.border,
          },
        ]}
      >
        <LikeButton
          isLiked={activity.is_liked_by_me}
          likesCount={activity.likes_count}
          onPress={onLike}
        />
        <Pressable
          onPress={onCommentPress}
          style={styles.commentButton}
          accessibilityLabel="留言"
          accessibilityRole="button"
        >
          <MessageCircle size={20} color={theme.tokens.colors.mutedForeground} />
          {activity.comments_count > 0 && (
            <Text
              variant="body"
              weight="medium"
              color="muted"
              style={{ marginLeft: 6 }}
            >
              {activity.comments_count}
            </Text>
          )}
        </Pressable>
      </View>

      {/* 留言預覽 */}
      {previewComments.length > 0 && (
        <View
          style={[
            styles.commentsPreview,
            {
              borderTopWidth: 1,
              borderTopColor: theme.tokens.colors.border,
            },
          ]}
        >
          {previewComments.map((comment) => (
            <View key={comment.comment_id} style={styles.commentItem}>
              <Text variant="caption" weight="semibold">
                {comment.user_name}
              </Text>
              <Text variant="caption" color="muted" style={styles.commentContent} numberOfLines={2}>
                {comment.content}
              </Text>
            </View>
          ))}
          {hasMoreComments && (
            <Pressable onPress={onCommentPress}>
              <Text variant="caption" color="primary" style={styles.viewMore}>
                查看全部 {activity.comments_count} 則留言
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerInfo: {
    marginLeft: 10,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  statsOverlay: {
    alignItems: 'flex-start',
  },
  workoutTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  workoutType: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBadge: {
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  achievementOverlay: {
    alignItems: 'center',
  },
  achievementTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  // 無圖片時的備用樣式
  noImageContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  noImageStats: {
    alignItems: 'center',
  },
  noImageType: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginTop: 8,
    marginBottom: 12,
  },
  noImageStatsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  noImageStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noImageStat: {
    fontSize: 14,
  },
  noImageAchievement: {
    alignItems: 'center',
  },
  noImageDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  captionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  caption: {
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 20,
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  commentsPreview: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  commentContent: {
    flex: 1,
    marginLeft: 6,
  },
  viewMore: {
    marginTop: 4,
  },
})
