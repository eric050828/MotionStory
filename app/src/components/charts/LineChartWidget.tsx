/**
 * T142: LineChartWidget
 * 使用 victory-native 的折線圖顯示運動趨勢
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { Workout } from '../../types/workout';
import { ChartTimeRange } from '../../types/dashboard';

interface LineChartWidgetProps {
  workouts: Workout[];
  metric: 'distance' | 'duration';
  timeRange?: ChartTimeRange;
  title?: string;
}

const LineChartWidget: React.FC<LineChartWidgetProps> = ({
  workouts,
  metric,
  timeRange = '30d',
  title = '運動趨勢',
}) => {
  const screenWidth = Dimensions.get('window').width;

  const chartData = useMemo(() => {
    // 按日期分組計算
    const groupedData: Record<string, number> = {};

    workouts.forEach((workout) => {
      const date = workout.start_time.split('T')[0];
      const value = metric === 'distance'
        ? (workout.distance_km || 0)
        : workout.duration_minutes;

      if (groupedData[date]) {
        groupedData[date] += value;
      } else {
        groupedData[date] = value;
      }
    });

    // 轉換為圖表格式
    return Object.entries(groupedData)
      .map(([date, value]) => ({
        x: new Date(date),
        y: value,
      }))
      .sort((a, b) => a.x.getTime() - b.x.getTime());
  }, [workouts, metric]);

  const yAxisLabel = metric === 'distance' ? '距離 (公里)' : '時長 (分鐘)';

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
      >
        <VictoryAxis
          style={{
            tickLabels: { fontSize: 10, padding: 5 },
          }}
          tickFormat={(date) => {
            const d = new Date(date);
            return `${d.getMonth() + 1}/${d.getDate()}`;
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
        <VictoryLine
          data={chartData}
          style={{
            data: {
              stroke: '#2196F3',
              strokeWidth: 2,
            },
          }}
          interpolation="natural"
        />
      </VictoryChart>
    </View>
  );
};

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

export default LineChartWidget;
