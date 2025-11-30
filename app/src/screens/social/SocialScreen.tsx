/**
 * Social Screen
 * 社群動態牆頁面 - 顯示好友動態與互動功能
 */

import React, { useEffect, useCallback } from 'react'
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { YStack, XStack, H2, Text, Card, useTheme } from 'tamagui'
import { useSocialStore } from '../../store/socialStore'
import type { Activity } from '../../types/social'

export default function SocialScreen() {
  const theme = useTheme()
  const navigation = useNavigation()
  const {
    activities,
    feedLoading,
    feedError,
    fetchFeed,
    refreshFeed,
    loadMoreFeed,
    hasMoreFeed,
    toggleLike
  } = useSocialStore()

  // Fetch feed on mount
  useEffect(() => {
    if (activities.length === 0) {
      fetchFeed()
    }
  }, [activities.length, fetchFeed])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refreshFeed()
  }, [refreshFeed])

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasMoreFeed && !feedLoading) {
      loadMoreFeed()
    }
  }, [hasMoreFeed, feedLoading, loadMoreFeed])

  // Render activity item
  const renderActivityItem = useCallback(({ item }: { item: Activity }) => {
    const getActivityIcon = () => {
      switch (item.activity_type) {
        case 'workout': return '🏃'
        case 'achievement': return '🏆'
        case 'challenge': return '🎯'
        default: return '📝'
      }
    }

    return (
      <Card
        elevate
        bordered
        marginBottom="$3"
        padding="$4"
        backgroundColor="$background"
      >
        {/* Header */}
        <XStack alignItems="center" gap="$3" marginBottom="$3">
          <View style={[styles.avatar, { backgroundColor: theme.gray5?.val }]}>
            <Text fontSize={20}>👤</Text>
          </View>
          <YStack flex={1}>
            <XStack alignItems="center" gap="$2">
              <Text fontWeight="bold">{item.user_name}</Text>
              <Text fontSize={16}>{getActivityIcon()}</Text>
            </XStack>
            <Text fontSize="$2" color="$gray10">
              {new Date(item.created_at).toLocaleDateString('zh-TW')}
            </Text>
          </YStack>
        </XStack>

        {/* Content based on type */}
        {item.activity_type === 'workout' && item.content && (
          <YStack gap="$2" marginBottom="$3">
            <Text fontWeight="600">{(item.content as any).workout_type || '運動'}</Text>
            <XStack gap="$4">
              {(item.content as any).duration_minutes && (
                <YStack alignItems="center">
                  <Text fontSize="$5" fontWeight="bold">{(item.content as any).duration_minutes}</Text>
                  <Text fontSize="$2" color="$gray10">分鐘</Text>
                </YStack>
              )}
              {(item.content as any).calories && (
                <YStack alignItems="center">
                  <Text fontSize="$5" fontWeight="bold">{(item.content as any).calories}</Text>
                  <Text fontSize="$2" color="$gray10">大卡</Text>
                </YStack>
              )}
            </XStack>
          </YStack>
        )}

        {item.activity_type === 'achievement' && item.content && (
          <YStack alignItems="center" padding="$3" marginBottom="$3">
            <Text fontSize={40}>🏆</Text>
            <Text fontWeight="bold" marginTop="$2">{(item.content as any).title || '新成就'}</Text>
            {(item.content as any).description && (
              <Text color="$gray10" textAlign="center" marginTop="$1">
                {(item.content as any).description}
              </Text>
            )}
          </YStack>
        )}

        {/* Actions */}
        <XStack gap="$4" paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor">
          <XStack
            alignItems="center"
            gap="$2"
            onPress={() => toggleLike(item.activity_id)}
            pressStyle={{ opacity: 0.7 }}
          >
            <Text fontSize={18}>{item.is_liked_by_me ? '❤️' : '🤍'}</Text>
            <Text color={item.is_liked_by_me ? '$red10' : '$gray10'}>
              {item.likes_count > 0 ? item.likes_count : ''}
            </Text>
          </XStack>
          <XStack alignItems="center" gap="$2">
            <Text fontSize={18}>💬</Text>
            <Text color="$gray10">{item.comments_count > 0 ? item.comments_count : ''}</Text>
          </XStack>
        </XStack>
      </Card>
    )
  }, [theme, toggleLike])

  // Empty component
  const renderEmpty = () => {
    if (feedLoading) return null
    return (
      <YStack alignItems="center" justifyContent="center" padding="$6">
        <Text fontSize={48} marginBottom="$3">👥</Text>
        <Text color="$gray10">還沒有動態</Text>
        <Text color="$gray10" fontSize="$2">開始運動來分享你的成果吧！</Text>
      </YStack>
    )
  }

  // Footer component
  const renderFooter = () => {
    if (!feedLoading || activities.length === 0) return null
    return (
      <YStack alignItems="center" padding="$4">
        <ActivityIndicator size="small" />
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <YStack
        paddingTop={60}
        paddingBottom="$3"
        paddingHorizontal="$4"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <H2>社群動態</H2>
      </YStack>

      {/* Error State */}
      {feedError && (
        <YStack padding="$4" alignItems="center">
          <Text color="$red10">{feedError}</Text>
        </YStack>
      )}

      {/* Loading State */}
      {feedLoading && activities.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" />
          <Text color="$gray10" marginTop="$3">載入中...</Text>
        </YStack>
      ) : (
        /* Activity Feed */
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.activity_id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={feedLoading && activities.length > 0}
              onRefresh={handleRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </YStack>
  )
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
