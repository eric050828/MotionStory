/**
 * ActivityFeed Component
 * 動態牆列表 - Pull-to-refresh + Infinite scroll
 */

import React, { useCallback, useEffect } from 'react'
import { View, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'
import { Text } from '../ui/Text'
import { ActivityCard } from './ActivityCard'
import { useSocialStore } from '../../src/store/socialStore'
import type { Activity } from '../../src/types/social'

interface ActivityFeedProps {
  onActivityPress?: (activity: Activity) => void
  testID?: string
}

export function ActivityFeed({ onActivityPress, testID }: ActivityFeedProps) {
  const { theme } = useTheme()
  const {
    activities,
    comments,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    fetchFeed,
    loadMoreFeed,
    toggleLike,
    fetchComments,
  } = useSocialStore()

  // Initial load
  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchFeed(true)
  }, [fetchFeed])

  // Load more handler
  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore) {
      loadMoreFeed()
    }
  }, [hasMore, loadingMore, loadMoreFeed])

  // Comment press handler - fetch comments if not loaded
  const handleCommentPress = useCallback(
    (activity: Activity) => {
      if (!comments[activity.activity_id]) {
        fetchComments(activity.activity_id)
      }
      if (onActivityPress) {
        onActivityPress(activity)
      }
    },
    [comments, fetchComments, onActivityPress]
  )

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: Activity }) => (
      <ActivityCard
        activity={item}
        comments={comments[item.activity_id] || []}
        onLike={() => toggleLike(item.activity_id)}
        onCommentPress={() => handleCommentPress(item)}
        testID={`activity-card-${item.activity_id}`}
      />
    ),
    [comments, toggleLike, handleCommentPress]
  )

  // Key extractor
  const keyExtractor = useCallback((item: Activity) => item.activity_id, [])

  // Footer component (loading more indicator)
  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.tokens.colors.primary} />
      </View>
    )
  }

  // Empty component
  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.empty}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
        <Text variant="subheading" weight="medium">
          還沒有動態
        </Text>
        <Text variant="caption" color="muted" style={styles.emptyText}>
          當你的好友分享運動、成就或挑戰時，會顯示在這裡
        </Text>
      </View>
    )
  }

  // Error state
  if (error && activities.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
        <Text variant="body" color="error">
          {error}
        </Text>
        <Text
          variant="body"
          color="primary"
          style={styles.retryText}
          onPress={() => fetchFeed()}
        >
          點擊重試
        </Text>
      </View>
    )
  }

  // Loading state
  if (loading && activities.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.tokens.colors.primary} />
        <Text variant="caption" color="muted" style={{ marginTop: 12 }}>
          載入中...
        </Text>
      </View>
    )
  }

  return (
    <FlatList
      data={activities}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={[
        styles.list,
        activities.length === 0 && styles.emptyList,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.tokens.colors.primary}
          colors={[theme.tokens.colors.primary]}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      showsVerticalScrollIndicator={false}
      testID={testID}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  retryText: {
    marginTop: 16,
  },
})
