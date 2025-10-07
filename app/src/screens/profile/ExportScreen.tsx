/**
 * T160: ExportScreen
 * 資料匯出功能畫面
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
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import workoutService from '../../services/workoutService';
import Button from '../../components/Button';

type ExportFormat = 'csv' | 'json';

const ExportScreen: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');

  const handleExport = async () => {
    setExporting(true);

    try {
      // 獲取所有運動記錄
      const response = await workoutService.getWorkouts({});
      const workouts = response.workouts;

      if (workouts.length === 0) {
        Alert.alert('無資料', '目前沒有運動記錄可匯出');
        setExporting(false);
        return;
      }

      let content: string;
      let filename: string;
      let mimeType: string;

      if (selectedFormat === 'csv') {
        content = generateCSV(workouts);
        filename = `motionstory_workouts_${Date.now()}.csv`;
        mimeType = 'text/csv';
      } else {
        content = JSON.stringify(workouts, null, 2);
        filename = `motionstory_workouts_${Date.now()}.json`;
        mimeType = 'application/json';
      }

      // 儲存檔案
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // 分享檔案
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: '匯出運動記錄',
        });
      } else {
        Alert.alert('匯出成功', `檔案已儲存至: ${fileUri}`);
      }

      setExporting(false);
    } catch (error: any) {
      Alert.alert('匯出失敗', error.message || '請稍後再試');
      setExporting(false);
    }
  };

  const generateCSV = (workouts: any[]): string => {
    // CSV 表頭
    const headers = [
      'workout_type',
      'start_time',
      'duration_minutes',
      'distance_km',
      'calories',
      'avg_heart_rate',
      'max_heart_rate',
      'elevation_gain',
      'notes',
    ];

    // CSV 內容
    const rows = workouts.map((workout) => {
      return headers.map((header) => {
        const value = workout[header];
        if (value === undefined || value === null) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>匯出資料</Text>
        <Text style={styles.subtitle}>將你的運動記錄匯出為檔案</Text>
      </View>

      {/* Format Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>選擇格式</Text>

        <TouchableOpacity
          style={[
            styles.formatCard,
            selectedFormat === 'csv' && styles.formatCardActive,
          ]}
          onPress={() => setSelectedFormat('csv')}
        >
          <View style={styles.formatIcon}>
            <Text style={styles.formatIconText}>📊</Text>
          </View>
          <View style={styles.formatInfo}>
            <Text style={styles.formatName}>CSV</Text>
            <Text style={styles.formatDescription}>
              適合使用 Excel 或 Google Sheets 開啟
            </Text>
          </View>
          {selectedFormat === 'csv' && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.formatCard,
            selectedFormat === 'json' && styles.formatCardActive,
          ]}
          onPress={() => setSelectedFormat('json')}
        >
          <View style={styles.formatIcon}>
            <Text style={styles.formatIconText}>📄</Text>
          </View>
          <View style={styles.formatInfo}>
            <Text style={styles.formatName}>JSON</Text>
            <Text style={styles.formatDescription}>
              包含完整資料結構，適合技術用途
            </Text>
          </View>
          {selectedFormat === 'json' && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedText}>✓</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Export Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>匯出內容包含：</Text>
        <Text style={styles.infoText}>• 所有運動記錄</Text>
        <Text style={styles.infoText}>• 運動類型、時間、距離</Text>
        <Text style={styles.infoText}>• 心率、卡路里等數據</Text>
        <Text style={styles.infoText}>• 備註和其他資訊</Text>
      </View>

      {/* Export Button */}
      <Button
        title={`匯出為 ${selectedFormat.toUpperCase()}`}
        onPress={handleExport}
        loading={exporting}
        disabled={exporting}
        style={styles.exportButton}
      />

      {/* Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.privacyText}>
          ⚠️ 匯出的檔案包含你的個人運動資料，請妥善保管
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  formatCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  formatCardActive: {
    borderColor: '#2196F3',
  },
  formatIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  formatIconText: {
    fontSize: 24,
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 13,
    color: '#666',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  infoSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  exportButton: {
    marginBottom: 16,
  },
  privacyNotice: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
  },
  privacyText: {
    fontSize: 13,
    color: '#F57C00',
    lineHeight: 18,
  },
});

export default ExportScreen;
