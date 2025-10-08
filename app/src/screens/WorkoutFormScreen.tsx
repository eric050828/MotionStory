/**
 * Workout Form Screen
 * 運動記錄建立/編輯畫面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { api } from '../services/api';

const WORKOUT_TYPES = [
  { label: '跑步', value: 'running' },
  { label: '騎車', value: 'cycling' },
  { label: '游泳', value: 'swimming' },
  { label: '健走', value: 'walking' },
  { label: '重訓', value: 'weight_training' },
  { label: '其他', value: 'other' },
];

export const WorkoutFormScreen: React.FC = () => {
  const [workoutType, setWorkoutType] = useState('running');
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [avgHeartRate, setAvgHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!duration) {
      Alert.alert('錯誤', '請輸入運動時長');
      return;
    }

    const durationNum = parseInt(duration);
    if (durationNum <= 0 || durationNum > 1440) {
      Alert.alert('錯誤', '運動時長需在 1-1440 分鐘之間');
      return;
    }

    try {
      setIsLoading(true);

      const workoutData = {
        workout_type: workoutType,
        start_time: startTime.toISOString(),
        duration_minutes: durationNum,
        distance_km: distance ? parseFloat(distance) : undefined,
        avg_heart_rate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
        calories: calories ? parseInt(calories) : undefined,
        notes: notes || undefined,
      };

      const response = await api.createWorkout(workoutData);

      // Show achievements if triggered
      if (response.achievements_triggered?.length > 0) {
        const achievementTitles = response.achievements_triggered
          .map((a: any) => a.metadata?.title || a.achievement_type)
          .join(', ');

        Alert.alert(
          '🎉 成就達成！',
          `恭喜你達成: ${achievementTitles}`,
          [
            {
              text: '太棒了！',
              onPress: () => {
                // Navigate back or to achievements screen
              },
            },
          ]
        );
      } else {
        Alert.alert('成功', '運動記錄已儲存！', [
          {
            text: '確定',
            onPress: () => {
              // Navigate back
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert(
        '儲存失敗',
        error.response?.data?.detail || '請稍後再試'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>運動類型</Text>
        <View style={styles.typeContainer}>
          {WORKOUT_TYPES.map((type) => (
            <Button
              key={type.value}
              title={type.label}
              onPress={() => setWorkoutType(type.value)}
              variant={workoutType === type.value ? 'primary' : 'outline'}
              size="small"
              style={styles.typeButton}
            />
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>運動時間</Text>
        <Button
          title={startTime.toLocaleString('zh-TW')}
          onPress={() => setShowDatePicker(true)}
          variant="outline"
        />
        {showDatePicker && (
          <DateTimePicker
            value={startTime}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setStartTime(date);
            }}
          />
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>運動資料</Text>

        <Input
          label="時長 (分鐘) *"
          value={duration}
          onChangeText={setDuration}
          placeholder="30"
          keyboardType="numeric"
        />

        <Input
          label="距離 (公里)"
          value={distance}
          onChangeText={setDistance}
          placeholder="5.0"
          keyboardType="decimal-pad"
        />

        <Input
          label="平均心率"
          value={avgHeartRate}
          onChangeText={setAvgHeartRate}
          placeholder="145"
          keyboardType="numeric"
        />

        <Input
          label="消耗卡路里"
          value={calories}
          onChangeText={setCalories}
          placeholder="300"
          keyboardType="numeric"
        />

        <Input
          label="備註"
          value={notes}
          onChangeText={setNotes}
          placeholder="今天狀態很好！"
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />
      </Card>

      <Button
        title="儲存運動記錄"
        onPress={handleSubmit}
        loading={isLoading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    margin: 16,
    marginTop: 8,
  },
});
