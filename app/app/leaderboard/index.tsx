/**
 * Leaderboard Screen
 * 排行榜頁面 - 與好友比較運動量
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, Avatar, Circle, Button } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft, Trophy, Medal, Crown, Users,
  Route, Timer, Flame, TrendingUp, UserPlus
} from '@tamagui/lucide-icons';
import { api } from '../../src/services/api';

type LeaderboardPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
type LeaderboardMetric = 'distance' | 'duration' | 'workouts' | 'calories';

interface LeaderboardEntryData {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  metric_value: number;
  workout_count: number;
}

interface LeaderboardData {
  period: LeaderboardPeriod;
  metric: LeaderboardMetric;
  period_start: string;
  period_end: string;
  entries: LeaderboardEntryData[];
  my_rank: number | null;
  total_participants: number;
}

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
}> = ({ rank, name, avatar, value, unit, isCurrentUser }) => {
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

export default function LeaderboardScreen() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMetric, setActiveMetric] = useState<LeaderboardMetric>('distance');
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>('weekly');
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getLeaderboard({
        period: activePeriod,
        metric: activeMetric,
      });
      setLeaderboardData(data);
    } catch (err: any) {
      console.error('Failed to fetch leaderboard:', err);
      setError(err.response?.data?.detail || '無法載入排行榜');
    } finally {
      setLoading(false);
    }
  }, [activePeriod, activeMetric]);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Get unit for current metric
  const getUnit = () => {
    switch (activeMetric) {
      case 'distance': return '公里';
      case 'duration': return '分鐘';
      case 'workouts': return '次';
      case 'calories': return '卡';
    }
  };

  // Get period label
  const getPeriodLabel = () => {
    switch (activePeriod) {
      case 'weekly': return '本週';
      case 'monthly': return '本月';
      case 'quarterly': return '本季';
      case 'yearly': return '今年';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const handleAddFriend = () => {
    router.push('/friends/search');
  };

  // Find my entry from leaderboard data
  const myEntry = leaderboardData?.entries.find(
    e => e.rank === leaderboardData.my_rank
  );

  return (
    <YStack flex={1} bg="$background">
      <Stack.Screen
        options={{
          title: '排行榜',
          headerLeft: () => (
            <XStack onPress={() => router.back()} p="$2" cursor="pointer">
              <ChevronLeft size={24} color="$color" />
            </XStack>
          ),
          headerRight: () => (
            <XStack onPress={handleAddFriend} p="$2" cursor="pointer">
              <UserPlus size={24} color="$blue10" />
            </XStack>
          ),
        }}
      />

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
                <Text fontSize="$3" color="white" opacity={0.8}>你的排名 ({getPeriodLabel()})</Text>
                <XStack ai="baseline" gap="$1">
                  <Text fontSize="$10" fontWeight="900" color="white">
                    #{leaderboardData?.my_rank || '-'}
                  </Text>
                  <Text fontSize="$4" color="white" opacity={0.8}>
                    / {leaderboardData?.total_participants || 0}
                  </Text>
                </XStack>
              </YStack>
              <YStack ai="flex-end" gap="$1">
                <XStack ai="center" gap="$2">
                  <Route size={18} color="white" />
                  <Text fontSize="$5" fontWeight="700" color="white">
                    {myEntry?.metric_value?.toFixed(1) || '0'} {getUnit()}
                  </Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <TrendingUp size={18} color="white" />
                  <Text fontSize="$4" color="white" opacity={0.9}>
                    {myEntry?.workout_count || 0} 次運動
                  </Text>
                </XStack>
              </YStack>
            </XStack>
          </LinearGradient>

          {/* Period Selector */}
          <XStack gap="$2">
            {(['weekly', 'monthly', 'quarterly', 'yearly'] as LeaderboardPeriod[]).map((period) => (
              <Card
                key={period}
                flex={1}
                onPress={() => setActivePeriod(period)}
                bg={activePeriod === period ? "$blue10" : "$background"}
                br="$3"
                p="$2"
                ai="center"
                borderWidth={1}
                borderColor={activePeriod === period ? "$blue10" : "$borderColor"}
                pressStyle={{ scale: 0.98 }}
                cursor="pointer"
              >
                <Text fontSize="$2" fontWeight="600" color={activePeriod === period ? "white" : "$gray10"}>
                  {period === 'weekly' ? '週' : period === 'monthly' ? '月' : period === 'quarterly' ? '季' : '年'}
                </Text>
              </Card>
            ))}
          </XStack>

          {/* Metric Selector */}
          <XStack gap="$2">
            <TabButton
              label="距離"
              icon={Route}
              active={activeMetric === 'distance'}
              onPress={() => setActiveMetric('distance')}
            />
            <TabButton
              label="時長"
              icon={Timer}
              active={activeMetric === 'duration'}
              onPress={() => setActiveMetric('duration')}
            />
            <TabButton
              label="次數"
              icon={TrendingUp}
              active={activeMetric === 'workouts'}
              onPress={() => setActiveMetric('workouts')}
            />
            <TabButton
              label="卡路里"
              icon={Flame}
              active={activeMetric === 'calories'}
              onPress={() => setActiveMetric('calories')}
            />
          </XStack>

          {/* Error State */}
          {error && (
            <Card bg="$red2" p="$4" br="$4">
              <Text color="$red10" ta="center">{error}</Text>
              <Button mt="$3" onPress={fetchLeaderboard} bg="$red10">
                <Text color="white">重試</Text>
              </Button>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <YStack ai="center" jc="center" py="$8">
              <Spinner size="large" color="$blue10" />
              <Text mt="$3" color="$gray10">載入排行榜中...</Text>
            </YStack>
          )}

          {/* Empty State - No Friends */}
          {!loading && !error && leaderboardData?.entries.length === 0 && (
            <YStack ai="center" jc="center" py="$8" gap="$4">
              <Users size={64} color="$gray8" />
              <Text fontSize="$5" fontWeight="700" color="$gray10">還沒有好友</Text>
              <Text color="$gray9" ta="center">
                添加好友後即可查看排行榜{'\n'}和好友一起運動更有動力！
              </Text>
              <Button bg="$blue10" onPress={handleAddFriend} mt="$2">
                <UserPlus size={20} color="white" />
                <Text color="white" ml="$2">添加好友</Text>
              </Button>
            </YStack>
          )}

          {/* Leaderboard List */}
          {!loading && !error && leaderboardData && leaderboardData.entries.length > 0 && (
            <YStack gap="$1">
              <XStack ai="center" gap="$2" mb="$2">
                <Trophy size={20} color="$color" />
                <Text fontSize="$5" fontWeight="700" color="$color">
                  {getPeriodLabel()}排行榜
                </Text>
              </XStack>

              {leaderboardData.entries.map((entry) => (
                <LeaderboardItem
                  key={entry.user_id}
                  rank={entry.rank}
                  name={entry.display_name}
                  avatar={entry.avatar_url}
                  value={entry.metric_value}
                  unit={getUnit()}
                  isCurrentUser={entry.rank === leaderboardData.my_rank}
                />
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
