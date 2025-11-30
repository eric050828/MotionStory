/**
 * WidgetContentRenderer
 * 根據 Widget 類型渲染對應內容
 */

import React, { useEffect } from 'react';
import { YStack, XStack, Text, Paragraph, Spinner } from 'tamagui';
import { Flame, TrendingUp, Route, Trophy, Activity, Calendar, Award, Medal } from '@tamagui/lucide-icons';
import useWorkoutStore from '../../store/workoutStore';
import useAchievementStore from '../../store/achievementStore';
import type { Widget, WidgetConfig } from '../../types/dashboard';

interface WidgetContentRendererProps {
  widget: Widget;
  colors: {
    bg: string;
    color: string;
  };
  compact?: boolean;
}

export const WidgetContentRenderer: React.FC<WidgetContentRendererProps> = ({
  widget,
  colors,
  compact = false,
}) => {
  const { workouts, stats, fetchWorkouts, fetchStats, loading } = useWorkoutStore();
  const { achievements, fetchAchievements } = useAchievementStore();

  useEffect(() => {
    // 根據 widget 類型載入需要的資料
    if (widget.type === 'streak_counter' || widget.type === 'weekly_stats') {
      if (workouts.length === 0) fetchWorkouts();
      if (!stats) fetchStats();
    }
    if (widget.type === 'achievement_showcase') {
      if (achievements.length === 0) fetchAchievements();
    }
  }, [widget.type]);

  // 計算連續天數
  const calculateStreak = (): number => {
    if (workouts.length === 0) return 0;

    const sortedWorkouts = [...workouts]
      .filter(w => !w.is_deleted)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

    if (sortedWorkouts.length === 0) return 0;

    let streak = 0;
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

    return streak;
  };

  // 計算本週統計
  const calculateWeeklyStats = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.start_time);
      return workoutDate >= weekStart && !w.is_deleted;
    });

    return {
      count: weeklyWorkouts.length,
      totalDuration: weeklyWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0),
      totalDistance: weeklyWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0),
    };
  };

  // 計算本月距離
  const calculateMonthlyDistance = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyWorkouts = workouts.filter(w => {
      const workoutDate = new Date(w.start_time);
      return workoutDate >= monthStart && !w.is_deleted;
    });

    return {
      totalDistance: monthlyWorkouts.reduce((sum, w) => sum + (w.distance_km || 0), 0),
      workoutCount: monthlyWorkouts.length,
    };
  };

  const renderContent = () => {
    switch (widget.type) {
      case 'streak_counter': {
        const streak = calculateStreak();
        return (
          <YStack ai="center" jc="center" flex={1} gap="$2">
            <XStack ai="center" gap="$2">
              <Flame size={compact ? 24 : 32} color={streak > 0 ? '#FF6B35' : '#999'} />
              <Text
                fontSize={compact ? '$8' : '$10'}
                fontWeight="900"
                color={colors.color}
              >
                {streak}
              </Text>
            </XStack>
            <XStack ai="center" gap="$1">
              <Text fontSize="$3" color={colors.color} opacity={0.8}>
                {streak > 0 ? '天連續運動' : '開始你的連續紀錄！'}
              </Text>
              {streak > 0 && <Flame size={14} color="#FF6B35" />}
            </XStack>
          </YStack>
        );
      }

      case 'weekly_stats': {
        const weekStats = calculateWeeklyStats();
        return (
          <YStack flex={1} gap="$2" jc="center">
            <XStack ai="center" gap="$2">
              <TrendingUp size={20} color={colors.color} />
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                本週統計
              </Text>
            </XStack>
            <XStack gap="$4" flexWrap="wrap">
              <YStack>
                <Text fontSize="$6" fontWeight="800" color={colors.color}>
                  {weekStats.count}
                </Text>
                <Text fontSize="$2" color={colors.color} opacity={0.7}>
                  次運動
                </Text>
              </YStack>
              <YStack>
                <Text fontSize="$6" fontWeight="800" color={colors.color}>
                  {weekStats.totalDuration}
                </Text>
                <Text fontSize="$2" color={colors.color} opacity={0.7}>
                  分鐘
                </Text>
              </YStack>
              <YStack>
                <Text fontSize="$6" fontWeight="800" color={colors.color}>
                  {weekStats.totalDistance.toFixed(1)}
                </Text>
                <Text fontSize="$2" color={colors.color} opacity={0.7}>
                  公里
                </Text>
              </YStack>
            </XStack>
          </YStack>
        );
      }

      case 'monthly_distance': {
        const monthData = calculateMonthlyDistance();
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <Route size={compact ? 28 : 36} color={colors.color} />
            <YStack ai="center">
              <Text fontSize={compact ? '$8' : '$9'} fontWeight="900" color={colors.color}>
                {monthData.totalDistance.toFixed(1)}
              </Text>
              <Text fontSize="$3" color={colors.color} opacity={0.7}>
                公里
              </Text>
            </YStack>
            <Text fontSize="$2" color={colors.color} opacity={0.6}>
              本月 {monthData.workoutCount} 次運動
            </Text>
          </YStack>
        );
      }

      case 'achievement_showcase': {
        const recentAchievements = achievements.slice(0, 3);
        return (
          <YStack flex={1} gap="$2">
            <XStack ai="center" gap="$2">
              <Trophy size={20} color={colors.color} />
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                最新成就
              </Text>
            </XStack>
            {recentAchievements.length > 0 ? (
              <YStack gap="$1">
                {recentAchievements.map((achievement, index) => (
                  <XStack key={achievement.id || index} ai="center" gap="$2" py="$1">
                    <Award size={16} color={colors.color} />
                    <Text fontSize="$2" color={colors.color} numberOfLines={1} flex={1}>
                      {achievement.achievement_type || '成就'}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            ) : (
              <YStack ai="center" jc="center" flex={1}>
                <Text fontSize="$2" color={colors.color} opacity={0.6}>
                  開始運動解鎖成就
                </Text>
              </YStack>
            )}
          </YStack>
        );
      }

      case 'heart_rate_zone': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$2">
            <Activity size={28} color={colors.color} />
            <Text fontSize="$4" fontWeight="600" color={colors.color}>
              心率區間
            </Text>
            <Text fontSize="$2" color={colors.color} opacity={0.6}>
              連接裝置後顯示
            </Text>
          </YStack>
        );
      }

      case 'workout_calendar': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$2">
            <Calendar size={28} color={colors.color} />
            <Text fontSize="$4" fontWeight="600" color={colors.color}>
              運動日曆
            </Text>
            <Text fontSize="$2" color={colors.color} opacity={0.6}>
              {workouts.filter(w => !w.is_deleted).length} 次運動記錄
            </Text>
          </YStack>
        );
      }

      case 'pace_chart': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$2">
            <TrendingUp size={28} color={colors.color} />
            <Text fontSize="$4" fontWeight="600" color={colors.color}>
              配速圖表
            </Text>
            <Text fontSize="$2" color={colors.color} opacity={0.6}>
              即將推出
            </Text>
          </YStack>
        );
      }

      default:
        return (
          <YStack ai="center" jc="center" flex={1}>
            <Text fontSize="$3" color={colors.color} opacity={0.6}>
              {widget.type}
            </Text>
          </YStack>
        );
    }
  };

  if (loading) {
    return (
      <YStack ai="center" jc="center" flex={1}>
        <Spinner size="small" color={colors.color} />
      </YStack>
    );
  }

  return renderContent();
};

export default WidgetContentRenderer;
