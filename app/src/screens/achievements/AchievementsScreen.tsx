/**
 * Achievements Screen
 * 成就總覽頁面 - 顯示所有成就與進度
 */

import React, { useEffect, useMemo } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { YStack, XStack, Text, Spinner, Card } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import { useNavigation } from '@react-navigation/native';
import {
  Trophy, Flame, Heart, Crown, Medal, Star,
  Footprints, Route, Timer, Award, ChevronLeft, Lock
} from '@tamagui/lucide-icons';
import useAchievementStore from '../../store/achievementStore';

// Achievement type configuration
const achievementConfig: Record<string, {
  bg: string[];
  icon: any;
  label: string;
  category: string;
}> = {
  first_workout: { bg: ['#FFD700', '#FFA500'], icon: Star, label: '首次運動', category: '基礎' },
  streak_3: { bg: ['#FF6B6B', '#FF8E53'], icon: Flame, label: '3天連續', category: '連續' },
  streak_7: { bg: ['#FF6B35', '#F7931E'], icon: Flame, label: '7天連續', category: '連續' },
  streak_30: { bg: ['#FF4500', '#FF6347'], icon: Flame, label: '30天連續', category: '連續' },
  streak_60: { bg: ['#DC143C', '#FF4500'], icon: Crown, label: '60天連續', category: '連續' },
  streak_90: { bg: ['#B22222', '#DC143C'], icon: Crown, label: '90天連續', category: '連續' },
  streak_100: { bg: ['#8B0000', '#B22222'], icon: Crown, label: '100天連續', category: '連續' },
  streak_180: { bg: ['#4B0082', '#8B008B'], icon: Crown, label: '180天連續', category: '連續' },
  streak_365: { bg: ['#FFD700', '#FF4500'], icon: Crown, label: '全年連續', category: '連續' },
  distance_5k: { bg: ['#4CAF50', '#8BC34A'], icon: Footprints, label: '5公里', category: '距離' },
  distance_10k: { bg: ['#2196F3', '#03A9F4'], icon: Footprints, label: '10公里', category: '距離' },
  distance_half_marathon: { bg: ['#9C27B0', '#E91E63'], icon: Medal, label: '半馬', category: '距離' },
  distance_marathon: { bg: ['#FFD700', '#FFC107'], icon: Trophy, label: '全馬', category: '距離' },
  total_100km: { bg: ['#607D8B', '#78909C'], icon: Route, label: '累計100km', category: '累計' },
  total_500km: { bg: ['#795548', '#8D6E63'], icon: Route, label: '累計500km', category: '累計' },
  total_1000km: { bg: ['#FF9800', '#FFB74D'], icon: Route, label: '累計1000km', category: '累計' },
  total_5000km: { bg: ['#F44336', '#E57373'], icon: Route, label: '累計5000km', category: '累計' },
  total_50hours: { bg: ['#00BCD4', '#4DD0E1'], icon: Timer, label: '50小時', category: '時間' },
  total_100hours: { bg: ['#009688', '#4DB6AC'], icon: Timer, label: '100小時', category: '時間' },
  total_500hours: { bg: ['#3F51B5', '#7986CB'], icon: Timer, label: '500小時', category: '時間' },
  total_1000hours: { bg: ['#673AB7', '#9575CD'], icon: Timer, label: '1000小時', category: '時間' },
  likes_10: { bg: ['#E91E63', '#F48FB1'], icon: Heart, label: '10讚', category: '社交' },
  likes_50: { bg: ['#E91E63', '#EC407A'], icon: Heart, label: '50讚', category: '社交' },
  likes_100: { bg: ['#C2185B', '#E91E63'], icon: Heart, label: '100讚', category: '社交' },
  likes_500: { bg: ['#880E4F', '#C2185B'], icon: Heart, label: '500讚', category: '社交' },
  personal_record_distance: { bg: ['#00C853', '#69F0AE'], icon: Star, label: '距離紀錄', category: '紀錄' },
};

