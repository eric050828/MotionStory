/**
 * T149: WorkoutListScreen
 * 運動記錄列表畫面
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useWorkoutStore from '../../store/workoutStore';
import { Workout, WorkoutType } from '../../types/workout';
import { Loading } from '../../components/ui/Loading';
import { Button } from '../../components/Button';

const WORKOUT_TYPE_ICONS: Record<WorkoutType, string> = {
  running: '🏃',
  cycling: '🚴',
  swimming: '🏊',
  walking: '🚶',
  hiking: '🥾',
  yoga: '🧘',
  strength_training: '💪',
  other: '⚡',
};

const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  running: '跑步',
  cycling: '騎車',
  swimming: '游泳',
  walking: '步行',
  hiking: '登山',
  yoga: '瑜伽',
  strength_training: '重訓',
  other: '其他',
};

const WorkoutListScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    workouts,
    loading,
    error,
    filters,
    syncStatus,
    fetchWorkouts,
    syncWorkouts,
    setFilters,
    clearFilters,
  } = useWorkoutStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  }, [fetchWorkouts]);

  const handleSync = async () => {
    try {
      await syncWorkouts();
      Alert.alert('同步成功', '運動記錄已同步');
    } catch (err) {
      Alert.alert('同步失敗', '請稍後再試');
    }
  };

  const handleFilterByType = (type: WorkoutType | null) => {
    setSelectedType(type);
    if (type) {
      setFilters({ ...filters, workout_type: type });
    } else {
      const { workout_type, ...rest } = filters;
      setFilters(rest);
    }
  };

  const handleWorkoutPress = (workout: Workout) => {
    navigation.navigate('WorkoutDetail' as never, { workoutId: workout.id } as never);
  };

  const handleAddWorkout = () => {
    navigation.navigate('WorkoutForm' as never);
  };

  const renderWorkoutItem = ({ item }: { item: Workout }) => {
    const date = new Date(item.start_time);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    return (
      <TouchableOpacity
        style={styles.workoutItem}
        onPress={() => handleWorkoutPress(item)}
      >
        <View style={styles.workoutIcon}>
          <Text style={styles.iconText}>
            {WORKOUT_TYPE_ICONS[item.workout_type] || '⚡'}
          </Text>
        </View>

        <View style={styles.workoutInfo}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutType}>
              {WORKOUT_TYPE_LABELS[item.workout_type] || item.workout_type}
            </Text>
            {item.sync_status === 'pending' && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>待同步</Text>
              </View>
            )}
          </View>

          <Text style={styles.workoutDate}>{formattedDate}</Text>

          <View style={styles.workoutStats}>
            {item.distance_km && (
              <Text style={styles.statText}>
                {item.distance_km.toFixed(2)} 公里
              </Text>
            )}
            <Text style={styles.statText}>
              {item.duration_minutes} 分鐘
            </Text>
            {item.calories && (
              <Text style={styles.statText}>
                {item.calories} 卡
              </Text>
            )}
          </View>
        </View>

        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypeFilter = () => {
    const types: Array<WorkoutType | null> = [
      null,
      'running',
      'cycling',
      'swimming',
      'walking',
    ];

    return (
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={types}
          keyExtractor={(item) => item || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === item && styles.filterChipActive,
              ]}
              onPress={() => handleFilterByType(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedType === item && styles.filterTextActive,
                ]}
              >
                {item ? WORKOUT_TYPE_LABELS[item] : '全部'}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  if (loading && !refreshing && workouts.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {renderTypeFilter()}

      {syncStatus.pending_count > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {syncStatus.pending_count} 筆記錄待同步
          </Text>
          <Button
            title="立即同步"
            onPress={handleSync}
            size="small"
            style={styles.syncButton}
          />
        </View>
      )}

      <FlatList
        data={workouts}
        renderItem={renderWorkoutItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>尚無運動記錄</Text>
            <Button
              title="新增運動"
              onPress={handleAddWorkout}
              style={styles.addButton}
            />
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={handleAddWorkout}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
  },
  syncText: {
    fontSize: 14,
    color: '#F57C00',
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  listContent: {
    padding: 16,
  },
  workoutItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  pendingBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  pendingText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: '#ccc',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
  },
  addButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});

export default WorkoutListScreen;
