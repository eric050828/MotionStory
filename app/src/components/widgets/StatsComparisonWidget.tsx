/**
 * T134: StatsComparisonWidget
 * 數據對比 Widget，比較不同時期的運動數據
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WidgetContainer } from './WidgetContainer';

interface PeriodStats {
  label: string;
  distance: number;
  duration: number;
  workouts: number;
  calories: number;
}

interface StatsComparisonWidgetProps {
  currentPeriod: PeriodStats;
  previousPeriod: PeriodStats;
}

interface StatItemProps {
  label: string;
  current: number;
  previous: number;
  unit: string;
  icon: string;
}

const StatItem: React.FC<StatItemProps> = ({
  label,
  current,
  previous,
  unit,
  icon,
}) => {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isIncrease = change > 0;
  const isDecrease = change < 0;

  return (
    <View style={styles.statItem}>
      <View style={styles.statHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statValues}>
        <Text style={styles.currentValue}>
          {current.toFixed(1)} {unit}
        </Text>
        <Text style={styles.previousValue}>
          vs {previous.toFixed(1)} {unit}
        </Text>
      </View>
      {Math.abs(change) > 0.1 && (
        <View style={styles.changeContainer}>
          <Text
            style={[
              styles.changeText,
              isIncrease && styles.increaseText,
              isDecrease && styles.decreaseText,
            ]}
          >
            {isIncrease ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );
};

export const StatsComparisonWidget: React.FC<StatsComparisonWidgetProps> = ({
  currentPeriod,
  previousPeriod,
}) => {
  return (
    <WidgetContainer title="數據對比" icon="📊">
      <View style={styles.container}>
        <View style={styles.periodLabels}>
          <Text style={styles.currentPeriodLabel}>{currentPeriod.label}</Text>
          <Text style={styles.previousPeriodLabel}>vs {previousPeriod.label}</Text>
        </View>

        <View style={styles.stats}>
          <StatItem
            label="距離"
            current={currentPeriod.distance}
            previous={previousPeriod.distance}
            unit="km"
            icon="🏃"
          />
          <StatItem
            label="時長"
            current={currentPeriod.duration}
            previous={previousPeriod.duration}
            unit="min"
            icon="⏱️"
          />
          <StatItem
            label="次數"
            current={currentPeriod.workouts}
            previous={previousPeriod.workouts}
            unit="次"
            icon="💪"
          />
          <StatItem
            label="卡路里"
            current={currentPeriod.calories}
            previous={previousPeriod.calories}
            unit="kcal"
            icon="🔥"
          />
        </View>
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  periodLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  currentPeriodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  previousPeriodLabel: {
    fontSize: 14,
    color: '#999',
  },
  stats: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValues: {
    alignItems: 'flex-end',
    flex: 1,
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  previousValue: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  changeContainer: {
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  increaseText: {
    color: '#34C759',
  },
  decreaseText: {
    color: '#FF3B30',
  },
});
