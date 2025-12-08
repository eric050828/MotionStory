/**
 * Workout Detail Screen
 * 運動詳情頁面 - 顯示單次運動的完整資訊
 */

import React, { useEffect, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, Button } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronLeft, Route, Timer, Flame, TrendingUp,
  Calendar, Clock, MapPin, Heart, Share2, Trash2
} from '@tamagui/lucide-icons';
import useWorkoutStore from '../../src/store/workoutStore';

// Stat Item Component
const StatItem: React.FC<{
  icon: any;
  label: string;
  value: string | number;
  unit?: string;
  gradient: string[];
}> = ({ icon: Icon, label, value, unit, gradient }) => (
  <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor" flex={1}>
    <YStack gap="$2">
      <XStack ai="center" gap="$2">
        <LinearGradient
          colors={gradient}
          start={[0, 0]}
          end={[1, 1]}
          width={32}
          height={32}
          borderRadius={8}
          ai="center"
          jc="center"
        >
          <Icon size={16} color="white" />
        </LinearGradient>
        <Text fontSize="$2" color="$gray10">{label}</Text>
      </XStack>
      <XStack ai="baseline" gap="$1">
        <Text fontSize="$6" fontWeight="900" color="$color">{value}</Text>
        {unit && <Text fontSize="$2" color="$gray9">{unit}</Text>}
      </XStack>
    </YStack>
  </Card>
);

