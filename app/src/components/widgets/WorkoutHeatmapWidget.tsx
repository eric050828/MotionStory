/**
 * T133: WorkoutHeatmapWidget
 * 運動熱力圖 Widget，類似 GitHub 貢獻圖
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { WidgetContainer } from './WidgetContainer';

interface HeatmapData {
  date: string;
  count: number;
}

interface WorkoutHeatmapWidgetProps {
  data: HeatmapData[];
  year?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getColor = (count: number): string => {
  if (count === 0) return '#EBEDF0';
  if (count <= 2) return '#C6E48B';
  if (count <= 4) return '#7BC96F';
  if (count <= 6) return '#239A3B';
  return '#196127';
};

export const WorkoutHeatmapWidget: React.FC<WorkoutHeatmapWidgetProps> = ({
  data,
  year = new Date().getFullYear(),
}) => {
  // 建立 365 天的資料映射
  const dataMap = new Map(data.map((item) => [item.date, item.count]));

  // 生成從今年開始的 52 週資料
  const weeks: HeatmapData[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364); // 往前推 364 天

  let currentWeek: HeatmapData[] = [];
  const currentDate = new Date(startDate);

  // 從週日開始
  const dayOfWeek = currentDate.getDay();
  if (dayOfWeek !== 0) {
    currentDate.setDate(currentDate.getDate() - dayOfWeek);
  }

  for (let i = 0; i < 371; i++) {
    const dateString = currentDate.toISOString().split('T')[0];
    const count = dataMap.get(dateString) || 0;

    currentWeek.push({ date: dateString, count });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // 計算月份標籤位置
  const monthLabels = [];
  for (let weekIndex = 0; weekIndex < weeks.length; weekIndex++) {
    const firstDay = weeks[weekIndex][0];
    if (firstDay) {
      const date = new Date(firstDay.date);
      if (date.getDate() <= 7) {
        monthLabels.push({
          month: MONTHS[date.getMonth()],
          position: weekIndex,
        });
      }
    }
  }

  return (
    <WidgetContainer title="運動熱力圖" icon="📅">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.container}>
          {/* 月份標籤 */}
          <View style={styles.monthLabels}>
            {monthLabels.map((label, index) => (
              <Text
                key={index}
                style={[styles.monthLabel, { left: label.position * 14 }]}
              >
                {label.month}
              </Text>
            ))}
          </View>

          {/* 熱力圖 */}
          <View style={styles.heatmap}>
            {/* 星期標籤 */}
            <View style={styles.dayLabels}>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, index) => (
                <Text key={index} style={styles.dayLabel}>
                  {day}
                </Text>
              ))}
            </View>

            {/* 週資料 */}
            <View style={styles.weeks}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((day, dayIndex) => (
                    <View
                      key={`${weekIndex}-${dayIndex}`}
                      style={[
                        styles.day,
                        { backgroundColor: getColor(day.count) },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          {/* 圖例 */}
          <View style={styles.legend}>
            <Text style={styles.legendText}>少</Text>
            {[0, 2, 4, 6, 8].map((count) => (
              <View
                key={count}
                style={[styles.legendBox, { backgroundColor: getColor(count) }]}
              />
            ))}
            <Text style={styles.legendText}>多</Text>
          </View>
        </View>
      </ScrollView>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  monthLabels: {
    height: 20,
    position: 'relative',
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#666',
  },
  heatmap: {
    flexDirection: 'row',
  },
  dayLabels: {
    marginRight: 8,
  },
  dayLabel: {
    height: 12,
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  weeks: {
    flexDirection: 'row',
  },
  week: {
    marginRight: 2,
  },
  day: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginBottom: 2,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
    marginHorizontal: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