// Achievement Badge Component
const AchievementBadge: React.FC<{
  type: string;
  unlocked: boolean;
  unlockedAt?: string;
}> = ({ type, unlocked, unlockedAt }) => {
  const config = achievementConfig[type] || {
    bg: ['#9E9E9E', '#757575'],
    icon: Award,
    label: type.replace(/_/g, ' '),
    category: '其他'
  };
  const IconComponent = config.icon;

  return (
    <Card
      bg="$background"
      br="$4"
      p="$3"
      borderWidth={1}
      borderColor={unlocked ? "$green8" : "$gray5"}
      opacity={unlocked ? 1 : 0.5}
      elevation={unlocked ? "$2" : "$0"}
    >
      <YStack ai="center" gap="$2">
        <LinearGradient
          colors={unlocked ? config.bg : ['#9E9E9E', '#757575']}
          start={[0, 0]}
          end={[1, 1]}
          width={64}
          height={64}
          borderRadius={32}
          ai="center"
          jc="center"
          shadowColor={unlocked ? "rgba(0,0,0,0.3)" : "transparent"}
          shadowOffset={{ width: 0, height: 4 }}
          shadowOpacity={1}
          shadowRadius={8}
          elevation={unlocked ? 6 : 0}
        >
          {unlocked ? (
            <IconComponent size={28} color="white" />
          ) : (
            <Lock size={24} color="white" />
          )}
        </LinearGradient>

        <YStack ai="center" gap="$1">
          <Text fontSize="$3" fontWeight="700" color={unlocked ? "$color" : "$gray9"} ta="center">
            {config.label}
          </Text>
          <Text fontSize="$1" color="$gray9" ta="center">
            {config.category}
          </Text>
          {unlocked && unlockedAt && (
            <Text fontSize="$1" color="$green10" fontWeight="500">
              {new Date(unlockedAt).toLocaleDateString('zh-TW')}
            </Text>
          )}
        </YStack>
      </YStack>
    </Card>
  );
};

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { achievements, loading, fetchAchievements } = useAchievementStore();

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Get unlocked achievement types
  const unlockedTypes = useMemo(() => {
    const types = new Set<string>();
    achievements.forEach(a => types.add(a.achievement_type));
    return types;
  }, [achievements]);

  // Group achievements by category
  const categories = useMemo(() => {
    const cats: Record<string, { type: string; unlocked: boolean; unlockedAt?: string }[]> = {};

    Object.entries(achievementConfig).forEach(([type, config]) => {
      if (!cats[config.category]) {
        cats[config.category] = [];
      }
      const achievement = achievements.find(a => a.achievement_type === type);
      cats[config.category].push({
        type,
        unlocked: unlockedTypes.has(type),
        unlockedAt: achievement?.achieved_at
      });
    });

    return cats;
  }, [achievements, unlockedTypes]);

  // Statistics
  const stats = useMemo(() => ({
    total: Object.keys(achievementConfig).length,
    unlocked: unlockedTypes.size,
    percentage: Math.round((unlockedTypes.size / Object.keys(achievementConfig).length) * 100)
  }), [unlockedTypes]);

  return (
    <YStack flex={1} bg="$background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAchievements} />
        }
      >
        <YStack p="$4" gap="$4">
          {/* Summary Card */}
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={[0, 0]}
            end={[1, 1]}
            br="$4"
            p="$4"
          >
            <XStack jc="space-between" ai="center">
              <YStack>
                <Text fontSize="$8" fontWeight="900" color="white">
                  {stats.unlocked} / {stats.total}
                </Text>
                <Text fontSize="$3" color="white" opacity={0.8}>
                  成就已解鎖
                </Text>
              </YStack>
              <YStack ai="center">
                <Text fontSize="$9" fontWeight="900" color="white">
                  {stats.percentage}%
                </Text>
                <Text fontSize="$2" color="white" opacity={0.8}>
                  完成度
                </Text>
              </YStack>
            </XStack>
          </LinearGradient>

          {/* Categories */}
          {Object.entries(categories).map(([category, items]) => {
            const unlockedCount = items.filter(i => i.unlocked).length;
            return (
              <YStack key={category} gap="$3">
                <XStack jc="space-between" ai="center">
                  <Text fontSize="$5" fontWeight="700" color="$color">
                    {category}
                  </Text>
                  <Text fontSize="$2" color="$gray10">
                    {unlockedCount}/{items.length}
                  </Text>
                </XStack>

                <XStack flexWrap="wrap" gap="$3">
                  {items.map(item => (
                    <YStack key={item.type} width="30%" minWidth={100}>
                      <AchievementBadge
                        type={item.type}
                        unlocked={item.unlocked}
                        unlockedAt={item.unlockedAt}
                      />
                    </YStack>
                  ))}
                </XStack>
              </YStack>
            );
          })}

          {/* Loading state */}
          {loading && achievements.length === 0 && (
            <YStack ai="center" jc="center" py="$8">
              <Spinner size="large" color="$blue10" />
              <Text mt="$3" color="$gray10">載入成就中...</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default AchievementsScreen;
