/**
 * My Activities Screen
 * 我的動態頁面 - 查看、編輯、刪除個人發布的動態
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, Alert } from 'react-native';
import { YStack, XStack, Text, Card, Avatar, Button, Spinner, Input, TextArea, Sheet } from 'tamagui';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft, Edit3, Trash2, Save, X, Heart, MessageCircle,
  Activity, Trophy, Target, Image as ImageIcon
} from '@tamagui/lucide-icons';
import { api } from '../../../src/services/api';
import type { Activity as ActivityType } from '../../../src/types/social';

export default function MyActivitiesScreen() {
  const router = useRouter();
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

  const handleDelete = (activity: ActivityType) => {
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
  };

  const getActivityIcon = (type: ActivityType['activity_type']) => {
    switch (type) {
      case 'workout': return <Activity size={18} color="$blue10" />;
      case 'achievement': return <Trophy size={18} color="$yellow10" />;
      case 'challenge': return <Target size={18} color="$green10" />;
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
      <Card bg="$background" p="$4" br="$4" mb="$3" borderWidth={1} borderColor="$borderColor">
        {/* Header */}
        <XStack ai="center" jc="space-between" mb="$3">
          <XStack ai="center" gap="$2">
            {getActivityIcon(item.activity_type)}
            <Text fontSize="$3" color="$gray10">
              {getActivityLabel(item.activity_type)}
            </Text>
            <Text fontSize="$2" color="$gray8">
              · {formatTime(item.created_at)}
            </Text>
          </XStack>

          {!isEditing && (
            <XStack gap="$2">
              <Button
                size="$2"
                circular
                bg="$blue3"
                onPress={() => handleEdit(item)}
                disabled={isDeleting}
              >
                <Edit3 size={14} color="$blue10" />
              </Button>
              <Button
                size="$2"
                circular
                bg="$red3"
                onPress={() => handleDelete(item)}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner size="small" color="$red10" />
                ) : (
                  <Trash2 size={14} color="$red10" />
                )}
              </Button>
            </XStack>
          )}
        </XStack>

        {/* Content */}
        {isEditing ? (
          <YStack gap="$3">
            <YStack gap="$2">
              <Text fontSize="$2" color="$gray10">說明文字</Text>
              <TextArea
                placeholder="寫些什麼..."
                value={editCaption}
                onChangeText={setEditCaption}
                minHeight={80}
              />
            </YStack>

            <YStack gap="$2">
              <Text fontSize="$2" color="$gray10">圖片網址（選填）</Text>
              <Input
                placeholder="https://..."
                value={editImageUrl}
                onChangeText={setEditImageUrl}
              />
            </YStack>

            <XStack gap="$2" jc="flex-end">
              <Button
                size="$3"
                bg="$gray5"
                onPress={handleCancelEdit}
                disabled={saving}
              >
                <X size={16} color="$gray10" />
                <Text ml="$1" color="$gray10">取消</Text>
              </Button>
              <Button
                size="$3"
                bg="$blue10"
                onPress={() => handleSaveEdit(item.activity_id)}
                disabled={saving}
              >
                {saving ? (
                  <Spinner size="small" color="white" />
                ) : (
                  <>
                    <Save size={16} color="white" />
                    <Text ml="$1" color="white">儲存</Text>
                  </>
                )}
              </Button>
            </XStack>
          </YStack>
        ) : (
          <>
            {/* Caption */}
            {item.caption && (
              <Text fontSize="$4" color="$color" mb="$3">
                {item.caption}
              </Text>
            )}

            {/* Image */}
            {item.image_url && (
              <Card bg="$gray3" br="$3" mb="$3" overflow="hidden">
                <XStack ai="center" jc="center" p="$4">
                  <ImageIcon size={24} color="$gray8" />
                  <Text ml="$2" color="$gray8" fontSize="$2">
                    {item.image_url.slice(0, 40)}...
                  </Text>
                </XStack>
              </Card>
            )}

            {/* Stats */}
            <XStack gap="$4">
              <XStack ai="center" gap="$1">
                <Heart size={16} color={item.is_liked_by_me ? "$red10" : "$gray8"} />
                <Text fontSize="$3" color="$gray10">{item.likes_count}</Text>
              </XStack>
              <XStack ai="center" gap="$1">
                <MessageCircle size={16} color="$gray8" />
                <Text fontSize="$3" color="$gray10">{item.comments_count}</Text>
              </XStack>
            </XStack>
          </>
        )}
      </Card>
    );
  };

  return (
    <YStack flex={1} bg="$background">
      <Stack.Screen
        options={{
          title: '我的動態',
          headerLeft: () => (
            <XStack onPress={() => router.back()} p="$2" cursor="pointer">
              <ChevronLeft size={24} color="$color" />
            </XStack>
          ),
        }}
      />

      {/* Error State */}
      {error && !loading && (
        <Card bg="$red2" m="$4" p="$4" br="$4">
          <Text color="$red10" ta="center">{error}</Text>
          <Button mt="$3" onPress={() => fetchActivities()} bg="$red10">
            <Text color="white">重試</Text>
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {loading && activities.length === 0 && (
        <YStack flex={1} ai="center" jc="center">
          <Spinner size="large" color="$blue10" />
          <Text mt="$3" color="$gray10">載入中...</Text>
        </YStack>
      )}

      {/* Empty State */}
      {!loading && !error && activities.length === 0 && (
        <YStack flex={1} ai="center" jc="center" gap="$4">
          <Activity size={64} color="$gray8" />
          <Text fontSize="$5" fontWeight="700" color="$gray10">還沒有動態</Text>
          <Text color="$gray9" ta="center">
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            hasMore ? (
              <YStack ai="center" p="$4">
                <Spinner size="small" color="$blue10" />
              </YStack>
            ) : null
          )}
        />
      )}
    </YStack>
  );
}
