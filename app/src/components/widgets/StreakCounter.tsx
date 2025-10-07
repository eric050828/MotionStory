/**
 * Streak Counter Widget
 * 連續天數計數器 Widget
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../Card';

interface StreakCounterProps {
  streakDays: number;
  lastWorkoutDate?: Date;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  streakDays,
  lastWorkoutDate,
}) => {
  const getStreakColor = (days: number): string => {
    if (days >= 30) return '#FF9500'; // Gold
    if (days >= 7) return '#007AFF'; // Blue
    return '#34C759'; // Green
  };

  const getStreakEmoji = (days: number): string => {
    if (days >= 100) return '🏆';
    if (days >= 30) return '🔥';
    if (days >= 7) return '💪';
    return '✨';
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>連續運動</Text>
        <Text style={styles.emoji}>{getStreakEmoji(streakDays)}</Text>
      </View>

      <View style={styles.streakContainer}>
        <Text
          style={[
            styles.streakNumber,
            { color: getStreakColor(streakDays) },
          ]}
        >
          {streakDays}
        </Text>
        <Text style={styles.streakLabel}>天</Text>
      </View>

      {lastWorkoutDate && (
        <Text style={styles.lastWorkout}>
          上次運動: {lastWorkoutDate.toLocaleDateString('zh-TW')}
        </Text>
      )}

      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.min((streakDays / 30) * 100, 100)}%`,
              backgroundColor: getStreakColor(streakDays),
            },
          ]}
        />
      </View>

      <Text style={styles.nextMilestone}>
        {streakDays < 7 && `還差 ${7 - streakDays} 天達成一週連續！`}
        {streakDays >= 7 && streakDays < 30 && `還差 ${30 - streakDays} 天達成一個月連續！`}
        {streakDays >= 30 && streakDays < 100 && `還差 ${100 - streakDays} 天達成百日連續！`}
        {streakDays >= 100 && '你太強了！繼續保持！'}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emoji: {
    fontSize: 24,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 20,
    color: '#666',
    marginLeft: 8,
  },
  lastWorkout: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  nextMilestone: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
  },
});
