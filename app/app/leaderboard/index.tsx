/**
 * Leaderboard Screen
 * 排行榜頁面 - 與好友比較運動量
 */

import React, { useEffect, useState, useMemo } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, Avatar, Circle } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft, Trophy, Medal, Crown, Users,
  Route, Timer, Flame, TrendingUp
} from '@tamagui/lucide-icons';
import useWorkoutStore from '../../src/store/workoutStore';

// Mock leaderboard data (in real app, this would come from API)
const mockLeaderboardData = [
  { id: '1', name: '小明', avatar: null, distance: 156.8, workouts: 28, streak: 15 },
  { id: '2', name: '小華', avatar: null, distance: 142.3, workouts: 25, streak: 12 },
  { id: '3', name: '小美', avatar: null, distance: 128.5, workouts: 22, streak: 8 },
  { id: '4', name: '阿強', avatar: null, distance: 115.2, workouts: 20, streak: 6 },
  { id: '5', name: '小芳', avatar: null, distance: 98.7, workouts: 18, streak: 5 },
  { id: '6', name: '阿偉', avatar: null, distance: 87.4, workouts: 16, streak: 4 },
  { id: '7', name: '小琪', avatar: null, distance: 76.2, workouts: 14, streak: 3 },
];

type LeaderboardType = 'distance' | 'workouts' | 'streak';

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
  const { workouts, loading, fetchWorkouts } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<LeaderboardType>('distance');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Calculate current user stats
  const currentUserStats = useMemo(() => {
    const validWorkouts = workouts.filter(w => !w.is_deleted);
    const totalDistance = validWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);

    // Calculate streak
    let streak = 0;
    const sortedWorkouts = [...validWorkouts].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.start_time);
      workoutDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        streak++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }

    return {
      id: 'me',
      name: '我',
      avatar: null,
      distance: totalDistance,
      workouts: validWorkouts.length,
      streak
    };
  }, [workouts]);

  // Combine and sort leaderboard
  const leaderboard = useMemo(() => {
    const allUsers = [...mockLeaderboardData, currentUserStats];

    let sortKey: keyof typeof currentUserStats;
    switch (activeTab) {
      case 'distance':
        sortKey = 'distance';
        break;
      case 'workouts':
        sortKey = 'workouts';
        break;
      case 'streak':
        sortKey = 'streak';
        break;
      default:
        sortKey = 'distance';
    }

    return allUsers.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
  }, [activeTab, currentUserStats]);

  // Get unit for current tab
  const getUnit = () => {
    switch (activeTab) {
      case 'distance': return '公里';
      case 'workouts': return '次';
      case 'streak': return '天';
    }
  };

  // Get value for current tab
  const getValue = (user: typeof currentUserStats) => {
    switch (activeTab) {
      case 'distance': return user.distance;
      case 'workouts': return user.workouts;
      case 'streak': return user.streak;
    }
  };

  // Find current user rank
  const currentUserRank = leaderboard.findIndex(u => u.id === 'me') + 1;

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

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
                <Text fontSize="$3" color="white" opacity={0.8}>你的排名</Text>
                <XStack ai="baseline" gap="$1">
                  <Text fontSize="$10" fontWeight="900" color="white">
                    #{currentUserRank}
                  </Text>
                  <Text fontSize="$4" color="white" opacity={0.8}>
                    / {leaderboard.length}
                  </Text>
                </XStack>
              </YStack>
              <YStack ai="flex-end" gap="$1">
                <XStack ai="center" gap="$2">
                  <Route size={18} color="white" />
                  <Text fontSize="$5" fontWeight="700" color="white">
                    {currentUserStats.distance.toFixed(1)} km
                  </Text>
                </XStack>
                <XStack ai="center" gap="$2">
                  <Flame size={18} color="white" />
                  <Text fontSize="$4" color="white" opacity={0.9}>
                    {currentUserStats.streak} 天連續
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
              onPress={() => setActiveTab('distance')}
            />
            <TabButton
              label="運動次數"
              icon={TrendingUp}
              active={activeTab === 'workouts'}
              onPress={() => setActiveTab('workouts')}
            />
            <TabButton
              label="連續天數"
              icon={Flame}
              active={activeTab === 'streak'}
              onPress={() => setActiveTab('streak')}
            />
          </XStack>

          {/* Leaderboard List */}
          <YStack gap="$1">
            <XStack ai="center" gap="$2" mb="$2">
              <Users size={20} color="$color" />
              <Text fontSize="$5" fontWeight="700" color="$color">排行榜</Text>
            </XStack>

            {leaderboard.map((user, index) => (
              <LeaderboardItem
                key={user.id}
                rank={index + 1}
                name={user.name}
                avatar={user.avatar}
                value={getValue(user)}
                unit={getUnit()}
                isCurrentUser={user.id === 'me'}
              />
            ))}
          </YStack>

          {/* Loading state */}
          {loading && workouts.length === 0 && (
            <YStack ai="center" jc="center" py="$8">
              <Spinner size="large" color="$blue10" />
              <Text mt="$3" color="$gray10">載入排行榜中...</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
