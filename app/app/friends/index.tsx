/**
 * Friends List Screen
 * 好友清單頁面 - 管理好友與待處理邀請
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import { YStack, XStack, Text, Card, Avatar, Button, Spinner, Tabs } from 'tamagui';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft, UserPlus, Users, Clock, Check, X, Trash2, Shield
} from '@tamagui/lucide-icons';
import { api } from '../../src/services/api';
import { useTheme } from '../../components/theme/useTheme';

interface FriendProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_workout_at: string | null;
  total_workouts: number;
  friendship_since: string;
  friendship_id?: string;
}

interface FriendRequest {
  friendship_id: string;
  from_user: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
  };
  invited_at: string;
}

export default function FriendsListScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      const data = await api.getFriends({ status: 'accepted', limit: 100 });
      setFriends(data.friends || []);
    } catch (err: any) {
      console.error('Failed to fetch friends:', err);
      setError('無法載入好友列表');
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await api.getFriendRequests();
      setRequests(data.requests || []);
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchFriends(), fetchRequests()]);
    setLoading(false);
  }, [fetchFriends, fetchRequests]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setProcessing(friendshipId);
    try {
      await api.acceptFriendRequest(friendshipId);
      setRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
      await fetchFriends();
    } catch (err: any) {
      console.error('Failed to accept request:', err);
      Alert.alert('錯誤', '接受邀請失敗');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    setProcessing(friendshipId);
    try {
      await api.rejectFriendRequest(friendshipId);
      setRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      Alert.alert('錯誤', '拒絕邀請失敗');
    } finally {
      setProcessing(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, displayName: string) => {
    Alert.alert(
      '移除好友',
      `確定要移除 ${displayName} 嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            setProcessing(friendshipId);
            try {
              await api.removeFriend(friendshipId);
              setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId));
            } catch (err: any) {
              console.error('Failed to remove friend:', err);
              Alert.alert('錯誤', '移除好友失敗');
            } finally {
              setProcessing(null);
            }
          }
        }
      ]
    );
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    return `${Math.floor(diffDays / 30)} 個月前`;
  };

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
        <XStack alignItems="center" gap="$3">
          <Button
            size="$3"
            circular
            chromeless
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft size={24} color={theme.tokens.colors.foreground} />
          </Button>
          <Text fontSize="$6" fontWeight="700" color={theme.tokens.colors.foreground}>
            好友
          </Text>
        </XStack>
        <Button
          size="$3"
          circular
          chromeless
          onPress={() => navigation.navigate('FriendsSearch')}
        >
          <UserPlus size={24} color={theme.tokens.colors.primary} />
        </Button>
      </XStack>

      {/* Tab Selector */}
      <XStack p="$4" gap="$2">
        <Card
          flex={1}
          onPress={() => setActiveTab('friends')}
          bg={activeTab === 'friends' ? "$blue10" : "$background"}
          br="$3"
          p="$3"
          ai="center"
          borderWidth={1}
          borderColor={activeTab === 'friends' ? "$blue10" : "$borderColor"}
          pressStyle={{ scale: 0.98 }}
          cursor="pointer"
        >
          <XStack ai="center" gap="$2">
            <Users size={18} color={activeTab === 'friends' ? "white" : "$gray10"} />
            <Text fontWeight="600" color={activeTab === 'friends' ? "white" : "$gray10"}>
              好友 ({friends.length})
            </Text>
          </XStack>
        </Card>
        <Card
          flex={1}
          onPress={() => setActiveTab('requests')}
          bg={activeTab === 'requests' ? "$blue10" : "$background"}
          br="$3"
          p="$3"
          ai="center"
          borderWidth={1}
          borderColor={activeTab === 'requests' ? "$blue10" : "$borderColor"}
          pressStyle={{ scale: 0.98 }}
          cursor="pointer"
        >
          <XStack ai="center" gap="$2">
            <Clock size={18} color={activeTab === 'requests' ? "white" : "$gray10"} />
            <Text fontWeight="600" color={activeTab === 'requests' ? "white" : "$gray10"}>
              邀請 ({requests.length})
            </Text>
          </XStack>
        </Card>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <YStack p="$4" pt={0} gap="$2">
          {/* Loading State */}
          {loading && (
            <YStack ai="center" jc="center" py="$8">
              <Spinner size="large" color="$blue10" />
              <Text mt="$3" color="$gray10">載入中...</Text>
            </YStack>
          )}

          {/* Error State */}
          {error && !loading && (
            <Card bg="$red2" p="$4" br="$4">
              <Text color="$red10" ta="center">{error}</Text>
              <Button mt="$3" onPress={fetchData} bg="$red10">
                <Text color="white">重試</Text>
              </Button>
            </Card>
          )}

          {/* Friends Tab */}
          {!loading && activeTab === 'friends' && (
            <>
              {friends.length === 0 ? (
                <YStack ai="center" jc="center" py="$8" gap="$4">
                  <Users size={64} color="$gray8" />
                  <Text fontSize="$5" fontWeight="700" color="$gray10">還沒有好友</Text>
                  <Text color="$gray9" ta="center">
                    開始搜尋並添加好友吧！
                  </Text>
                  <Button bg="$blue10" onPress={() => navigation.navigate('FriendsSearch')}>
                    <UserPlus size={20} color="white" />
                    <Text color="white" ml="$2">搜尋好友</Text>
                  </Button>
                </YStack>
              ) : (
                friends.map((friend) => (
                  <Card key={friend.user_id} bg="$background" p="$3" br="$4" borderWidth={1} borderColor="$borderColor">
                    <XStack ai="center" gap="$3">
                      <Pressable onPress={() => navigation.navigate('UserProfile', { id: friend.user_id })}>
                        <Avatar circular size="$5" bg="$gray5">
                          {friend.avatar_url ? (
                            <Avatar.Image source={{ uri: friend.avatar_url }} />
                          ) : (
                            <Avatar.Fallback>
                              <Text fontSize="$5" fontWeight="700" color="$gray11">
                                {friend.display_name.charAt(0)}
                              </Text>
                            </Avatar.Fallback>
                          )}
                        </Avatar>
                      </Pressable>

                      <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('UserProfile', { id: friend.user_id })}>
                        <YStack>
                          <Text fontSize="$4" fontWeight="700" color="$color">
                            {friend.display_name}
                          </Text>
                          <Text fontSize="$2" color="$gray9">
                            {friend.total_workouts} 次運動
                            {friend.last_workout_at && ` · 最近 ${formatRelativeTime(friend.last_workout_at)}`}
                          </Text>
                        </YStack>
                      </Pressable>

                      <Button
                        size="$3"
                        circular
                        bg="$red3"
                        onPress={() => handleRemoveFriend(friend.friendship_id!, friend.display_name)}
                        disabled={processing === friend.friendship_id}
                      >
                        {processing === friend.friendship_id ? (
                          <Spinner size="small" color="$red10" />
                        ) : (
                          <Trash2 size={16} color="$red10" />
                        )}
                      </Button>
                    </XStack>
                  </Card>
                ))
              )}
            </>
          )}

          {/* Requests Tab */}
          {!loading && activeTab === 'requests' && (
            <>
              {requests.length === 0 ? (
                <YStack ai="center" jc="center" py="$8" gap="$3">
                  <Clock size={64} color="$gray8" />
                  <Text fontSize="$5" fontWeight="700" color="$gray10">沒有待處理的邀請</Text>
                  <Text fontSize="$2" color="$gray9" ta="center">
                    當有人向你發送好友邀請時{'\n'}會顯示在這裡
                  </Text>
                </YStack>
              ) : (
                requests.map((request) => (
                  <Card key={request.friendship_id} bg="$background" p="$3" br="$4" borderWidth={1} borderColor="$borderColor">
                    <XStack ai="center" gap="$3">
                      <Pressable onPress={() => navigation.navigate('UserProfile', { id: request.from_user.user_id })}>
                        <Avatar circular size="$5" bg="$gray5">
                          {request.from_user.avatar_url ? (
                            <Avatar.Image source={{ uri: request.from_user.avatar_url }} />
                          ) : (
                            <Avatar.Fallback>
                              <Text fontSize="$5" fontWeight="700" color="$gray11">
                                {request.from_user.display_name.charAt(0)}
                              </Text>
                            </Avatar.Fallback>
                          )}
                        </Avatar>
                      </Pressable>

                      <Pressable style={{ flex: 1 }} onPress={() => navigation.navigate('UserProfile', { id: request.from_user.user_id })}>
                        <YStack>
                          <Text fontSize="$4" fontWeight="700" color="$color">
                            {request.from_user.display_name}
                          </Text>
                          <Text fontSize="$2" color="$gray9">
                            {formatRelativeTime(request.invited_at)} 發送邀請
                          </Text>
                        </YStack>
                      </Pressable>

                      <XStack gap="$2">
                        <Button
                          size="$3"
                          circular
                          bg="$green3"
                          onPress={() => handleAcceptRequest(request.friendship_id)}
                          disabled={processing === request.friendship_id}
                        >
                          {processing === request.friendship_id ? (
                            <Spinner size="small" color="$green10" />
                          ) : (
                            <Check size={16} color="$green10" />
                          )}
                        </Button>
                        <Button
                          size="$3"
                          circular
                          bg="$red3"
                          onPress={() => handleRejectRequest(request.friendship_id)}
                          disabled={processing === request.friendship_id}
                        >
                          <X size={16} color="$red10" />
                        </Button>
                      </XStack>
                    </XStack>
                  </Card>
                ))
              )}
            </>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
