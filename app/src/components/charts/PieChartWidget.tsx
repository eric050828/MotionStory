/**
 * T144: PieChartWidget
 * 圓餅圖顯示運動類型分布
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie, VictoryLegend } from 'victory-native';
import { Workout, WorkoutType } from '../../types/workout';

interface PieChartWidgetProps {
  workouts: Workout[];
  title?: string;
}

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

const WORKOUT_TYPE_COLORS: Record<WorkoutType, string> = {
  running: '#2196F3',
  cycling: '#4CAF50',
  swimming: '#00BCD4',
  walking: '#FF9800',
  hiking: '#795548',
  yoga: '#9C27B0',
  strength_training: '#F44336',
  other: '#607D8B',
};

const PieChartWidget: React.FC<PieChartWidgetProps> = ({
  workouts,
  title = '運動類型分布',
}) => {
  const screenWidth = Dimensions.get('window').width;

  const { chartData, legendData } = useMemo(() => {
    // 計算每種運動類型的次數
    const typeCounts: Record<string, number> = {};
    let total = 0;

    workouts.forEach((workout) => {
      typeCounts[workout.workout_type] = (typeCounts[workout.workout_type] || 0) + 1;
      total++;
    });

    // 轉換為圖表格式
    const data = Object.entries(typeCounts).map(([type, count]) => ({
      x: WORKOUT_TYPE_LABELS[type as WorkoutType] || type,
      y: count,
      percentage: ((count / total) * 100).toFixed(1),
      color: WORKOUT_TYPE_COLORS[type as WorkoutType] || '#999',
    }));

    // 排序 (由大到小)
    data.sort((a, b) => b.y - a.y);

    // Legend 數據
    const legend = data.map((item) => ({
      name: `${item.x} (${item.percentage}%)`,
      symbol: { fill: item.color },
    }));

    return {
      chartData: data,
      legendData: legend,
    };
  }, [workouts]);

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
      <View style={styles.chartContainer}>
        <VictoryPie
          data={chartData}
          width={screenWidth - 48}
          height={220}
          colorScale={chartData.map((d) => d.color)}
          labelRadius={({ radius }) => radius - 20}
          style={{
            labels: { fontSize: 12, fontWeight: '600', fill: '#fff' },
          }}
          labels={({ datum }) => `${datum.percentage}%`}
        />
      </View>
      <VictoryLegend
        x={20}
        y={0}
        orientation="horizontal"
        gutter={20}
        style={{
          labels: { fontSize: 10 },
        }}
        data={legendData}
        itemsPerRow={2}
      />
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
  chartContainer: {
    alignItems: 'center',
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

export default PieChartWidget;
