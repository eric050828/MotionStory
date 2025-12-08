/**
 * Stats Detail Screen
 * 統計詳情頁面 - 詳細運動數據分析
 */

import React, { useEffect, useMemo } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner, Card } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft, TrendingUp, Activity, Route, Timer,
  Flame, Target, Calendar, BarChart3
} from '@tamagui/lucide-icons';
import useWorkoutStore from '../../src/store/workoutStore';

// Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  gradient: string[];
}> = ({ title, value, subtitle, icon: Icon, gradient }) => (
  <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor" flex={1}>
    <YStack gap="$2">
      <XStack ai="center" gap="$2">
        <LinearGradient
          colors={gradient}
          start={[0, 0]}
          end={[1, 1]}
          width={36}
          height={36}
          borderRadius={10}
          ai="center"
          jc="center"
        >
          <Icon size={18} color="white" />
        </LinearGradient>
        <Text fontSize="$2" color="$gray10" fontWeight="500">{title}</Text>
      </XStack>
      <Text fontSize="$7" fontWeight="900" color="$color">{value}</Text>
      {subtitle && (
        <Text fontSize="$2" color="$gray9">{subtitle}</Text>
      )}
    </YStack>
  </Card>
);

// Weekly Progress Bar
const WeeklyBar: React.FC<{
  day: string;
  value: number;
  maxValue: number;
  isToday: boolean;
}> = ({ day, value, maxValue, isToday }) => {
  const height = maxValue > 0 ? Math.max((value / maxValue) * 100, 5) : 5;

  return (
    <YStack ai="center" gap="$1" flex={1}>
      <YStack height={100} jc="flex-end" width={24}>
        <LinearGradient
          colors={value > 0 ? ['#667eea', '#764ba2'] : ['#E0E0E0', '#BDBDBD']}
          start={[0, 0]}
          end={[0, 1]}
          height={`${height}%`}
          width={24}
          borderRadius={4}
        />
      </YStack>
      <Text
        fontSize="$1"
        fontWeight={isToday ? "700" : "500"}
        color={isToday ? "$blue10" : "$gray10"}
      >
        {day}
      </Text>
      <Text fontSize="$1" color="$gray9">{value}</Text>
    </YStack>
  );
};

