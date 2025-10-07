/**
 * T135: GoalTrackerWidget
 * 目標追蹤 Widget，顯示多個目標的進度
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { WidgetContainer } from './WidgetContainer';

interface Goal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: string;
  deadline?: string;
}

interface GoalTrackerWidgetProps {
  goals: Goal[];
}

interface GoalItemProps {
  goal: Goal;
}

const GoalItem: React.FC<GoalItemProps> = ({ goal }) => {
  const progress = Math.min((goal.current / goal.target) * 100, 100);
  const isCompleted = progress >= 100;

  const daysRemaining = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <View style={styles.goalItem}>
      <View style={styles.goalHeader}>
        <View style={styles.goalTitleContainer}>
          <Text style={styles.goalIcon}>{goal.icon}</Text>
          <Text style={styles.goalTitle}>{goal.title}</Text>
        </View>
        {isCompleted && <Text style={styles.completedBadge}>✓ 完成</Text>}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {progress.toFixed(0)}%
        </Text>
      </View>

      <View style={styles.goalFooter}>
        <Text style={styles.goalValues}>
          {goal.current.toFixed(1)} / {goal.target.toFixed(1)} {goal.unit}
        </Text>
        {daysRemaining !== null && daysRemaining > 0 && (
          <Text style={styles.deadline}>
            {daysRemaining} 天剩餘
          </Text>
        )}
      </View>
    </View>
  );
};

export const GoalTrackerWidget: React.FC<GoalTrackerWidgetProps> = ({ goals }) => {
  return (
    <WidgetContainer title="目標追蹤" icon="🎯">
      {goals.length > 0 ? (
        <FlatList
          data={goals}
          renderItem={({ item }) => <GoalItem goal={item} />}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyText}>尚未設定目標</Text>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  goalItem: {
    paddingVertical: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    minWidth: 40,
    textAlign: 'right',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalValues: {
    fontSize: 12,
    color: '#666',
  },
  deadline: {
    fontSize: 11,
    color: '#FF9500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
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