// Workout Type Config
const workoutTypeConfig: Record<string, { name: string; gradient: string[]; icon: string }> = {
  running: { name: '跑步', gradient: ['#667eea', '#764ba2'], icon: '🏃' },
  cycling: { name: '騎車', gradient: ['#f093fb', '#f5576c'], icon: '🚴' },
  swimming: { name: '游泳', gradient: ['#4facfe', '#00f2fe'], icon: '🏊' },
  walking: { name: '健走', gradient: ['#11998e', '#38ef7d'], icon: '🚶' },
  hiking: { name: '登山', gradient: ['#ff9a9e', '#fecfef'], icon: '🥾' },
  gym: { name: '健身', gradient: ['#a8edea', '#fed6e3'], icon: '🏋️' },
  yoga: { name: '瑜珈', gradient: ['#d299c2', '#fef9d7'], icon: '🧘' },
  default: { name: '運動', gradient: ['#667eea', '#764ba2'], icon: '💪' },
};

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { workouts, loading, fetchWorkouts } = useWorkoutStore();

  useEffect(() => {
    if (workouts.length === 0) {
      fetchWorkouts();
    }
  }, []);

  // Find the workout
  const workout = useMemo(() => {
    return workouts.find(w => w.id === id);
  }, [workouts, id]);

  // Get workout type config
  const typeConfig = useMemo(() => {
    if (!workout) return workoutTypeConfig.default;
    return workoutTypeConfig[workout.workout_type.toLowerCase()] || workoutTypeConfig.default;
  }, [workout]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      weekday: date.toLocaleDateString('zh-TW', { weekday: 'long' }),
    };
  };

  // Loading state
  if (loading && !workout) {
    return (
      <YStack flex={1} bg="$background" ai="center" jc="center">
        <Spinner size="large" color="$blue10" />
        <Text mt="$3" color="$gray10">載入運動資料中...</Text>
      </YStack>
    );
  }

  // Not found state
  if (!workout) {
    return (
      <YStack flex={1} bg="$background" ai="center" jc="center" gap="$4">
        <Stack.Screen
          options={{
            title: '運動詳情',
            headerLeft: () => (
              <XStack onPress={() => router.back()} p="$2" cursor="pointer">
                <ChevronLeft size={24} color="$color" />
              </XStack>
            ),
          }}
        />
        <Text fontSize="$6" color="$gray10">找不到這筆運動記錄</Text>
        <Button onPress={() => router.back()} bg="$blue9" color="white">
          返回
        </Button>
      </YStack>
    );
  }

  const dateInfo = formatDate(workout.start_time);

  return (
    <YStack flex={1} bg="$background">
      <Stack.Screen
        options={{
          title: '運動詳情',
          headerLeft: () => (
            <XStack onPress={() => router.back()} p="$2" cursor="pointer">
              <ChevronLeft size={24} color="$color" />
            </XStack>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack p="$4" gap="$4">
          {/* Header Card */}
          <LinearGradient
            colors={typeConfig.gradient}
            start={[0, 0]}
            end={[1, 1]}
            br="$4"
            p="$5"
          >
            <YStack gap="$3">
              <XStack ai="center" gap="$3">
                <Text fontSize={48}>{typeConfig.icon}</Text>
                <YStack flex={1}>
                  <Text fontSize="$8" fontWeight="900" color="white">
                    {workout.title || typeConfig.name}
                  </Text>
                  <Text fontSize="$3" color="white" opacity={0.8}>
                    {typeConfig.name}
                  </Text>
                </YStack>
              </XStack>

              {/* Quick Stats */}
              <XStack gap="$4" mt="$2">
                <YStack>
                  <Text fontSize="$2" color="white" opacity={0.7}>距離</Text>
                  <Text fontSize="$6" fontWeight="900" color="white">
                    {workout.distance_km?.toFixed(2) || '0.00'} km
                  </Text>
                </YStack>
                <YStack>
                  <Text fontSize="$2" color="white" opacity={0.7}>時間</Text>
                  <Text fontSize="$6" fontWeight="900" color="white">
                    {workout.duration_minutes || 0} 分鐘
                  </Text>
                </YStack>
                <YStack>
                  <Text fontSize="$2" color="white" opacity={0.7}>消耗</Text>
                  <Text fontSize="$6" fontWeight="900" color="white">
                    {workout.calories_burned || 0} 卡
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </LinearGradient>

          {/* Date & Time Info */}
          <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor">
            <XStack gap="$4">
              <XStack ai="center" gap="$2" flex={1}>
                <Calendar size={20} color="$blue10" />
                <YStack>
                  <Text fontSize="$2" color="$gray10">日期</Text>
                  <Text fontSize="$4" fontWeight="600" color="$color">{dateInfo.date}</Text>
                </YStack>
              </XStack>
              <XStack ai="center" gap="$2" flex={1}>
                <Clock size={20} color="$green10" />
                <YStack>
                  <Text fontSize="$2" color="$gray10">時間</Text>
                  <Text fontSize="$4" fontWeight="600" color="$color">
                    {dateInfo.time} ({dateInfo.weekday})
                  </Text>
                </YStack>
              </XStack>
            </XStack>
          </Card>

          {/* Detailed Stats */}
          <YStack gap="$2">
            <Text fontSize="$5" fontWeight="700" color="$color">詳細數據</Text>
            <XStack gap="$3">
              <StatItem
                icon={Route}
                label="距離"
                value={workout.distance_km?.toFixed(2) || '0.00'}
                unit="公里"
                gradient={['#667eea', '#764ba2']}
              />
              <StatItem
                icon={Timer}
                label="時間"
                value={workout.duration_minutes || 0}
                unit="分鐘"
                gradient={['#11998e', '#38ef7d']}
              />
            </XStack>
            <XStack gap="$3">
              <StatItem
                icon={Flame}
                label="消耗熱量"
                value={workout.calories_burned || 0}
                unit="大卡"
                gradient={['#f093fb', '#f5576c']}
              />
              <StatItem
                icon={TrendingUp}
                label="平均配速"
                value={
                  workout.distance_km && workout.duration_minutes
                    ? (workout.duration_minutes / workout.distance_km).toFixed(2)
                    : '--'
                }
                unit="分/公里"
                gradient={['#4facfe', '#00f2fe']}
              />
            </XStack>
          </YStack>

          {/* Heart Rate (if available) */}
          {(workout.avg_heart_rate || workout.max_heart_rate) && (
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="700" color="$color">心率數據</Text>
              <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor">
                <XStack gap="$4">
                  {workout.avg_heart_rate && (
                    <XStack ai="center" gap="$2" flex={1}>
                      <Heart size={24} color="$red10" />
                      <YStack>
                        <Text fontSize="$2" color="$gray10">平均心率</Text>
                        <XStack ai="baseline" gap="$1">
                          <Text fontSize="$6" fontWeight="900" color="$color">
                            {workout.avg_heart_rate}
                          </Text>
                          <Text fontSize="$2" color="$gray9">bpm</Text>
                        </XStack>
                      </YStack>
                    </XStack>
                  )}
                  {workout.max_heart_rate && (
                    <XStack ai="center" gap="$2" flex={1}>
                      <Heart size={24} color="$orange10" />
                      <YStack>
                        <Text fontSize="$2" color="$gray10">最高心率</Text>
                        <XStack ai="baseline" gap="$1">
                          <Text fontSize="$6" fontWeight="900" color="$color">
                            {workout.max_heart_rate}
                          </Text>
                          <Text fontSize="$2" color="$gray9">bpm</Text>
                        </XStack>
                      </YStack>
                    </XStack>
                  )}
                </XStack>
              </Card>
            </YStack>
          )}

          {/* Location (if available) */}
          {workout.location && (
            <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor">
              <XStack ai="center" gap="$3">
                <MapPin size={24} color="$blue10" />
                <YStack flex={1}>
                  <Text fontSize="$2" color="$gray10">地點</Text>
                  <Text fontSize="$4" fontWeight="600" color="$color">
                    {workout.location}
                  </Text>
                </YStack>
              </XStack>
            </Card>
          )}

          {/* Notes (if available) */}
          {workout.notes && (
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="700" color="$color">備註</Text>
              <Card bg="$background" br="$4" p="$4" borderWidth={1} borderColor="$borderColor">
                <Text fontSize="$4" color="$color" lineHeight={24}>
                  {workout.notes}
                </Text>
              </Card>
            </YStack>
          )}

          {/* Action Buttons */}
          <XStack gap="$3" pt="$4">
            <Button flex={1} icon={<Share2 size={18} />} bg="$blue9" size="$4">
              分享
            </Button>
            <Button
              flex={1}
              icon={<Trash2 size={18} />}
              bg="$red9"
              size="$4"
              onPress={() => {
                // TODO: Implement delete
                router.back();
              }}
            >
              刪除
            </Button>
          </XStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
