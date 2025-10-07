/**
 * T136: DistanceLeaderboardWidget
 * 距離排行榜 Widget，顯示個人距離排行
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { WidgetContainer } from './WidgetContainer';

interface LeaderboardEntry {
  rank: number;
  period: string;
  distance: number;
  workouts: number;
  isCurrentPeriod?: boolean;
}

interface DistanceLeaderboardWidgetProps {
  entries: LeaderboardEntry[];
  metric?: 'distance' | 'duration' | 'workouts';
  period?: 'weekly' | 'monthly' | 'yearly';
}

const RANK_MEDALS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const METRIC_CONFIG = {
  distance: { label: '距離', unit: 'km' },
  duration: { label: '時長', unit: 'min' },
  workouts: { label: '次數', unit: '次' },
};

const PERIOD_CONFIG = {
  weekly: '週',
  monthly: '月',
  yearly: '年',
};

export const DistanceLeaderboardWidget: React.FC<DistanceLeaderboardWidgetProps> = ({
  entries,
  metric = 'distance',
  period = 'monthly',
}) => {
  const config = METRIC_CONFIG[metric];
  const periodLabel = PERIOD_CONFIG[period];

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => {
    const medal = RANK_MEDALS[item.rank];

    return (
      <View
        style={[
          styles.entryItem,
          item.isCurrentPeriod && styles.currentPeriodItem,
        ]}
      >
        <View style={styles.rankContainer}>
          {medal ? (
            <Text style={styles.medalIcon}>{medal}</Text>
          ) : (
            <Text style={styles.rankNumber}>#{item.rank}</Text>
          )}
        </View>

        <View style={styles.entryInfo}>
          <Text style={styles.periodText}>{item.period}</Text>
          <Text style={styles.workoutsText}>{item.workouts} 次運動</Text>
        </View>

        <View style={styles.distanceContainer}>
          <Text style={styles.distanceValue}>
            {item.distance.toFixed(1)}
          </Text>
          <Text style={styles.distanceUnit}>{config.unit}</Text>
        </View>
      </View>
    );
  };

  return (
    <WidgetContainer title={`${config.label}排行 (${periodLabel})`} icon="🏃">
      {entries.length > 0 ? (
        <View>
          <View style={styles.header}>
            <Text style={styles.headerText}>排名</Text>
            <Text style={styles.headerText}>時期</Text>
            <Text style={styles.headerText}>{config.label}</Text>
          </View>
          <FlatList
            data={entries}
            renderItem={renderEntry}
            keyExtractor={(item) => `${item.rank}-${item.period}`}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>尚無排行資料</Text>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    flex: 1,
    textAlign: 'center',
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  currentPeriodItem: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    marginHorizontal: -4,
    paddingHorizontal: 8,
  },
  rankContainer: {
    width: 48,
    alignItems: 'center',
  },
  medalIcon: {
    fontSize: 24,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  entryInfo: {
    flex: 1,
    marginLeft: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  workoutsText: {
    fontSize: 12,
    color: '#666',
  },
  distanceContainer: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  distanceUnit: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});
