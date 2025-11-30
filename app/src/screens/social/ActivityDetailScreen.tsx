/**
 * Activity Detail Screen
 * 活動詳情頁面 - 顯示完整活動內容與留言區
 */

import React, { useEffect, useState, useCallback } from 'react'
import { View, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native'
import { YStack, XStack, H3, Text, Card, Button, Input, useTheme } from 'tamagui'
import {
  Activity,
  Trophy,
  Target,
  FileText,
  User,
  Heart,
  MessageCircle,
  Send,
  ArrowLeft,
  Clock
} from '@tamagui/lucide-icons'
import { useSocialStore } from '../../store/socialStore'
import type { Activity as ActivityType, Comment } from '../../types/social'

type ActivityDetailRouteParams = {
  ActivityDetail: {
    activity: ActivityType
  }
}

export default function ActivityDetailScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const route = useRoute<RouteProp<ActivityDetailRouteParams, 'ActivityDetail'>>()
  const { activity } = route.params

  const {
    comments,
    commentsLoading,
    fetchComments,
    addComment,
    toggleLike
  } = useSocialStore()

  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [localActivity, setLocalActivity] = useState(activity)

  // Fetch comments on mount
  useEffect(() => {
    fetchComments(activity.activity_id)
  }, [activity.activity_id, fetchComments])

  // Get activity icon
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'workout': return <Activity size={20} color="$blue10" />
      case 'achievement': return <Trophy size={20} color="$yellow10" />
      case 'challenge': return <Target size={20} color="$green10" />
      default: return <FileText size={20} color="$gray10" />
    }
  }

  // Get activity type label
  const getActivityTypeLabel = (activityType: string) => {
    switch (activityType) {
      case 'workout': return '運動紀錄'
      case 'achievement': return '新成就'
      case 'challenge': return '挑戰'
      default: return '動態'
    }
  }

  // Handle like toggle
  const handleLike = useCallback(async () => {
    await toggleLike(activity.activity_id)
    setLocalActivity(prev => ({
      ...prev,
      is_liked_by_me: !prev.is_liked_by_me,
      likes_count: prev.is_liked_by_me ? prev.likes_count - 1 : prev.likes_count + 1
    }))
  }, [activity.activity_id, toggleLike])

  // Handle comment submit
  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || submitting) return

    setSubmitting(true)
    try {
      await addComment(activity.activity_id, newComment.trim())
      setNewComment('')
    } catch (error) {
      console.error('Failed to add comment:', error)
    } finally {
      setSubmitting(false)
    }
  }, [activity.activity_id, newComment, submitting, addComment])

  // Get comments for this activity
  const activityComments = comments[activity.activity_id] || []

  // Render comment item
  const renderComment = ({ item }: { item: Comment }) => (
    <XStack gap="$3" paddingVertical="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
      <View style={[styles.commentAvatar, { backgroundColor: theme.gray5?.val }]}>
        <User size={16} color={theme.gray10?.val} />
      </View>
      <YStack flex={1} gap="$1">
        <XStack alignItems="center" gap="$2">
          <Text fontWeight="bold" fontSize="$3">{item.user_name}</Text>
          <Text fontSize="$2" color="$gray10">
            {new Date(item.created_at).toLocaleDateString('zh-TW')}
          </Text>
        </XStack>
        <Text fontSize="$3">{item.content}</Text>
      </YStack>
    </XStack>
  )

  // Render activity header
  const renderHeader = () => (
    <YStack gap="$4" paddingBottom="$4">
      {/* User Info */}
      <XStack alignItems="center" gap="$3">
        <View style={[styles.avatar, { backgroundColor: theme.gray5?.val }]}>
          <User size={28} color={theme.gray10?.val} />
        </View>
        <YStack flex={1}>
          <Text fontWeight="bold" fontSize="$5">{localActivity.user_name}</Text>
          <XStack alignItems="center" gap="$2">
            {getActivityIcon(localActivity.activity_type)}
            <Text fontSize="$3" color="$gray10">{getActivityTypeLabel(localActivity.activity_type)}</Text>
          </XStack>
        </YStack>
        <XStack alignItems="center" gap="$1">
          <Clock size={14} color="$gray10" />
          <Text fontSize="$2" color="$gray10">
            {new Date(localActivity.created_at).toLocaleDateString('zh-TW')}
          </Text>
        </XStack>
      </XStack>

      {/* Activity Content */}
      <Card backgroundColor="$backgroundHover" padding="$4" borderRadius="$4">
        {localActivity.activity_type === 'workout' && localActivity.content && (
          <YStack gap="$3">
            <Text fontWeight="700" fontSize="$5">
              {(localActivity.content as any).workout_type || '運動'}
            </Text>
            <XStack gap="$6" flexWrap="wrap">
              {(localActivity.content as any).duration_minutes && (
                <YStack alignItems="center">
                  <Text fontSize="$7" fontWeight="bold" color="$blue10">
                    {(localActivity.content as any).duration_minutes}
                  </Text>
                  <Text fontSize="$3" color="$gray10">分鐘</Text>
                </YStack>
              )}
              {(localActivity.content as any).calories && (
                <YStack alignItems="center">
                  <Text fontSize="$7" fontWeight="bold" color="$orange10">
                    {(localActivity.content as any).calories}
                  </Text>
                  <Text fontSize="$3" color="$gray10">大卡</Text>
                </YStack>
              )}
              {(localActivity.content as any).distance_km && (
                <YStack alignItems="center">
                  <Text fontSize="$7" fontWeight="bold" color="$green10">
                    {(localActivity.content as any).distance_km}
                  </Text>
                  <Text fontSize="$3" color="$gray10">公里</Text>
                </YStack>
              )}
            </XStack>
          </YStack>
        )}

        {localActivity.activity_type === 'achievement' && localActivity.content && (
          <YStack alignItems="center" gap="$3">
            <Trophy size={64} color="$yellow10" />
            <Text fontWeight="bold" fontSize="$6">
              {(localActivity.content as any).title || '新成就'}
            </Text>
            {(localActivity.content as any).description && (
              <Text color="$gray10" textAlign="center" fontSize="$4">
                {(localActivity.content as any).description}
              </Text>
            )}
          </YStack>
        )}

        {localActivity.activity_type === 'challenge' && localActivity.content && (
          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Target size={24} color="$green10" />
              <Text fontWeight="bold" fontSize="$5">
                {(localActivity.content as any).title || '挑戰'}
              </Text>
            </XStack>
            {(localActivity.content as any).description && (
              <Text color="$gray10" fontSize="$4">
                {(localActivity.content as any).description}
              </Text>
            )}
          </YStack>
        )}
      </Card>

      {/* Actions */}
      <XStack gap="$6" paddingTop="$2">
        <XStack
          alignItems="center"
          gap="$2"
          onPress={handleLike}
          pressStyle={{ opacity: 0.7 }}
        >
          <Heart
            size={24}
            color={localActivity.is_liked_by_me ? '$red10' : '$gray10'}
            fill={localActivity.is_liked_by_me ? theme.red10?.val : 'transparent'}
          />
          <Text
            fontSize="$4"
            fontWeight="600"
            color={localActivity.is_liked_by_me ? '$red10' : '$gray10'}
          >
            {localActivity.likes_count > 0 ? `${localActivity.likes_count} 個讚` : '讚'}
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <MessageCircle size={24} color="$gray10" />
          <Text fontSize="$4" color="$gray10">
            {activityComments.length > 0 ? `${activityComments.length} 則留言` : '留言'}
          </Text>
        </XStack>
      </XStack>

      {/* Comments Header */}
      <YStack paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
        <Text fontWeight="bold" fontSize="$4">留言</Text>
      </YStack>
    </YStack>
  )

  // Render empty comments
  const renderEmptyComments = () => {
    if (commentsLoading) return null
    return (
      <YStack alignItems="center" padding="$6">
        <MessageCircle size={32} color="$gray8" />
        <Text color="$gray10" marginTop="$2">還沒有留言</Text>
        <Text color="$gray10" fontSize="$2">成為第一個留言的人吧！</Text>
      </YStack>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
        <XStack
          paddingTop={60}
          paddingBottom="$3"
          paddingHorizontal="$4"
          backgroundColor="$background"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          gap="$3"
        >
          <Button
            size="$3"
            circular
            chromeless
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="$color" />
          </Button>
          <H3 flex={1}>動態詳情</H3>
        </XStack>

        {/* Content */}
        <FlatList
          data={activityComments}
          renderItem={renderComment}
          keyExtractor={(item) => item.comment_id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComments}
          ListFooterComponent={
            commentsLoading ? (
              <YStack alignItems="center" padding="$4">
                <ActivityIndicator size="small" />
              </YStack>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />

        {/* Comment Input */}
        <XStack
          padding="$4"
          paddingBottom="$6"
          backgroundColor="$background"
          borderTopWidth={1}
          borderTopColor="$borderColor"
          gap="$3"
          alignItems="center"
        >
          <Input
            flex={1}
            placeholder="寫下你的留言..."
            value={newComment}
            onChangeText={setNewComment}
            disabled={submitting}
          />
          <Button
            size="$4"
            circular
            backgroundColor={newComment.trim() ? '$blue9' : '$gray5'}
            onPress={handleSubmitComment}
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Send size={20} color={newComment.trim() ? 'white' : '$gray10'} />
            )}
          </Button>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
