/**
 * CommentSection Component
 * 留言區 - 留言列表 + 輸入框
 */

import React, { useEffect, useCallback } from 'react'
import {
  View,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTheme } from '../theme/useTheme'
import { Text } from '../ui/Text'
import { CommentItem } from './CommentItem'
import { CommentInput } from './CommentInput'
import { useSocialStore } from '../../src/store/socialStore'
import type { Comment } from '../../src/types/social'

interface CommentSectionProps {
  activityId: string
  testID?: string
}

export function CommentSection({ activityId, testID }: CommentSectionProps) {
  const { theme } = useTheme()
  const {
    comments,
    commentsLoading,
    fetchComments,
    addComment,
  } = useSocialStore()

  const activityComments = comments[activityId] || []
  const isLoading = commentsLoading[activityId] || false

  // Fetch comments on mount
  useEffect(() => {
    if (!comments[activityId]) {
      fetchComments(activityId)
    }
  }, [activityId, comments, fetchComments])

  // Submit comment handler
  const handleSubmitComment = useCallback(
    async (content: string) => {
      await addComment(activityId, content)
    },
    [activityId, addComment]
  )

  // Render item
  const renderItem = useCallback(
    ({ item }: { item: Comment }) => (
      <CommentItem
        comment={item}
        testID={`comment-${item.comment_id}`}
      />
    ),
    []
  )

  // Key extractor
  const keyExtractor = useCallback((item: Comment) => item.comment_id, [])

  // Separator
  const renderSeparator = useCallback(
    () => (
      <View
        style={[
          styles.separator,
          { backgroundColor: theme.tokens.colors.border },
        ]}
      />
    ),
    [theme]
  )

  // Empty component
  const renderEmpty = () => {
    if (isLoading) return null
    return (
      <View style={styles.empty}>
        <Text variant="caption" color="muted">
          還沒有留言，成為第一個留言的人吧！
        </Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
      testID={testID}
    >
      {/* Comments List */}
      <View style={styles.listContainer}>
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={theme.tokens.colors.primary} />
            <Text variant="caption" color="muted" style={{ marginTop: 8 }}>
              載入留言中...
            </Text>
          </View>
        ) : (
          <FlatList
            data={activityComments}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ItemSeparatorComponent={renderSeparator}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Comment Input */}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.tokens.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.tokens.colors.border,
          },
        ]}
      >
        <CommentInput
          onSubmit={handleSubmitComment}
          placeholder="寫留言..."
          testID={`${testID}-input`}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  separator: {
    height: 1,
  },
  empty: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  inputWrapper: {
    // Positioned at bottom
  },
})
