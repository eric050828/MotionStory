/**
 * T143: BarChartWidget
 * 柱狀圖顯示每週/月統計
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { Workout } from '../../types/workout';

interface BarChartWidgetProps {
  workouts: Workout[];
  metric: 'distance' | 'duration' | 'workouts';
  groupBy: 'week' | 'month';
  title?: string;
}

const BarChartWidget: React.FC<BarChartWidgetProps> = ({
  workouts,
  metric,
  groupBy = 'week',
  title = '統計圖表',
}) => {
  const screenWidth = Dimensions.get('window').width;

  const chartData = useMemo(() => {
    const groupedData: Record<string, number> = {};

    workouts.forEach((workout) => {
      const date = new Date(workout.start_time);
      let key: string;

      if (groupBy === 'week') {
        // 計算週數 (ISO Week)
        const weekNumber = getWeekNumber(date);
        key = `W${weekNumber}`;
      } else {
        // 按月分組
        key = `${date.getMonth() + 1}月`;
      }

      if (metric === 'distance') {
        groupedData[key] = (groupedData[key] || 0) + (workout.distance_km || 0);
      } else if (metric === 'duration') {
        groupedData[key] = (groupedData[key] || 0) + workout.duration_minutes;
      } else {
        groupedData[key] = (groupedData[key] || 0) + 1;
      }
    });

    return Object.entries(groupedData)
      .map(([label, value]) => ({
        x: label,
        y: value,
      }))
      .slice(-8); // 只顯示最近 8 個週期
  }, [workouts, metric, groupBy]);

  const yAxisLabel = useMemo(() => {
    if (metric === 'distance') return '距離 (公里)';
    if (metric === 'duration') return '時長 (分鐘)';
    return '運動次數';
  }, [metric]);

  if (chartData.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暫無數據</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <VictoryChart
        theme={VictoryTheme.material}
        width={screenWidth - 48}
        height={220}
        padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
        domainPadding={{ x: 20 }}
      >
        <VictoryAxis
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryAxis
          dependentAxis
          label={yAxisLabel}
          style={{
            axisLabel: { fontSize: 12, padding: 35 },
            tickLabels: { fontSize: 10, padding: 5 },
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: {
              fill: '#4CAF50',
            },
          }}
          cornerRadius={{ top: 4 }}
        />
      </VictoryChart>
    </View>
  );
};

// 輔助函數：計算 ISO 週數
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default BarChartWidget;
