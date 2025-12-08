/**
 * Activity Detail Screen
 * 動態詳情頁 - 完整動態卡片 + 完整留言區
 */

import React, { useEffect, useMemo } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useTheme } from '../../../components/theme/useTheme'
import { Text } from '../../../components/ui/Text'
import { Card } from '../../../components/ui/Card'
import { UserAvatar } from '../../../components/social/UserAvatar'
import { ActivityTypeIcon } from '../../../components/social/ActivityTypeIcon'
import { LikeButton } from '../../../components/social/LikeButton'
import { CommentSection } from '../../../components/social/CommentSection'
import { useSocialStore } from '../../../src/store/socialStore'
import { socialService } from '../../../src/services/socialService'
import type { WorkoutContent, AchievementContent, ChallengeContent } from '../../../src/types/social'

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const router = useRouter()

  const { activities, toggleLike, fetchComments } = useSocialStore()

  // Find the activity
  const activity = useMemo(
    () => activities.find((a) => a.activity_id === id),
    [activities, id]
  )

  // Fetch comments on mount
  useEffect(() => {
    if (id) {
      fetchComments(id)
    }
  }, [id, fetchComments])

  // Render activity content based on type
  const renderActivityContent = () => {
    if (!activity) return null

    const { activity_type, content } = activity

    switch (activity_type) {
      case 'workout': {
        const workoutContent = content as WorkoutContent
        return (
          <View style={styles.contentBox}>
            <Text variant="subheading" weight="medium">
              {workoutContent.workout_type || '運動'}
            </Text>
            <View style={styles.statsGrid}>
              {workoutContent.duration_minutes && (
                <View style={styles.statBox}>
                  <Text style={{ fontSize: 24 }}>⏱️</Text>
                  <Text variant="heading" weight="bold">
                    {workoutContent.duration_minutes}
                  </Text>
                  <Text variant="caption" color="muted">
                    分鐘
                  </Text>
                </View>
              )}
              {workoutContent.distance_km && (
                <View style={styles.statBox}>
                  <Text style={{ fontSize: 24 }}>📏</Text>
                  <Text variant="heading" weight="bold">
                    {workoutContent.distance_km}
                  </Text>
                  <Text variant="caption" color="muted">
                    公里
                  </Text>
                </View>
              )}
              {workoutContent.calories && (
                <View style={styles.statBox}>
                  <Text style={{ fontSize: 24 }}>🔥</Text>
                  <Text variant="heading" weight="bold">
                    {workoutContent.calories}
                  </Text>
                  <Text variant="caption" color="muted">
                    大卡
                  </Text>
                </View>
              )}
            </View>
          </View>
        )
      }

      case 'achievement': {
        const achievementContent = content as AchievementContent
        return (
          <View style={[styles.contentBox, styles.achievementBox]}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🏆</Text>
            <Text variant="subheading" weight="bold">
              {achievementContent.title || '新成就'}
            </Text>
            {achievementContent.description && (
              <Text variant="body" color="muted" style={{ textAlign: 'center', marginTop: 8 }}>
                {achievementContent.description}
              </Text>
            )}
          </View>
        )
      }

      case 'challenge': {
        const challengeContent = content as ChallengeContent
        const progress = challengeContent.goal
          ? Math.round((challengeContent.progress / challengeContent.goal) * 100)
          : 100
        return (
          <View style={styles.contentBox}>
            <Text variant="subheading" weight="medium">
              🎯 {challengeContent.challenge_name || '挑戰完成'}
            </Text>
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: theme.tokens.colors.muted,
                    borderRadius: theme.tokens.borderRadius.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progress}%`,
                      backgroundColor: theme.tokens.colors.success,
                      borderRadius: theme.tokens.borderRadius.md,
                    },
                  ]}
                />
              </View>
              <Text variant="body" weight="bold">
                {progress}%
              </Text>
            </View>
            <Text variant="caption" color="muted" style={{ marginTop: 8 }}>
              {challengeContent.progress} / {challengeContent.goal}
            </Text>
          </View>
        )
      }

      default:
        return null
    }
  }

  // Not found state
  if (!activity) {
    return (
      <View
        style={[
          styles.container,
          styles.centered,
          { backgroundColor: theme.tokens.colors.background },
        ]}
      >
        <Stack.Screen options={{ title: '動態' }} />
        <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
        <Text variant="body" color="muted">
          找不到這則動態
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text variant="body" color="primary">
            返回
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.tokens.colors.background },
      ]}
    >
      <Stack.Screen
        options={{
          title: `${activity.user_name} 的動態`,
          headerStyle: {
            backgroundColor: theme.tokens.colors.card,
          },
          headerTintColor: theme.tokens.colors.foreground,
        }}
      />

      {/* Activity Card (Top) */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card elevation="sm" style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <UserAvatar
              uri={activity.user_avatar}
              name={activity.user_name}
              size="lg"
            />
            <View style={styles.headerInfo}>
              <View style={styles.headerRow}>
                <Text variant="body" weight="bold">
                  {activity.user_name}
                </Text>
                <ActivityTypeIcon type={activity.activity_type} size="sm" />
              </View>
              <Text variant="caption" color="muted">
                {socialService.getActivityTypeLabel(activity.activity_type)} ·{' '}
                {socialService.formatRelativeTime(activity.created_at)}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>{renderActivityContent()}</View>

          {/* Actions */}
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
              onPress={() => toggleLike(activity.activity_id)}
            />
            <View style={styles.commentCount}>
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text variant="caption" color="muted" style={{ marginLeft: 4 }}>
                {activity.comments_count} 則留言
              </Text>
            </View>
          </View>
        </Card>

        {/* Comments Section Header */}
        <View style={styles.commentsHeader}>
          <Text variant="body" weight="medium">
            留言
          </Text>
        </View>
      </ScrollView>

      {/* Comments Section (Bottom) */}
      <View style={styles.commentsContainer}>
        <CommentSection
          activityId={activity.activity_id}
          testID="activity-comments"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 0,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 0,
  },
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    marginTop: 16,
  },
  contentBox: {
    gap: 8,
  },
  achievementBox: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statBox: {
    alignItems: 'center',
    gap: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    gap: 24,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsHeader: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  commentsContainer: {
    flex: 1,
  },
})
