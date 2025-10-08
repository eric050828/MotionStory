/**
 * T151: WorkoutImportScreen
 * CSV 匯入和 Strava 連接介面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import useWorkoutStore from '../../store/workoutStore';
import { Button } from '../../components/Button';

const WorkoutImportScreen: React.FC = () => {
  const navigation = useNavigation();
  const { createWorkout } = useWorkoutStore();

  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    current: number;
    status: string;
  } | null>(null);

  const handleCSVImport = async () => {
    try {
      // 選擇 CSV 檔案
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setImporting(true);
      setImportProgress({ total: 0, current: 0, status: '讀取檔案中...' });

      // 讀取檔案內容
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);

      // 解析 CSV
      const workouts = parseCSV(content);

      if (workouts.length === 0) {
        Alert.alert('匯入失敗', 'CSV 檔案中沒有有效的運動記錄');
        setImporting(false);
        setImportProgress(null);
        return;
      }

      // 逐筆匯入
      setImportProgress({
        total: workouts.length,
        current: 0,
        status: '匯入中...',
      });

      for (let i = 0; i < workouts.length; i++) {
        try {
          await createWorkout(workouts[i]);
          setImportProgress({
            total: workouts.length,
            current: i + 1,
            status: `已匯入 ${i + 1}/${workouts.length}`,
          });
        } catch (err) {
          console.error('Failed to import workout:', err);
        }
      }

      Alert.alert('匯入完成', `成功匯入 ${workouts.length} 筆運動記錄`);
      setImporting(false);
      setImportProgress(null);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('匯入失敗', error.message || '請檢查 CSV 格式');
      setImporting(false);
      setImportProgress(null);
    }
  };

  const handleStravaConnect = async () => {
    Alert.alert(
      'Strava 連接',
      'Strava 整合功能即將推出！\n\n將支援：\n• 自動同步運動記錄\n• 匯入歷史資料\n• 即時數據更新',
      [{ text: '了解', style: 'default' }]
    );
  };

  const handleGarminConnect = async () => {
    Alert.alert(
      'Garmin 連接',
      'Garmin 整合功能即將推出！\n\n將支援：\n• 自動同步運動記錄\n• 匯入歷史資料\n• 裝置數據同步',
      [{ text: '了解', style: 'default' }]
    );
  };

  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV 檔案格式錯誤');
    }

    // 解析表頭
    const headers = lines[0].split(',').map((h) => h.trim());

    // 驗證必要欄位
    const requiredFields = ['workout_type', 'start_time', 'duration_minutes'];
    const missingFields = requiredFields.filter((f) => !headers.includes(f));

    if (missingFields.length > 0) {
      throw new Error(`缺少必要欄位: ${missingFields.join(', ')}`);
    }

    // 解析資料行
    const workouts = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const workout: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          // 數值型欄位轉換
          if (['duration_minutes', 'distance_km', 'calories', 'avg_heart_rate', 'max_heart_rate', 'elevation_gain'].includes(header)) {
            workout[header] = parseFloat(value);
          } else {
            workout[header] = value;
          }
        }
      });

      if (workout.workout_type && workout.start_time && workout.duration_minutes) {
        workouts.push(workout);
      }
    }

    return workouts;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>匯入運動記錄</Text>
        <Text style={styles.subtitle}>從 CSV 或第三方平台匯入資料</Text>
      </View>

      {/* CSV Import */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CSV 檔案匯入</Text>
        <Text style={styles.sectionDescription}>
          支援標準格式的 CSV 檔案，包含運動類型、時間、距離等資料
        </Text>

        <View style={styles.formatExample}>
          <Text style={styles.formatTitle}>CSV 格式範例：</Text>
          <Text style={styles.formatText}>
            workout_type,start_time,duration_minutes,distance_km{'\n'}
            running,2024-01-15T08:00:00,30,5.2{'\n'}
            cycling,2024-01-16T18:30:00,45,15.8
          </Text>
        </View>

        <Button
          title="選擇 CSV 檔案"
          onPress={handleCSVImport}
          loading={importing}
          disabled={importing}
          style={styles.importButton}
        />

        {importProgress && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{importProgress.status}</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}
      </View>

      {/* Third-party Integrations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>第三方平台連接</Text>
        <Text style={styles.sectionDescription}>
          連接你的運動平台，自動同步運動記錄
        </Text>

        <TouchableOpacity
          style={styles.platformCard}
          onPress={handleStravaConnect}
        >
          <View style={styles.platformIcon}>
            <Text style={styles.platformIconText}>🚴</Text>
          </View>
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>Strava</Text>
            <Text style={styles.platformStatus}>即將推出</Text>
          </View>
          <Text style={styles.platformChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.platformCard}
          onPress={handleGarminConnect}
        >
          <View style={styles.platformIcon}>
            <Text style={styles.platformIconText}>⌚</Text>
          </View>
          <View style={styles.platformInfo}>
            <Text style={styles.platformName}>Garmin</Text>
            <Text style={styles.platformStatus}>即將推出</Text>
          </View>
          <Text style={styles.platformChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Help Section */}
      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>需要協助？</Text>
        <Text style={styles.helpText}>
          • CSV 檔案必須包含 workout_type, start_time, duration_minutes{'\n'}
          • 日期格式：YYYY-MM-DDTHH:mm:ss{'\n'}
          • 運動類型：running, cycling, swimming, walking 等{'\n'}
          • 距離單位：公里{'\n'}
          • 時長單位：分鐘
        </Text>
      </View>
    </ScrollView>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  formatExample: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  formatTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  formatText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  importButton: {
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  platformCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  platformIconText: {
    fontSize: 24,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  platformStatus: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  platformChevron: {
    fontSize: 24,
    color: '#ccc',
  },
  helpSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 22,
  },
});

export default WorkoutImportScreen;