export default function StatsScreen() {
  const router = useRouter();
  const { workouts, stats, loading, fetchWorkouts, fetchStats } = useWorkoutStore();

  useEffect(() => {
    fetchWorkouts();
    fetchStats();
  }, []);

  // Calculate various statistics
  const calculations = useMemo(() => {
    const validWorkouts = workouts.filter(w => !w.is_deleted);

    // Total stats
    const totalWorkouts = validWorkouts.length;
    const totalDistance = validWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);
    const totalDuration = validWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const totalCalories = validWorkouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);

    // Weekly stats
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyWorkouts = validWorkouts.filter(w => new Date(w.start_time) >= weekStart);
    const weeklyDistance = weeklyWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);
    const weeklyDuration = weeklyWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

    // Daily breakdown for the week
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayWorkouts = validWorkouts.filter(w => {
        const wDate = new Date(w.start_time);
        return wDate.toDateString() === date.toDateString();
      });
      return {
        day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
        count: dayWorkouts.length,
        isToday: date.toDateString() === now.toDateString()
      };
    });
    const maxDaily = Math.max(...dailyData.map(d => d.count), 1);

    // Monthly stats
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyWorkouts = validWorkouts.filter(w => new Date(w.start_time) >= monthStart);
    const monthlyDistance = monthlyWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0);

    // Workout type breakdown
    const typeBreakdown: Record<string, number> = {};
    validWorkouts.forEach(w => {
      typeBreakdown[w.workout_type] = (typeBreakdown[w.workout_type] || 0) + 1;
    });

    // Average per workout
    const avgDistance = totalWorkouts > 0 ? totalDistance / totalWorkouts : 0;
    const avgDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

    // Streak calculation
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
      totalWorkouts,
      totalDistance,
      totalDuration,
      totalCalories,
      weeklyWorkouts: weeklyWorkouts.length,
      weeklyDistance,
      weeklyDuration,
      monthlyDistance,
      monthlyWorkouts: monthlyWorkouts.length,
      dailyData,
      maxDaily,
      typeBreakdown,
      avgDistance,
      avgDuration,
      streak
    };
  }, [workouts]);

  return (
    <YStack flex={1} bg="$background">
      <Stack.Screen
        options={{
          title: '運動統計',
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
          <RefreshControl refreshing={loading} onRefresh={() => { fetchWorkouts(); fetchStats(); }} />
        }
      >
        <YStack p="$4" gap="$4">
          {/* Summary Header */}
          <LinearGradient
            colors={['#11998e', '#38ef7d']}
            start={[0, 0]}
            end={[1, 1]}
            br="$4"
            p="$4"
          >
            <YStack gap="$3">
              <XStack jc="space-between" ai="center">
                <YStack>
                  <Text fontSize="$3" color="white" opacity={0.8}>總運動次數</Text>
                  <Text fontSize="$9" fontWeight="900" color="white">
                    {calculations.totalWorkouts}
                  </Text>
                </YStack>
                <YStack ai="flex-end">
                  <XStack ai="center" gap="$1">
                    <Flame size={20} color="white" />
                    <Text fontSize="$6" fontWeight="700" color="white">
                      {calculations.streak}
                    </Text>
                  </XStack>
                  <Text fontSize="$2" color="white" opacity={0.8}>天連續</Text>
                </YStack>
              </XStack>
            </YStack>
          </LinearGradient>

          {/* Weekly Chart */}
          <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor">
            <YStack gap="$3">
              <XStack ai="center" gap="$2">
                <BarChart3 size={20} color="$color" />
                <Text fontSize="$4" fontWeight="700" color="$color">本週運動</Text>
              </XStack>
              <XStack jc="space-between" px="$2">
                {calculations.dailyData.map((d, i) => (
                  <WeeklyBar
                    key={i}
                    day={d.day}
                    value={d.count}
                    maxValue={calculations.maxDaily}
                    isToday={d.isToday}
                  />
                ))}
              </XStack>
            </YStack>
          </Card>

          {/* Weekly Stats */}
          <XStack gap="$3">
            <StatCard
              title="本週次數"
              value={calculations.weeklyWorkouts}
              subtitle="次運動"
              icon={Activity}
              gradient={['#667eea', '#764ba2']}
            />
            <StatCard
              title="本週距離"
              value={calculations.weeklyDistance.toFixed(1)}
              subtitle="公里"
              icon={Route}
              gradient={['#f093fb', '#f5576c']}
            />
          </XStack>

          <XStack gap="$3">
            <StatCard
              title="本週時間"
              value={calculations.weeklyDuration}
              subtitle="分鐘"
              icon={Timer}
              gradient={['#4facfe', '#00f2fe']}
            />
            <StatCard
              title="本月距離"
              value={calculations.monthlyDistance.toFixed(1)}
              subtitle="公里"
              icon={Calendar}
              gradient={['#fa709a', '#fee140']}
            />
          </XStack>

          {/* Total Stats */}
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="700" color="$color">累計數據</Text>
            <XStack gap="$3">
              <StatCard
                title="總距離"
                value={calculations.totalDistance.toFixed(1)}
                subtitle="公里"
                icon={Route}
                gradient={['#11998e', '#38ef7d']}
              />
              <StatCard
                title="總時間"
                value={Math.round(calculations.totalDuration / 60)}
                subtitle="小時"
                icon={Timer}
                gradient={['#667eea', '#764ba2']}
              />
            </XStack>
          </YStack>

          {/* Average Stats */}
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="700" color="$color">平均數據</Text>
            <XStack gap="$3">
              <StatCard
                title="平均距離"
                value={calculations.avgDistance.toFixed(1)}
                subtitle="公里/次"
                icon={TrendingUp}
                gradient={['#f093fb', '#f5576c']}
              />
              <StatCard
                title="平均時長"
                value={Math.round(calculations.avgDuration)}
                subtitle="分鐘/次"
                icon={Timer}
                gradient={['#4facfe', '#00f2fe']}
              />
            </XStack>
          </YStack>

          {/* Workout Type Breakdown */}
          {Object.keys(calculations.typeBreakdown).length > 0 && (
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="700" color="$color">運動類型分布</Text>
              <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor">
                <YStack gap="$3">
                  {Object.entries(calculations.typeBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const percentage = Math.round((count / calculations.totalWorkouts) * 100);
                      return (
                        <YStack key={type} gap="$1">
                          <XStack jc="space-between">
                            <Text fontSize="$3" fontWeight="600" color="$color" tt="capitalize">
                              {type}
                            </Text>
                            <Text fontSize="$2" color="$gray10">
                              {count} 次 ({percentage}%)
                            </Text>
                          </XStack>
                          <YStack height={8} bg="$gray4" br={4} overflow="hidden">
                            <LinearGradient
                              colors={['#667eea', '#764ba2']}
                              start={[0, 0]}
                              end={[1, 0]}
                              height={8}
                              width={`${percentage}%`}
                              br={4}
                            />
                          </YStack>
                        </YStack>
                      );
                    })}
                </YStack>
              </Card>
            </YStack>
          )}

          {/* Loading state */}
          {loading && workouts.length === 0 && (
            <YStack ai="center" jc="center" py="$8">
              <Spinner size="large" color="$blue10" />
              <Text mt="$3" color="$gray10">載入統計中...</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
