/**
 * CommentItem Component
 * 單則留言顯示
 */

import React from 'react'
import { View, StyleSheet } from 'react-native'
import { useTheme } from '../theme/useTheme'
import { Text } from '../ui/Text'
import { UserAvatar } from './UserAvatar'
import { socialService } from '../../src/services/socialService'
import type { Comment } from '../../src/types/social'

interface CommentItemProps {
  comment: Comment
  testID?: string
}

export function CommentItem({ comment, testID }: CommentItemProps) {
  const { theme } = useTheme()

  const isFiltered = comment.status === 'filtered'

  return (
    <View style={styles.container} testID={testID}>
      <UserAvatar
        uri={comment.user_avatar}
        name={comment.user_name}
        size="sm"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="caption" weight="medium">
            {comment.user_name}
          </Text>
          <Text variant="caption" color="muted" style={styles.time}>
            {socialService.formatRelativeTime(comment.created_at)}
          </Text>
        </View>
        <Text
          variant="body"
          style={[
            styles.text,
            isFiltered && { fontStyle: 'italic' },
          ]}
          color={isFiltered ? 'muted' : 'default'}
        >
          {comment.content}
        </Text>
        {isFiltered && (
          <Text variant="caption" color="muted" style={styles.filteredNote}>
            (部分內容已過濾)
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    marginLeft: 8,
  },
  text: {
    marginTop: 4,
  },
  filteredNote: {
    marginTop: 2,
  },
})
