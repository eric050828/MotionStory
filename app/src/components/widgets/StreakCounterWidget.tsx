/**
 * T137: StreakCounterWidget
 * 連續天數 Widget，顯示當前運動連續天數
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WidgetContainer } from './WidgetContainer';

interface StreakCounterWidgetProps {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
}

export const StreakCounterWidget: React.FC<StreakCounterWidgetProps> = ({
  currentStreak,
  longestStreak,
  lastWorkoutDate,
}) => {
  const getStreakMessage = (): string => {
    if (currentStreak === 0) return '開始你的運動連續紀錄！';
    if (currentStreak < 7) return '保持下去！';
    if (currentStreak < 30) return '習慣正在養成！';
    if (currentStreak < 100) return '堅持就是勝利！';
    return '你是真正的傳奇！';
  };

  const getFlameSize = (): number => {
    if (currentStreak === 0) return 48;
    if (currentStreak < 7) return 56;
    if (currentStreak < 30) return 64;
    if (currentStreak < 100) return 72;
    return 80;
  };

  const formatLastWorkout = (): string => {
    if (!lastWorkoutDate) return '';
    const date = new Date(lastWorkoutDate);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return '剛剛運動';
    if (diffHours < 24) return `${diffHours} 小時前`;
    return `${Math.floor(diffHours / 24)} 天前`;
  };

  return (
    <WidgetContainer title="連續天數" icon="🔥">
      <View style={styles.container}>
        {/* 主要連續天數顯示 */}
        <View style={styles.mainStreak}>
          <Text style={[styles.flameIcon, { fontSize: getFlameSize() }]}>
            {currentStreak > 0 ? '🔥' : '⚪'}
          </Text>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>天連續</Text>
        </View>

        {/* 訊息 */}
        <Text style={styles.message}>{getStreakMessage()}</Text>

        {/* 統計資訊 */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>最長紀錄</Text>
          </View>
          {lastWorkoutDate && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatLastWorkout()}</Text>
              <Text style={styles.statLabel}>最後運動</Text>
            </View>
          )}
        </View>

        {/* 進度提示 */}
        {currentStreak > 0 && (
          <View style={styles.milestones}>
            {currentStreak < 7 && (
              <View style={styles.nextMilestone}>
                <Text style={styles.milestoneText}>
                  還需 {7 - currentStreak} 天達成 7 天連續 🎯
                </Text>
              </View>
            )}
            {currentStreak >= 7 && currentStreak < 30 && (
              <View style={styles.nextMilestone}>
                <Text style={styles.milestoneText}>
                  還需 {30 - currentStreak} 天達成 30 天連續 💪
                </Text>
              </View>
            )}
            {currentStreak >= 30 && currentStreak < 100 && (
              <View style={styles.nextMilestone}>
                <Text style={styles.milestoneText}>
                  還需 {100 - currentStreak} 天達成 100 天連續 👑
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  mainStreak: {
    alignItems: 'center',
    marginBottom: 16,
  },
  flameIcon: {
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 32,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
    width: '100%',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  milestones: {
    marginTop: 16,
    width: '100%',
  },
  nextMilestone: {
    backgroundColor: '#F0F9FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  milestoneText: {
    fontSize: 13,
    color: '#007AFF',
    textAlign: 'center',
  },
});
