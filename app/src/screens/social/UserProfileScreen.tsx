/**
 * User Profile Screen
 * 用戶個人頁面 - 顯示用戶資料、動態、成就等
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, RefreshControl, Alert } from 'react-native';
import { YStack, XStack, Text, Card, Avatar, Button, Spinner } from 'tamagui';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import {
  ArrowLeft, UserPlus, UserX, Activity, Trophy, Users,
  Calendar, TrendingUp, MessageCircle, Check
} from '@tamagui/lucide-icons';
import { api } from '../../services/api';
import { useTheme } from '../../../components/theme/useTheme';

type UserProfileRouteParams = {
  UserProfile: {
    id: string;
  };
};

interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  is_friend: boolean;
  is_self: boolean;
  total_workouts?: number;
  achievement_count?: number;
  friend_count?: number;
  last_workout_at?: string;
  total_distance_km?: number;
}

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UserProfileRouteParams, 'UserProfile'>>();
  const userId = route.params?.id;
  const { theme } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted'>('none');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.getUserProfile(userId);
      setProfile(data);
      setFriendshipStatus(data.is_friend ? 'accepted' : 'none');
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      Alert.alert('錯誤', err.response?.data?.detail || '無法載入用戶資料');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      await api.sendFriendInvite(userId);
      setFriendshipStatus('pending');
      Alert.alert('成功', '好友邀請已發送');
    } catch (err: any) {
      Alert.alert('錯誤', err.response?.data?.detail || '發送邀請失敗');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    Alert.alert(
      '移除好友',
      `確定要將 ${profile?.display_name} 從好友列表中移除嗎？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              // Note: This would need the friendship_id, which we'd need to fetch
              // For now, show a placeholder
              Alert.alert('提示', '功能開發中');
            } catch (err: any) {
              Alert.alert('錯誤', err.response?.data?.detail || '操作失敗');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async () => {
    Alert.alert(
      '封鎖用戶',
      `確定要封鎖 ${profile?.display_name} 嗎？封鎖後對方將無法看到你的動態。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '封鎖',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.blockUser(userId!);
              Alert.alert('已封鎖', '該用戶已被封鎖');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('錯誤', err.response?.data?.detail || '操作失敗');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} 週前`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <YStack flex={1} backgroundColor={theme.tokens.colors.background} alignItems="center" justifyContent="center">
        <Spinner size="large" color={theme.tokens.colors.primary} />
        <Text marginTop="$3" color={theme.tokens.colors.mutedForeground}>載入中...</Text>
      </YStack>
    );
  }

  if (!profile) {
    return (
      <YStack flex={1} backgroundColor={theme.tokens.colors.background} alignItems="center" justifyContent="center">
        <UserX size={48} color={theme.tokens.colors.mutedForeground} />
        <Text marginTop="$3" color={theme.tokens.colors.mutedForeground}>找不到用戶</Text>
        <Button marginTop="$4" onPress={() => navigation.goBack()}>
          <Text color={theme.tokens.colors.primary}>返回</Text>
        </Button>
      </YStack>
    );
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
        gap="$3"
      >
        <Button
          size="$3"
          circular
          chromeless
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={theme.tokens.colors.foreground} />
        </Button>
        <Text flex={1} fontSize="$6" fontWeight="700" color={theme.tokens.colors.foreground}>
          {profile.display_name}
        </Text>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.tokens.colors.primary}
          />
        }
      >
        <YStack padding="$4" gap="$4">
          {/* Profile Header */}
          <YStack alignItems="center" gap="$3">
            <Avatar circular size="$10" backgroundColor={theme.tokens.colors.muted}>
              {profile.avatar_url ? (
                <Avatar.Image source={{ uri: profile.avatar_url }} />
              ) : (
                <Avatar.Fallback>
                  <Text fontSize="$9" fontWeight="700" color={theme.tokens.colors.foreground}>
                    {profile.display_name.charAt(0)}
                  </Text>
                </Avatar.Fallback>
              )}
            </Avatar>

            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="800" color={theme.tokens.colors.foreground}>
                {profile.display_name}
              </Text>
              <XStack alignItems="center" gap="$1">
                <Calendar size={14} color={theme.tokens.colors.mutedForeground} />
                <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>
                  加入於 {formatDate(profile.created_at)}
                </Text>
              </XStack>
            </YStack>

            {/* Action Buttons */}
            {!profile.is_self && (
              <XStack gap="$3" marginTop="$2">
                {friendshipStatus === 'accepted' ? (
                  <>
                    <Button
                      size="$4"
                      backgroundColor={theme.tokens.colors.muted}
                      onPress={handleRemoveFriend}
                      disabled={actionLoading}
                    >
                      <Check size={18} color={theme.tokens.colors.foreground} />
                      <Text marginLeft="$2" color={theme.tokens.colors.foreground}>已是好友</Text>
                    </Button>
                    <Button
                      size="$4"
                      backgroundColor={theme.tokens.colors.primary}
                      onPress={() => {
                        // Navigate to chat or send message
                        Alert.alert('提示', '訊息功能開發中');
                      }}
                    >
                      <MessageCircle size={18} color="white" />
                      <Text marginLeft="$2" color="white">訊息</Text>
                    </Button>
                  </>
                ) : friendshipStatus === 'pending' ? (
                  <Button
                    size="$4"
                    backgroundColor={theme.tokens.colors.muted}
                    disabled
                  >
                    <Text color={theme.tokens.colors.mutedForeground}>邀請已發送</Text>
                  </Button>
                ) : (
                  <Button
                    size="$4"
                    backgroundColor={theme.tokens.colors.primary}
                    onPress={handleAddFriend}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Spinner size="small" color="white" />
                    ) : (
                      <>
                        <UserPlus size={18} color="white" />
                        <Text marginLeft="$2" color="white">添加好友</Text>
                      </>
                    )}
                  </Button>
                )}
              </XStack>
            )}
          </YStack>

          {/* Stats Grid */}
          {(profile.total_workouts !== undefined || profile.is_self) && (
            <XStack gap="$3" flexWrap="wrap">
              <Card
                flex={1}
                minWidth="45%"
                backgroundColor={theme.tokens.colors.card}
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor={theme.tokens.colors.border}
              >
                <YStack alignItems="center" gap="$1">
                  <Activity size={24} color={theme.tokens.colors.primary} />
                  <Text fontSize="$7" fontWeight="800" color={theme.tokens.colors.foreground}>
                    {profile.total_workouts ?? 0}
                  </Text>
                  <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>次運動</Text>
                </YStack>
              </Card>

              <Card
                flex={1}
                minWidth="45%"
                backgroundColor={theme.tokens.colors.card}
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor={theme.tokens.colors.border}
              >
                <YStack alignItems="center" gap="$1">
                  <Trophy size={24} color={theme.tokens.colors.warning} />
                  <Text fontSize="$7" fontWeight="800" color={theme.tokens.colors.foreground}>
                    {profile.achievement_count ?? 0}
                  </Text>
                  <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>個成就</Text>
                </YStack>
              </Card>

              <Card
                flex={1}
                minWidth="45%"
                backgroundColor={theme.tokens.colors.card}
                padding="$4"
                borderRadius="$4"
                borderWidth={1}
                borderColor={theme.tokens.colors.border}
              >
                <YStack alignItems="center" gap="$1">
                  <Users size={24} color={theme.tokens.colors.success} />
                  <Text fontSize="$7" fontWeight="800" color={theme.tokens.colors.foreground}>
                    {profile.friend_count ?? 0}
                  </Text>
                  <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>位好友</Text>
                </YStack>
              </Card>

              {profile.total_distance_km !== undefined && (
                <Card
                  flex={1}
                  minWidth="45%"
                  backgroundColor={theme.tokens.colors.card}
                  padding="$4"
                  borderRadius="$4"
                  borderWidth={1}
                  borderColor={theme.tokens.colors.border}
                >
                  <YStack alignItems="center" gap="$1">
                    <TrendingUp size={24} color={theme.tokens.colors.info} />
                    <Text fontSize="$7" fontWeight="800" color={theme.tokens.colors.foreground}>
                      {profile.total_distance_km.toFixed(1)}
                    </Text>
                    <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>公里</Text>
                  </YStack>
                </Card>
              )}
            </XStack>
          )}

          {/* Last Workout */}
          {profile.last_workout_at && (
            <Card
              backgroundColor={theme.tokens.colors.card}
              padding="$4"
              borderRadius="$4"
              borderWidth={1}
              borderColor={theme.tokens.colors.border}
            >
              <XStack alignItems="center" gap="$3">
                <Activity size={20} color={theme.tokens.colors.primary} />
                <YStack flex={1}>
                  <Text fontSize="$3" color={theme.tokens.colors.mutedForeground}>最近運動</Text>
                  <Text fontSize="$4" fontWeight="600" color={theme.tokens.colors.foreground}>
                    {formatRelativeTime(profile.last_workout_at)}
                  </Text>
                </YStack>
              </XStack>
            </Card>
          )}

          {/* More Options for non-friends */}
          {!profile.is_self && (
            <YStack gap="$2" marginTop="$4">
              <Button
                size="$4"
                backgroundColor={theme.tokens.colors.error + '20'}
                borderWidth={1}
                borderColor={theme.tokens.colors.error + '40'}
                onPress={handleBlockUser}
                disabled={actionLoading}
              >
                <UserX size={18} color={theme.tokens.colors.error} />
                <Text marginLeft="$2" color={theme.tokens.colors.error}>封鎖用戶</Text>
              </Button>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
