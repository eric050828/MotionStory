/**
 * T150: WorkoutDetailScreen
 * 單一運動記錄詳細資訊畫面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import useWorkoutStore from '../../store/workoutStore';
import { Workout, WorkoutType } from '../../types/workout';
import Loading from '../../components/ui/Loading';
import Button from '../../components/Button';

type RouteParams = {
  WorkoutDetail: {
    workoutId: string;
  };
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

const WorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'WorkoutDetail'>>();
  const { workoutId } = route.params;

  const { currentWorkout, loading, fetchWorkout, deleteWorkout } = useWorkoutStore();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWorkout(workoutId);
  }, [workoutId]);

  const handleEdit = () => {
    navigation.navigate('WorkoutForm' as never, { workoutId } as never);
  };

  const handleDelete = () => {
    Alert.alert(
      '刪除運動記錄',
      '確定要刪除這筆運動記錄嗎？此操作無法復原。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刪除',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteWorkout(workoutId);
              navigation.goBack();
            } catch (err) {
              Alert.alert('刪除失敗', '請稍後再試');
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !currentWorkout) {
    return <Loading />;
  }

  const workout = currentWorkout;
  const date = new Date(workout.start_time);
  const formattedDate = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {WORKOUT_TYPE_LABELS[workout.workout_type] || workout.workout_type}
          </Text>
          <Text style={styles.dateTime}>
            {formattedDate} {formattedTime}
          </Text>
          {workout.sync_status === 'pending' && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>待同步</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {workout.distance_km && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>距離</Text>
              <Text style={styles.statValue}>{workout.distance_km.toFixed(2)}</Text>
              <Text style={styles.statUnit}>公里</Text>
            </View>
          )}

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>時長</Text>
            <Text style={styles.statValue}>{workout.duration_minutes}</Text>
            <Text style={styles.statUnit}>分鐘</Text>
          </View>

          {workout.calories && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>卡路里</Text>
              <Text style={styles.statValue}>{workout.calories}</Text>
              <Text style={styles.statUnit}>卡</Text>
            </View>
          )}

          {workout.avg_heart_rate && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>平均心率</Text>
              <Text style={styles.statValue}>{workout.avg_heart_rate}</Text>
              <Text style={styles.statUnit}>bpm</Text>
            </View>
          )}

          {workout.max_heart_rate && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>最大心率</Text>
              <Text style={styles.statValue}>{workout.max_heart_rate}</Text>
              <Text style={styles.statUnit}>bpm</Text>
            </View>
          )}

          {workout.elevation_gain && (
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>爬升</Text>
              <Text style={styles.statValue}>{workout.elevation_gain}</Text>
              <Text style={styles.statUnit}>公尺</Text>
            </View>
          )}
        </View>

        {/* Location */}
        {workout.location && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>地點</Text>
            <View style={styles.locationCard}>
              <Text style={styles.locationName}>
                {workout.location.place_name || '未命名地點'}
              </Text>
              <Text style={styles.locationCoords}>
                {workout.location.latitude.toFixed(6)}, {workout.location.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
        )}

        {/* Weather */}
        {workout.metadata?.weather && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>天氣</Text>
            <View style={styles.weatherCard}>
              <Text style={styles.weatherTemp}>
                {workout.metadata.weather.temperature}°C
              </Text>
              <Text style={styles.weatherCondition}>
                {workout.metadata.weather.condition}
              </Text>
              {workout.metadata.weather.humidity && (
                <Text style={styles.weatherHumidity}>
                  濕度 {workout.metadata.weather.humidity}%
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {workout.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>備註</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          </View>
        )}

        {/* Import Info */}
        {workout.metadata?.imported_from && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>資料來源</Text>
            <View style={styles.importCard}>
              <Text style={styles.importText}>
                來自 {workout.metadata.imported_from.toUpperCase()}
              </Text>
              {workout.metadata.import_id && (
                <Text style={styles.importId}>ID: {workout.metadata.import_id}</Text>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="編輯"
            onPress={handleEdit}
            variant="outline"
            style={styles.editButton}
          />
          <Button
            title="刪除"
            onPress={handleDelete}
            variant="outline"
            loading={deleting}
            disabled={deleting}
            style={styles.deleteButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 16,
    color: '#666',
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginTop: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2196F3',
  },
  statUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 14,
    color: '#666',
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  weatherTemp: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 4,
  },
  weatherCondition: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  weatherHumidity: {
    fontSize: 14,
    color: '#999',
  },
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  importCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  importText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 4,
  },
  importId: {
    fontSize: 12,
    color: '#1565C0',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  editButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
    borderColor: '#F44336',
  },
});

export default WorkoutDetailScreen;
