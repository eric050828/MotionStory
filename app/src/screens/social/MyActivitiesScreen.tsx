/**
 * My Activities Screen
 * 我的動態頁面 - 查看、編輯、刪除個人發布的動態
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, Alert, Image, Platform } from 'react-native';
import { YStack, XStack, Text, Card, Button, Spinner, Input, TextArea } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import {
  Edit3, Trash2, Save, X, Heart, MessageCircle,
  Activity, Trophy, Target, Image as ImageIcon
} from '@tamagui/lucide-icons';
import { api } from '../../services/api';
import { useTheme } from '../../../components/theme/useTheme';
import type { Activity as ActivityType } from '../../types/social';

export default function MyActivitiesScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchActivities = useCallback(async (cursor?: string) => {
    try {
      setError(null);
      const data = await api.getMyActivities({ cursor, limit: 20 });

      if (cursor) {
        setActivities(prev => [...prev, ...(data.activities || [])]);
      } else {
        setActivities(data.activities || []);
      }

      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);
    } catch (err: any) {
      console.error('Failed to fetch activities:', err);
      setError(err.response?.data?.detail || '無法載入動態');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (hasMore && nextCursor && !loading) {
      fetchActivities(nextCursor);
    }
  };

  const handleEdit = (activity: ActivityType) => {
    setEditingId(activity.activity_id);
    setEditCaption(activity.caption || '');
    setEditImageUrl(activity.image_url || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCaption('');
    setEditImageUrl('');
  };

  const handleSaveEdit = async (activityId: string) => {
    setSaving(true);
    try {
      await api.updateActivity(activityId, {
        caption: editCaption,
        image_url: editImageUrl || undefined,
      });

      // Update local state
      setActivities(prev => prev.map(a =>
        a.activity_id === activityId
          ? { ...a, caption: editCaption, image_url: editImageUrl || null }
          : a
      ));

      handleCancelEdit();
    } catch (err: any) {
      console.error('Failed to update activity:', err);
      Alert.alert('錯誤', '更新動態失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (activity: ActivityType) => {
    // Web 平台使用 window.confirm，其他平台使用 Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('確定要刪除這則動態嗎？此操作無法復原。');
      if (confirmed) {
        setDeleting(activity.activity_id);
        try {
          await api.deleteActivity(activity.activity_id);
          setActivities(prev => prev.filter(a => a.activity_id !== activity.activity_id));
        } catch (err: any) {
          console.error('Failed to delete activity:', err);
          window.alert('刪除動態失敗');
        } finally {
          setDeleting(null);
        }
      }
    } else {
      Alert.alert(
        '刪除動態',
        '確定要刪除這則動態嗎？此操作無法復原。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '刪除',
            style: 'destructive',
            onPress: async () => {
              setDeleting(activity.activity_id);
              try {
                await api.deleteActivity(activity.activity_id);
                setActivities(prev => prev.filter(a => a.activity_id !== activity.activity_id));
              } catch (err: any) {
                console.error('Failed to delete activity:', err);
                Alert.alert('錯誤', '刪除動態失敗');
              } finally {
                setDeleting(null);
              }
            }
          }
        ]
      );
    }
  };

  const getActivityIcon = (type: ActivityType['activity_type']) => {
    switch (type) {
      case 'workout': return <Activity size={18} color={theme.tokens.colors.primary} />;
      case 'achievement': return <Trophy size={18} color="#EAB308" />;
      case 'challenge': return <Target size={18} color="#22C55E" />;
    }
  };

  const getActivityLabel = (type: ActivityType['activity_type']) => {
    switch (type) {
      case 'workout': return '運動記錄';
      case 'achievement': return '獲得成就';
      case 'challenge': return '完成挑戰';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '剛剛';
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    if (diffHour < 24) return `${diffHour} 小時前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return date.toLocaleDateString('zh-TW');
  };

  const renderActivity = ({ item }: { item: ActivityType }) => {
    const isEditing = editingId === item.activity_id;
    const isDeleting = deleting === item.activity_id;

    return (
      <Card
        backgroundColor={theme.tokens.colors.card}
        padding="$4"
        borderRadius="$4"
        marginBottom="$3"
        borderWidth={1}
        borderColor={theme.tokens.colors.border}
      >
        {/* Header */}
        <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
          <XStack alignItems="center" gap="$2">
            {getActivityIcon(item.activity_type)}
            <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
              {getActivityLabel(item.activity_type)}
            </Text>
            <Text fontSize="$2" color={theme.tokens.colors.mutedForeground}>
              · {formatTime(item.created_at)}
            </Text>
          </XStack>

          {!isEditing && (
            <XStack gap="$2">
              <Button
                size="$2"
                circular
                backgroundColor={theme.tokens.colors.muted}
                onPress={() => handleEdit(item)}
                disabled={isDeleting}
              >
                <Edit3 size={14} color={theme.tokens.colors.primary} />
              </Button>
              <Button
                size="$2"
                circular
                backgroundColor={theme.tokens.colors.error + '20'}
                onPress={() => handleDelete(item)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner size="small" color={theme.tokens.colors.error} />
                ) : (
                  <Trash2 size={14} color={theme.tokens.colors.error} />
                )}
              </Button>
            </XStack>
          )}
        </XStack>

        {/* Content */}
        {isEditing ? (
          <YStack gap="$3">
            <YStack gap="$2">
              <Text fontSize="$2" color={theme.tokens.colors.mutedForeground}>說明文字</Text>
              <TextArea
                placeholder="寫些什麼..."
                value={editCaption}
                onChangeText={setEditCaption}
                minHeight={80}
                backgroundColor={theme.tokens.colors.background}
                borderColor={theme.tokens.colors.border}
              />
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$2" color={theme.tokens.colors.mutedForeground}>圖片網址（選填）</Text>
              <Input
                placeholder="https://..."
                value={editImageUrl}
                onChangeText={setEditImageUrl}
                backgroundColor={theme.tokens.colors.background}
                borderColor={theme.tokens.colors.border}
              />
            </YStack>

            <XStack gap="$2" justifyContent="flex-end">
              <Button
                size="$3"
                backgroundColor={theme.tokens.colors.muted}
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <X size={16} color={theme.tokens.colors.mutedForeground} />
                <Text marginLeft="$1" color={theme.tokens.colors.mutedForeground}>取消</Text>
              </Button>
              <Button
                size="$3"
                backgroundColor={theme.tokens.colors.primary}
                onPress={() => handleSaveEdit(item.activity_id)}
                disabled={saving}
              >
                {saving ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <>
                    <Save size={16} color="white" />
                    <Text marginLeft="$1" color="white">儲存</Text>
                  </>
                )}
              </Button>
            </XStack>
          </YStack>
        ) : (
          <>
            {/* Caption */}
            {item.caption && (
              <Text fontSize="$4" color={theme.tokens.colors.foreground} marginBottom="$3">
                {item.caption}
              </Text>
            )}

            {/* Image */}
            {item.image_url && (
              <Card borderRadius="$3" marginBottom="$3" overflow="hidden">
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: '100%', height: 200 }}
                  resizeMode="cover"
                />
              </Card>
            )}

            {/* Stats */}
            <XStack gap="$4">
              <XStack alignItems="center" gap="$1">
                <Heart size={16} color={item.is_liked_by_me ? theme.tokens.colors.error : theme.tokens.colors.mutedForeground} />
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>{item.likes_count}</Text>
              </XStack>
              <XStack alignItems="center" gap="$1">
                <MessageCircle size={16} color={theme.tokens.colors.mutedForeground} />
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>{item.comments_count}</Text>
              </XStack>
            </XStack>
          </>
        )}
      </Card>
    );
  };

  return (
    <YStack flex={1} backgroundColor={theme.tokens.colors.background}>
      {/* Error State */}
      {error && !loading && (
        <Card backgroundColor={theme.tokens.colors.error + '20'} margin="$4" padding="$4" borderRadius="$4">
          <Text color={theme.tokens.colors.error} textAlign="center">{error}</Text>
          <Button marginTop="$3" onPress={() => fetchActivities()} backgroundColor={theme.tokens.colors.error}>
            <Text color="white">重試</Text>
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && activities.length === 0 && (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color={theme.tokens.colors.primary} />
          <Text marginTop="$3" color={theme.tokens.colors.mutedForeground}>載入中...</Text>
        </YStack>
      )}

      {/* Empty State */}
      {!loading && !error && activities.length === 0 && (
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <Activity size={64} color={theme.tokens.colors.mutedForeground} />
          <Text fontSize="$5" fontWeight="700" color={theme.tokens.colors.mutedForeground}>還沒有動態</Text>
          <Text color={theme.tokens.colors.mutedForeground} textAlign="center">
            完成運動後分享到社群{'\n'}你的動態會顯示在這裡
          </Text>
        </YStack>
      )}

      {/* Activity List */}
      {activities.length > 0 && (
        <FlatList
          data={activities}
          renderItem={renderActivity}
          keyExtractor={(item) => item.activity_id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.tokens.colors.primary}
              colors={[theme.tokens.colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            hasMore ? (
              <YStack alignItems="center" padding="$4">
                <Spinner size="small" color={theme.tokens.colors.primary} />
              </YStack>
            ) : null
          )}
        />
      )}
    </YStack>
  );
}
