/**
 * WidgetContentRenderer
 * 根據 Widget 類型渲染對應內容 - 現代化設計版本
 */

import React, { useEffect, useMemo } from 'react';
import { YStack, XStack, Text, Spinner, Circle, Square } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';
import Svg, { Circle as SvgCircle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import {
  Flame, TrendingUp, Route, Trophy, Activity, Calendar, Award,
  Target, Clock, Zap, BarChart3, PieChart, Users, Play, Plus,
  Medal, Star, Crown, Heart, Footprints, Timer, MapPin
} from '@tamagui/lucide-icons';
import useWorkoutStore from '../../store/workoutStore';
import useAchievementStore from '../../store/achievementStore';
import type { Widget } from '../../types/dashboard';

interface WidgetContentRendererProps {
  widget: Widget;
  colors: {
    bg: string;
    color: string;
  };
  compact?: boolean;
}

// 成就徽章顏色映射
const achievementColors: Record<string, { bg: string[]; icon: any; label: string }> = {
  first_workout: { bg: ['#FFD700', '#FFA500'], icon: Star, label: '首次運動' },
  streak_3: { bg: ['#FF6B6B', '#FF8E53'], icon: Flame, label: '3天連續' },
  streak_7: { bg: ['#FF6B35', '#F7931E'], icon: Flame, label: '7天連續' },
  streak_30: { bg: ['#FF4500', '#FF6347'], icon: Flame, label: '30天連續' },
  streak_60: { bg: ['#DC143C', '#FF4500'], icon: Crown, label: '60天連續' },
  streak_90: { bg: ['#B22222', '#DC143C'], icon: Crown, label: '90天連續' },
  streak_100: { bg: ['#8B0000', '#B22222'], icon: Crown, label: '100天連續' },
  streak_180: { bg: ['#4B0082', '#8B008B'], icon: Crown, label: '180天連續' },
  streak_365: { bg: ['#FFD700', '#FF4500'], icon: Crown, label: '全年連續' },
  distance_5k: { bg: ['#4CAF50', '#8BC34A'], icon: Footprints, label: '5公里' },
  distance_10k: { bg: ['#2196F3', '#03A9F4'], icon: Footprints, label: '10公里' },
  distance_half_marathon: { bg: ['#9C27B0', '#E91E63'], icon: Medal, label: '半馬' },
  distance_marathon: { bg: ['#FFD700', '#FFC107'], icon: Trophy, label: '全馬' },
  total_100km: { bg: ['#607D8B', '#78909C'], icon: Route, label: '累計100km' },
  total_500km: { bg: ['#795548', '#8D6E63'], icon: Route, label: '累計500km' },
  total_1000km: { bg: ['#FF9800', '#FFB74D'], icon: Route, label: '累計1000km' },
  total_5000km: { bg: ['#F44336', '#E57373'], icon: Route, label: '累計5000km' },
  total_50hours: { bg: ['#00BCD4', '#4DD0E1'], icon: Timer, label: '50小時' },
  total_100hours: { bg: ['#009688', '#4DB6AC'], icon: Timer, label: '100小時' },
  total_500hours: { bg: ['#3F51B5', '#7986CB'], icon: Timer, label: '500小時' },
  total_1000hours: { bg: ['#673AB7', '#9575CD'], icon: Timer, label: '1000小時' },
  likes_10: { bg: ['#E91E63', '#F48FB1'], icon: Heart, label: '10讚' },
  likes_50: { bg: ['#E91E63', '#EC407A'], icon: Heart, label: '50讚' },
  likes_100: { bg: ['#C2185B', '#E91E63'], icon: Heart, label: '100讚' },
  likes_500: { bg: ['#880E4F', '#C2185B'], icon: Heart, label: '500讚' },
  personal_record_distance: { bg: ['#00C853', '#69F0AE'], icon: Star, label: '距離紀錄' },
};

// SVG 圓環進度條元件
const CircularProgress: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  gradientColors: string[];
}> = ({ progress, size, strokeWidth, gradientColors }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="100%" stopColor={gradientColors[1]} />
        </SvgLinearGradient>
      </Defs>
      {/* 背景圓 */}
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E8E8E8"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* 進度圓 */}
      <SvgCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

// 成就徽章元件
const AchievementBadge: React.FC<{
  type: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ type, size = 'medium' }) => {
  const config = achievementColors[type] || {
    bg: ['#9E9E9E', '#757575'],
    icon: Award,
    label: type.replace(/_/g, ' ')
  };
  const IconComponent = config.icon;
  const sizeMap = { small: 36, medium: 48, large: 64 };
  const iconSizeMap = { small: 16, medium: 20, large: 28 };
  const badgeSize = sizeMap[size];
  const iconSize = iconSizeMap[size];

  return (
    <YStack ai="center" gap="$1">
      <LinearGradient
        colors={config.bg}
        start={[0, 0]}
        end={[1, 1]}
        width={badgeSize}
        height={badgeSize}
        borderRadius={badgeSize / 2}
        ai="center"
        jc="center"
        shadowColor="rgba(0,0,0,0.3)"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={1}
        shadowRadius={8}
        elevation={6}
      >
        <IconComponent size={iconSize} color="white" />
      </LinearGradient>
      {size !== 'small' && (
        <Text fontSize={size === 'large' ? '$2' : '$1'} fontWeight="600" color="$gray11" ta="center" numberOfLines={1}>
          {config.label}
        </Text>
      )}
    </YStack>
  );
};

