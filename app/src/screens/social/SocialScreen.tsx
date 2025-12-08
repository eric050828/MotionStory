/**
 * Social Screen
 * 社群動態牆頁面 - Instagram 風格設計
 * 顯示好友動態與互動功能
 * 支援淺色/深色主題切換
 */

import React, { useEffect, useCallback } from 'react'
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, Pressable } from 'react-native'
import { useNavigation, NavigationProp } from '@react-navigation/native'
import { YStack, XStack, H2, Text } from 'tamagui'
import { Users, Sun, Moon } from '@tamagui/lucide-icons'
import { useSocialStore } from '../../store/socialStore'
import { ActivityCard } from '../../../components/social/ActivityCard'
import { useTheme } from '../../../components/theme/useTheme'
import type { Activity as ActivityType } from '../../types/social'

type SocialStackParamList = {
  Social: undefined
  ActivityDetail: { activity: ActivityType }
}

export default function SocialScreen() {
  const navigation = useNavigation<NavigationProp<SocialStackParamList>>()
  const { theme, themeMode, toggleTheme } = useTheme()
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

  // Handle like toggle
  const handleLike = useCallback((activityId: string) => {
    toggleLike(activityId)
  }, [toggleLike])

  // Handle comment press - navigate to detail
  const handleCommentPress = useCallback((activity: ActivityType) => {
    navigation.navigate('ActivityDetail', { activity })
  }, [navigation])

  // Render activity item using new ActivityCard
  const renderActivityItem = useCallback(({ item }: { item: ActivityType }) => {
    return (
      <ActivityCard
        activity={item}
        onLike={() => handleLike(item.activity_id)}
        onCommentPress={() => handleCommentPress(item)}
        testID={`activity-card-${item.activity_id}`}
      />
    )
  }, [handleLike, handleCommentPress])

  // Empty component
  const renderEmpty = () => {
    if (feedLoading) return null
    return (
      <YStack alignItems="center" justifyContent="center" padding="$6">
        <Users size={48} color={theme.tokens.colors.mutedForeground} />
        <Text color={theme.tokens.colors.mutedForeground} marginTop="$3">還沒有動態</Text>
        <Text color={theme.tokens.colors.mutedForeground} fontSize="$2">開始運動來分享你的成果吧！</Text>
      </YStack>
    )
  }

  // Footer component
  const renderFooter = () => {
    if (!feedLoading || activities.length === 0) return null
    return (
      <YStack alignItems="center" padding="$4">
        <ActivityIndicator size="small" color={theme.tokens.colors.primary} />
      </YStack>
    )
  }

  return (
    <YStack flex={1} backgroundColor={theme.tokens.colors.background}>
      {/* Header */}
      <XStack
        paddingTop={60}
        paddingBottom="$3"
        paddingHorizontal="$4"
        backgroundColor={theme.tokens.colors.background}
        borderBottomWidth={1}
        borderBottomColor={theme.tokens.colors.border}
        alignItems="center"
        justifyContent="space-between"
      >
        <H2 color={theme.tokens.colors.foreground}>社群動態</H2>
        {/* Theme Toggle Button */}
        <Pressable
          onPress={toggleTheme}
          style={[
            styles.themeButton,
            { backgroundColor: theme.tokens.colors.muted }
          ]}
          accessibilityLabel={themeMode === 'dark' ? '切換為淺色主題' : '切換為深色主題'}
          accessibilityRole="button"
        >
          {themeMode === 'dark' ? (
            <Sun size={20} color={theme.tokens.colors.foreground} />
          ) : (
            <Moon size={20} color={theme.tokens.colors.foreground} />
          )}
        </Pressable>
      </XStack>

      {/* Error State */}
      {feedError && (
        <YStack padding="$4" alignItems="center">
          <Text color={theme.tokens.colors.error}>{feedError}</Text>
        </YStack>
      )}

      {/* Loading State */}
      {feedLoading && activities.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator size="large" color={theme.tokens.colors.primary} />
          <Text color={theme.tokens.colors.mutedForeground} marginTop="$3">載入中...</Text>
        </YStack>
      ) : (
        /* Activity Feed */
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.activity_id}
          contentContainerStyle={[
            styles.listContent,
            { backgroundColor: theme.tokens.colors.background }
          ]}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={feedLoading && activities.length > 0}
              onRefresh={handleRefresh}
              tintColor={theme.tokens.colors.primary}
              colors={[theme.tokens.colors.primary]}
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
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
