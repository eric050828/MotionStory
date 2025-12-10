/**
 * Leaderboard Screen
 * 排行榜頁面 - 與好友比較運動量（使用真實 API）
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, Avatar, Circle } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronLeft, Trophy, Medal, Crown, Users,
  Route, Timer, Flame, TrendingUp
} from '@tamagui/lucide-icons';
import { api } from '../../services/api';

// Types from API
interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  metric_value: number;
  workout_count: number;
}

interface LeaderboardResponse {
  period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  metric: 'distance' | 'duration' | 'workouts' | 'calories';
  period_start: string;
  period_end: string;
  entries: LeaderboardEntry[];
  my_rank: number | null;
  total_participants: number;
}

type LeaderboardMetric = 'distance' | 'workouts' | 'duration';

// Tab Button
const TabButton: React.FC<{
  label: string;
  icon: any;
  active: boolean;
  onPress: () => void;
}> = ({ label, icon: Icon, active, onPress }) => (
  <Card
    flex={1}
    onPress={onPress}
    bg={active ? "$blue10" : "$background"}
    br="$3"
    p="$2"
    ai="center"
    borderWidth={1}
    borderColor={active ? "$blue10" : "$borderColor"}
    pressStyle={{ scale: 0.98 }}
    cursor="pointer"
  >
    <Icon size={18} color={active ? "white" : "$gray10"} />
    <Text fontSize="$2" fontWeight="600" color={active ? "white" : "$gray10"} mt="$1">
      {label}
    </Text>
  </Card>
);

// Leaderboard Item
const LeaderboardItem: React.FC<{
  rank: number;
  name: string;
  avatar: string | null;
  value: number;
  unit: string;
  isCurrentUser?: boolean;
  workoutCount?: number;
}> = ({ rank, name, avatar, value, unit, isCurrentUser, workoutCount }) => {
  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Crown size={24} color="#FFD700" />;
      case 2:
        return <Medal size={22} color="#C0C0C0" />;
      case 3:
        return <Medal size={20} color="#CD7F32" />;
      default:
        return (
          <Text fontSize="$4" fontWeight="700" color="$gray10" width={24} ta="center">
            {rank}
          </Text>
        );
    }
  };

  const getRankBg = () => {
    switch (rank) {
      case 1: return ['#FFD700', '#FFA500'];
      case 2: return ['#E8E8E8', '#C0C0C0'];
      case 3: return ['#CD7F32', '#8B4513'];
      default: return null;
    }
  };

  const rankBg = getRankBg();

  return (
    <Card
      bg={isCurrentUser ? "$blue2" : "$background"}
      br="$4"
      p="$3"
      borderWidth={isCurrentUser ? 2 : 1}
      borderColor={isCurrentUser ? "$blue8" : "$borderColor"}
      mb="$2"
    >
      <XStack ai="center" gap="$3">
        {/* Rank */}
        <YStack width={40} ai="center">
          {rankBg ? (
            <LinearGradient
              colors={rankBg}
              start={[0, 0]}
              end={[1, 1]}
              width={36}
              height={36}
              borderRadius={18}
              ai="center"
              jc="center"
            >
              {getRankIcon()}
            </LinearGradient>
          ) : (
            <Circle size={36} bg="$gray3">
              {getRankIcon()}
            </Circle>
          )}
        </YStack>

        {/* Avatar & Name */}
        <XStack flex={1} ai="center" gap="$3">
          <Avatar circular size="$4" bg="$gray5">
            <Avatar.Fallback>
              <Text fontSize="$4" fontWeight="700" color="$gray11">
                {name.charAt(0)}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="700" color="$color">
              {name}
              {isCurrentUser && (
                <Text fontSize="$2" color="$blue10"> (你)</Text>
              )}
            </Text>
          </YStack>
        </XStack>

        {/* Value */}
        <YStack ai="flex-end">
          <Text fontSize="$5" fontWeight="900" color={rank <= 3 ? "$blue10" : "$color"}>
            {typeof value === 'number' ? value.toFixed(1) : value}
          </Text>
          <Text fontSize="$1" color="$gray9">{unit}</Text>
        </YStack>
      </XStack>
    </Card>
  );
};

const LeaderboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<LeaderboardMetric>('distance');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);

  // Fetch leaderboard from API
  const fetchLeaderboard = useCallback(async (metric: LeaderboardMetric = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getLeaderboard({
        period: 'weekly',
        metric: metric === 'duration' ? 'duration' : metric,
      });
      setLeaderboardData(response);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.message || '無法載入排行榜');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Handle tab change
  const handleTabChange = useCallback((metric: LeaderboardMetric) => {
    setActiveTab(metric);
    fetchLeaderboard(metric);
  }, [fetchLeaderboard]);

  // Get unit for current tab
  const getUnit = () => {
    switch (activeTab) {
      case 'distance': return '公里';
      case 'workouts': return '次';
      case 'duration': return '分鐘';
    }
  };

  // Get current user stats
  const myRank = leaderboardData?.my_rank || 0;
  const totalParticipants = leaderboardData?.total_participants || 0;
  const myEntry = leaderboardData?.entries.find(e => e.rank === myRank);
  const myMetricValue = myEntry?.metric_value || 0;
  const myWorkoutCount = myEntry?.workout_count || 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <YStack p="$4" gap="$4">
          {/* Your Rank Card */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={[0, 0]}
            end={[1, 1]}
            br="$4"
            p="$4"
          >
            <XStack jc="space-between" ai="center">
              <YStack>
                <Text fontSize="$3" color="white" opacity={0.8}>你的排名</Text>
                <XStack ai="baseline" gap="$1">
                  <Text fontSize="$10" fontWeight="900" color="white">
                    {myRank > 0 ? `#${myRank}` : '-'}
                  </Text>
                  <Text fontSize="$4" color="white" opacity={0.8}>
                    / {totalParticipants}
                  </Text>
                </XStack>
              </YStack>
              <YStack ai="flex-end" gap="$1">
                <XStack ai="center" gap="$2">
                  <Route size={18} color="white" />
                  <Text fontSize="$5" fontWeight="700" color="white">
                    {myMetricValue.toFixed(1)} {getUnit()}
                  </Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <TrendingUp size={18} color="white" />
                  <Text fontSize="$4" color="white" opacity={0.9}>
                    {myWorkoutCount} 次運動
                  </Text>
                </XStack>
              </YStack>
            </XStack>
          </LinearGradient>

          {/* Tab Selector */}
          <XStack gap="$2">
            <TabButton
              label="距離"
              icon={Route}
              active={activeTab === 'distance'}
              onPress={() => handleTabChange('distance')}
            />
            <TabButton
              label="運動次數"
              icon={TrendingUp}
              active={activeTab === 'workouts'}
              onPress={() => handleTabChange('workouts')}
            />
            <TabButton
              label="運動時長"
              icon={Timer}
              active={activeTab === 'duration'}
              onPress={() => handleTabChange('duration')}
            />
          </XStack>

          {/* Error State */}
          {error && (
            <Card bg="$red2" p="$3" br="$3">
              <Text color="$red10" ta="center">{error}</Text>
            </Card>
          )}

          {/* Leaderboard List */}
          <YStack gap="$1">
            <XStack ai="center" gap="$2" mb="$2">
              <Users size={20} color="$color" />
              <Text fontSize="$5" fontWeight="700" color="$color">好友排行榜</Text>
            </XStack>

            {loading && !leaderboardData ? (
              <YStack ai="center" jc="center" py="$8">
                <Spinner size="large" color="$blue10" />
                <Text mt="$3" color="$gray10">載入排行榜中...</Text>
              </YStack>
            ) : leaderboardData?.entries.length === 0 ? (
              <YStack ai="center" jc="center" py="$8">
                <Users size={48} color="$gray8" />
                <Text mt="$3" color="$gray10">還沒有好友</Text>
                <Text fontSize="$2" color="$gray8">邀請好友一起運動吧！</Text>
              </YStack>
            ) : (
              leaderboardData?.entries.map((entry) => (
                <LeaderboardItem
                  key={entry.user_id}
                  rank={entry.rank}
                  name={entry.display_name}
                  avatar={entry.avatar_url}
                  value={entry.metric_value}
                  unit={getUnit()}
                  isCurrentUser={entry.rank === myRank}
                  workoutCount={entry.workout_count}
                />
              ))
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default LeaderboardScreen;
