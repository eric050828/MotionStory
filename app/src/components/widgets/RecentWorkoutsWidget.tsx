/**
 * T131: RecentWorkoutsWidget
 * 顯示最近運動記錄列表
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { WidgetContainer } from './WidgetContainer';
import { Workout, WorkoutType } from '../../types/workout';

interface RecentWorkoutsWidgetProps {
  workouts: Workout[];
  onWorkoutPress?: (workout: Workout) => void;
  maxItems?: number;
}

const WORKOUT_ICONS: Record<WorkoutType, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  walking: '🚶',
  hiking: '🥾',
  yoga: '🧘',
  strength_training: '💪',
  other: '⚡',
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
};

export const RecentWorkoutsWidget: React.FC<RecentWorkoutsWidgetProps> = ({
  workouts,
  onWorkoutPress,
  maxItems = 5,
}) => {
  const displayWorkouts = workouts.slice(0, maxItems);

  const renderWorkout = ({ item }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.workoutItem}
      onPress={() => onWorkoutPress?.(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.workoutIcon}>{WORKOUT_ICONS[item.workout_type]}</Text>
      <View style={styles.workoutInfo}>
        <Text style={styles.workoutType}>
          {item.workout_type.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.workoutDetails}>
          {item.distance_km && `${item.distance_km.toFixed(1)}km · `}
          {formatDuration(item.duration_minutes)}
        </Text>
      </View>
      <Text style={styles.workoutDate}>{formatDate(item.start_time)}</Text>
    </TouchableOpacity>
  );

  return (
    <WidgetContainer title="最近運動" icon="📋">
      {displayWorkouts.length > 0 ? (
        <FlatList
          data={displayWorkouts}
          renderItem={renderWorkout}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyText}>尚無運動記錄</Text>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  workoutIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  workoutDetails: {
    fontSize: 12,
    color: '#666',
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