// 統計卡片元件
const StatCard: React.FC<{
  value: string | number;
  label: string;
  icon?: any;
  color?: string;
}> = ({ value, label, icon: Icon, color = '#333' }) => (
  <YStack
    ai="center"
    gap="$1"
    bg="$gray2"
    px="$3"
    py="$2"
    br="$3"
    minWidth={70}
  >
    {Icon && <Icon size={16} color={color} />}
    <Text fontSize="$6" fontWeight="900" color={color}>
      {value}
    </Text>
    <Text fontSize="$1" color="$gray10" fontWeight="500">
      {label}
    </Text>
  </YStack>
);

export const WidgetContentRenderer: React.FC<WidgetContentRendererProps> = ({
  widget,
  colors,
  compact = false,
}) => {
  const { workouts, stats, fetchWorkouts, fetchStats, loading } = useWorkoutStore();
  const { achievements, fetchAchievements } = useAchievementStore();

  useEffect(() => {
    const workoutWidgets = [
      'streak_counter', 'weekly_stats', 'monthly_distance', 'workout_calendar',
      'progress_ring', 'recent_workouts', 'workout_heatmap', 'stats_comparison',
      'goal_tracker', 'line_chart', 'bar_chart', 'pie_chart'
    ];
    if (workoutWidgets.includes(widget.type)) {
      if (workouts.length === 0) fetchWorkouts();
      if (!stats) fetchStats();
    }
    if (widget.type === 'achievement_showcase') {
      if (achievements.length === 0) fetchAchievements();
    }
  }, [widget.type]);

  // 計算連續天數
  const streak = useMemo(() => {
    if (workouts.length === 0) return 0;
    const sortedWorkouts = [...workouts]
      .filter(w => !w.is_deleted)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    if (sortedWorkouts.length === 0) return 0;
    let count = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    for (const workout of sortedWorkouts) {
      const workoutDate = new Date(workout.start_time);
      workoutDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        count++;
        currentDate = workoutDate;
      } else {
        break;
      }
    }
    return count;
  }, [workouts]);

  // 計算本週統計
  const weeklyStats = useMemo(() => {
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
  }, [workouts]);

  // 計算本月距離
  const monthlyData = useMemo(() => {
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
  }, [workouts]);

  const renderContent = () => {
    switch (widget.type) {
      case 'streak_counter': {
        const flameColor = streak > 0 ? (streak >= 7 ? '#FF4500' : '#FF6B35') : '#CCCCCC';
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={streak > 0 ? ['#FF6B35', '#FF4500'] : ['#E0E0E0', '#BDBDBD']}
              start={[0, 0]}
              end={[1, 1]}
              width={compact ? 70 : 90}
              height={compact ? 70 : 90}
              borderRadius={45}
              ai="center"
              jc="center"
              shadowColor="rgba(255,107,53,0.4)"
              shadowOffset={{ width: 0, height: 6 }}
              shadowOpacity={streak > 0 ? 1 : 0}
              shadowRadius={12}
              elevation={streak > 0 ? 8 : 0}
            >
              <Flame size={compact ? 32 : 42} color="white" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize={compact ? '$8' : '$10'} fontWeight="900" color={colors.color}>
                {streak}
              </Text>
              <Text fontSize="$2" color="$gray10" fontWeight="500">
                {streak > 0 ? '天連續運動 🔥' : '開始你的連續紀錄！'}
              </Text>
            </YStack>
          </YStack>
        );
      }

      case 'weekly_stats': {
        return (
          <YStack flex={1} gap="$3">
            <XStack ai="center" gap="$2">
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={[0, 0]}
                end={[1, 1]}
                width={28}
                height={28}
                borderRadius={8}
                ai="center"
                jc="center"
              >
                <TrendingUp size={16} color="white" />
              </LinearGradient>
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                本週統計
              </Text>
            </XStack>
            <XStack jc="space-around" gap="$2">
              <StatCard
                value={weeklyStats.count}
                label="次運動"
                icon={Activity}
                color="#667eea"
              />
              <StatCard
                value={weeklyStats.totalDuration}
                label="分鐘"
                icon={Timer}
                color="#f093fb"
              />
              <StatCard
                value={weeklyStats.totalDistance.toFixed(1)}
                label="公里"
                icon={Route}
                color="#4facfe"
              />
            </XStack>
          </YStack>
        );
      }

      case 'monthly_distance': {
        const progress = Math.min((monthlyData.totalDistance / 100) * 100, 100);
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <YStack position="relative" ai="center" jc="center">
              <CircularProgress
                progress={progress}
                size={compact ? 80 : 100}
                strokeWidth={8}
                gradientColors={['#00c6fb', '#005bea']}
              />
              <YStack position="absolute" ai="center">
                <Text fontSize={compact ? '$6' : '$7'} fontWeight="900" color={colors.color}>
                  {monthlyData.totalDistance.toFixed(1)}
                </Text>
                <Text fontSize="$1" color="$gray10">公里</Text>
              </YStack>
            </YStack>
            <XStack ai="center" gap="$2">
              <MapPin size={14} color="$gray10" />
              <Text fontSize="$2" color="$gray10">
                本月 {monthlyData.workoutCount} 次運動
              </Text>
            </XStack>
          </YStack>
        );
      }

      case 'achievement_showcase': {
        const recentAchievements = achievements.slice(0, 4);
        return (
          <YStack flex={1} gap="$3">
            <XStack ai="center" gap="$2">
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                start={[0, 0]}
                end={[1, 1]}
                width={28}
                height={28}
                borderRadius={8}
                ai="center"
                jc="center"
              >
                <Trophy size={16} color="white" />
              </LinearGradient>
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                最新成就
              </Text>
              <Text fontSize="$2" color="$gray9" ml="auto">
                {achievements.length} 個
              </Text>
            </XStack>
            {recentAchievements.length > 0 ? (
              <XStack gap="$3" jc="center" flexWrap="wrap">
                {recentAchievements.map((achievement, index) => (
                  <AchievementBadge
                    key={achievement.id || index}
                    type={achievement.achievement_type}
                    size="medium"
                  />
                ))}
              </XStack>
            ) : (
              <YStack ai="center" jc="center" flex={1} py="$4">
                <Trophy size={40} color="$gray7" />
                <Text fontSize="$2" color="$gray9" mt="$2">
                  開始運動解鎖成就
                </Text>
              </YStack>
            )}
          </YStack>
        );
      }

      case 'progress_ring': {
        const weeklyGoal = 5;
        const progress = Math.min((weeklyStats.count / weeklyGoal) * 100, 100);
        const isComplete = progress >= 100;
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <YStack position="relative" ai="center" jc="center">
              <CircularProgress
                progress={progress}
                size={compact ? 80 : 100}
                strokeWidth={10}
                gradientColors={isComplete ? ['#00c853', '#69f0ae'] : ['#4CAF50', '#8BC34A']}
              />
              <YStack position="absolute" ai="center">
                <Text fontSize={compact ? '$5' : '$6'} fontWeight="900" color={isComplete ? '#00c853' : colors.color}>
                  {Math.round(progress)}%
                </Text>
              </YStack>
            </YStack>
            <YStack ai="center" gap="$1">
              <Text fontSize="$3" fontWeight="600" color={colors.color}>
                {isComplete ? '🎉 目標達成！' : '本週目標'}
              </Text>
              <Text fontSize="$2" color="$gray10">
                {weeklyStats.count}/{weeklyGoal} 次運動
              </Text>
            </YStack>
          </YStack>
        );
      }

      case 'recent_workouts': {
        const recentWorkouts = workouts
          .filter(w => !w.is_deleted)
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
          .slice(0, 3);

        const workoutIcons: Record<string, { color: string; icon: any }> = {
          running: { color: '#FF6B35', icon: Footprints },
          cycling: { color: '#4CAF50', icon: Route },
          swimming: { color: '#2196F3', icon: Activity },
          default: { color: '#9E9E9E', icon: Activity },
        };

        return (
          <YStack flex={1} gap="$3">
            <XStack ai="center" gap="$2">
              <LinearGradient
                colors={['#4facfe', '#00f2fe']}
                start={[0, 0]}
                end={[1, 1]}
                width={28}
                height={28}
                borderRadius={8}
                ai="center"
                jc="center"
              >
                <Clock size={16} color="white" />
              </LinearGradient>
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                最近運動
              </Text>
            </XStack>
            {recentWorkouts.length > 0 ? (
              <YStack gap="$2">
                {recentWorkouts.map((w, i) => {
                  const config = workoutIcons[w.workout_type] || workoutIcons.default;
                  const IconComponent = config.icon;
                  return (
                    <XStack
                      key={w.id || i}
                      ai="center"
                      gap="$3"
                      bg="$gray2"
                      px="$3"
                      py="$2"
                      br="$3"
                    >
                      <Square size={32} bg={config.color} br="$2" ai="center" jc="center">
                        <IconComponent size={18} color="white" />
                      </Square>
                      <YStack flex={1}>
                        <Text fontSize="$3" fontWeight="600" color={colors.color} tt="capitalize">
                          {w.workout_type}
                        </Text>
                        <Text fontSize="$1" color="$gray10">
                          {w.duration_minutes || 0}分鐘 · {(w.distance_km || 0).toFixed(1)}km
                        </Text>
                      </YStack>
                    </XStack>
                  );
                })}
              </YStack>
            ) : (
              <YStack ai="center" jc="center" flex={1}>
                <Text fontSize="$2" color="$gray9">尚無運動紀錄</Text>
              </YStack>
            )}
          </YStack>
        );
      }

      case 'workout_heatmap': {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          date.setHours(0, 0, 0, 0);
          const count = workouts.filter(w => {
            const wDate = new Date(w.start_time);
            wDate.setHours(0, 0, 0, 0);
            return wDate.getTime() === date.getTime() && !w.is_deleted;
          }).length;
          return {
            day: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
            count,
            isToday: i === 6
          };
        });

        const getHeatColor = (count: number) => {
          if (count === 0) return '#E8E8E8';
          if (count === 1) return '#A5D6A7';
          if (count === 2) return '#66BB6A';
          return '#2E7D32';
        };

        return (
          <YStack flex={1} gap="$3" ai="center">
            <XStack ai="center" gap="$2">
              <Calendar size={20} color={colors.color} />
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                運動熱力圖
              </Text>
            </XStack>
            <XStack gap="$2" jc="center">
              {last7Days.map((d, i) => (
                <YStack key={i} ai="center" gap="$2">
                  <YStack
                    width={36}
                    height={36}
                    br={8}
                    bg={getHeatColor(d.count)}
                    ai="center"
                    jc="center"
                    borderWidth={d.isToday ? 2 : 0}
                    borderColor="$blue9"
                    shadowColor="rgba(0,0,0,0.1)"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={1}
                    shadowRadius={4}
                    elevation={2}
                  >
                    <Text
                      fontSize="$3"
                      fontWeight="700"
                      color={d.count > 0 ? 'white' : '#9E9E9E'}
                    >
                      {d.count}
                    </Text>
                  </YStack>
                  <Text
                    fontSize="$1"
                    color={d.isToday ? '$blue9' : '$gray10'}
                    fontWeight={d.isToday ? '700' : '500'}
                  >
                    {d.day}
                  </Text>
                </YStack>
              ))}
            </XStack>
          </YStack>
        );
      }

      case 'stats_comparison': {
        return (
          <YStack flex={1} gap="$3">
            <XStack ai="center" gap="$2">
              <LinearGradient
                colors={['#fa709a', '#fee140']}
                start={[0, 0]}
                end={[1, 1]}
                width={28}
                height={28}
                borderRadius={8}
                ai="center"
                jc="center"
              >
                <BarChart3 size={16} color="white" />
              </LinearGradient>
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                數據比較
              </Text>
            </XStack>
            <XStack jc="space-around">
              <YStack ai="center" gap="$2" bg="$blue2" px="$4" py="$3" br="$4" flex={1} mr="$2">
                <Text fontSize="$1" color="$blue10" fontWeight="600">本週運動</Text>
                <Text fontSize="$7" fontWeight="900" color="$blue11">{weeklyStats.count}</Text>
                <Text fontSize="$1" color="$blue9">次</Text>
              </YStack>
              <YStack ai="center" gap="$2" bg="$green2" px="$4" py="$3" br="$4" flex={1}>
                <Text fontSize="$1" color="$green10" fontWeight="600">本週距離</Text>
                <Text fontSize="$7" fontWeight="900" color="$green11">{weeklyStats.totalDistance.toFixed(1)}</Text>
                <Text fontSize="$1" color="$green9">公里</Text>
              </YStack>
            </XStack>
          </YStack>
        );
      }

      case 'goal_tracker': {
        const monthlyGoal = 100;
        const progress = Math.min((monthlyData.totalDistance / monthlyGoal) * 100, 100);
        return (
          <YStack flex={1} gap="$3">
            <XStack ai="center" gap="$2">
              <LinearGradient
                colors={['#11998e', '#38ef7d']}
                start={[0, 0]}
                end={[1, 1]}
                width={28}
                height={28}
                borderRadius={8}
                ai="center"
                jc="center"
              >
                <Target size={16} color="white" />
              </LinearGradient>
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                目標追蹤
              </Text>
            </XStack>
            <YStack gap="$2">
              <XStack jc="space-between" ai="center">
                <Text fontSize="$2" color="$gray10">月度目標</Text>
                <Text fontSize="$3" fontWeight="700" color={colors.color}>
                  {monthlyData.totalDistance.toFixed(1)} / {monthlyGoal} km
                </Text>
              </XStack>
              <YStack height={12} bg="$gray4" br={6} overflow="hidden">
                <LinearGradient
                  colors={['#11998e', '#38ef7d']}
                  start={[0, 0]}
                  end={[1, 0]}
                  height={12}
                  width={`${progress}%`}
                  br={6}
                />
              </YStack>
              <Text fontSize="$2" color="$gray9" ta="center">
                {progress >= 100 ? '🎉 目標達成！' : `還需 ${(monthlyGoal - monthlyData.totalDistance).toFixed(1)} km`}
              </Text>
            </YStack>
          </YStack>
        );
      }

      case 'line_chart': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={['#a8edea', '#fed6e3']}
              start={[0, 0]}
              end={[1, 1]}
              width={60}
              height={60}
              borderRadius={16}
              ai="center"
              jc="center"
            >
              <TrendingUp size={28} color="#333" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize="$4" fontWeight="700" color={colors.color}>趨勢圖表</Text>
              <Text fontSize="$2" color="$gray9">
                {workouts.filter(w => !w.is_deleted).length} 筆運動數據
              </Text>
            </YStack>
          </YStack>
        );
      }

      case 'bar_chart': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={[0, 0]}
              end={[1, 1]}
              width={60}
              height={60}
              borderRadius={16}
              ai="center"
              jc="center"
            >
              <BarChart3 size={28} color="white" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize="$4" fontWeight="700" color={colors.color}>統計圖表</Text>
              <Text fontSize="$2" color="$gray9">按週分析運動量</Text>
            </YStack>
          </YStack>
        );
      }

      case 'pie_chart': {
        const typeCount: Record<string, number> = {};
        workouts.filter(w => !w.is_deleted).forEach(w => {
          typeCount[w.workout_type] = (typeCount[w.workout_type] || 0) + 1;
        });
        const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={['#f093fb', '#f5576c']}
              start={[0, 0]}
              end={[1, 1]}
              width={60}
              height={60}
              borderRadius={16}
              ai="center"
              jc="center"
            >
              <PieChart size={28} color="white" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize="$4" fontWeight="700" color={colors.color}>運動分布</Text>
              <Text fontSize="$2" color="$gray9">
                {topType ? `最常：${topType[0]}` : '開始記錄運動'}
              </Text>
            </YStack>
          </YStack>
        );
      }

      case 'distance_leaderboard': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              start={[0, 0]}
              end={[1, 1]}
              width={60}
              height={60}
              borderRadius={16}
              ai="center"
              jc="center"
            >
              <Users size={28} color="white" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize="$4" fontWeight="700" color={colors.color}>距離排行</Text>
              <Text fontSize="$2" color="$gray9">與好友比較運動量</Text>
            </YStack>
          </YStack>
        );
      }

      case 'quick_actions': {
        return (
          <YStack flex={1} gap="$3">
            <Text fontSize="$4" fontWeight="700" color={colors.color}>快速操作</Text>
            <XStack gap="$3" flexWrap="wrap">
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={[0, 0]}
                end={[1, 1]}
                px="$4"
                py="$2"
                br="$4"
                pressStyle={{ opacity: 0.8 }}
              >
                <XStack ai="center" gap="$2">
                  <Plus size={18} color="white" />
                  <Text fontSize="$3" fontWeight="600" color="white">新運動</Text>
                </XStack>
              </LinearGradient>
              <LinearGradient
                colors={['#11998e', '#38ef7d']}
                start={[0, 0]}
                end={[1, 1]}
                px="$4"
                py="$2"
                br="$4"
                pressStyle={{ opacity: 0.8 }}
              >
                <XStack ai="center" gap="$2">
                  <Play size={18} color="white" />
                  <Text fontSize="$3" fontWeight="600" color="white">開始</Text>
                </XStack>
              </LinearGradient>
            </XStack>
          </YStack>
        );
      }

      case 'heart_rate_zone': {
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={['#ff416c', '#ff4b2b']}
              start={[0, 0]}
              end={[1, 1]}
              width={60}
              height={60}
              borderRadius={16}
              ai="center"
              jc="center"
            >
              <Heart size={28} color="white" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize="$4" fontWeight="700" color={colors.color}>心率區間</Text>
              <Text fontSize="$2" color="$gray9">連接裝置後顯示</Text>
            </YStack>
          </YStack>
        );
      }

      case 'workout_calendar':
      case 'pace_chart':
        return (
          <YStack ai="center" jc="center" flex={1} gap="$3">
            <LinearGradient
              colors={['#a8edea', '#fed6e3']}
              start={[0, 0]}
              end={[1, 1]}
              width={60}
              height={60}
              borderRadius={16}
              ai="center"
              jc="center"
            >
              <Calendar size={28} color="#333" />
            </LinearGradient>
            <YStack ai="center" gap="$1">
              <Text fontSize="$4" fontWeight="700" color={colors.color}>
                {widget.type === 'workout_calendar' ? '運動日曆' : '配速圖表'}
              </Text>
              <Text fontSize="$2" color="$gray9">
                {workouts.filter(w => !w.is_deleted).length} 次運動記錄
              </Text>
            </YStack>
          </YStack>
        );

      default:
        return (
          <YStack ai="center" jc="center" flex={1}>
            <Text fontSize="$3" color="$gray9">
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
