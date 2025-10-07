/**
 * T138: QuickActionsWidget
 * 快速操作 Widget，提供常用操作的快捷按鈕
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WidgetContainer } from './WidgetContainer';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface QuickActionsWidgetProps {
  actions?: QuickAction[];
}

const DEFAULT_ACTIONS: Omit<QuickAction, 'onPress'>[] = [
  { id: 'new_workout', label: '新增運動', icon: '➕', color: '#007AFF' },
  { id: 'view_stats', label: '統計數據', icon: '📊', color: '#5856D6' },
  { id: 'achievements', label: '成就', icon: '🏆', color: '#FF9500' },
  { id: 'goals', label: '目標', icon: '🎯', color: '#34C759' },
];

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  actions,
}) => {
  const displayActions = actions || DEFAULT_ACTIONS.map(action => ({
    ...action,
    onPress: () => console.log(`Action: ${action.id}`),
  }));

  return (
    <WidgetContainer title="快速操作" icon="⚡">
      <View style={styles.container}>
        {displayActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={action.onPress}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${action.color || '#007AFF'}15` },
              ]}
            >
              <Text style={styles.icon}>{action.icon}</Text>
            </View>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  actionButton: {
    alignItems: 'center',
    minWidth: 70,
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});
