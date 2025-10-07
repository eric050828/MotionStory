/**
 * T132: AchievementShowcaseWidget
 * 成就展示 Widget，顯示最新獲得的成就
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { WidgetContainer } from './WidgetContainer';
import { Achievement, ACHIEVEMENT_CONFIG } from '../../types/achievement';

interface AchievementShowcaseWidgetProps {
  achievements: Achievement[];
  onAchievementPress?: (achievement: Achievement) => void;
  maxItems?: number;
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  });
};

export const AchievementShowcaseWidget: React.FC<AchievementShowcaseWidgetProps> = ({
  achievements,
  onAchievementPress,
  maxItems = 3,
}) => {
  const displayAchievements = achievements.slice(0, maxItems);

  const renderAchievement = ({ item }: { item: Achievement }) => {
    const config = ACHIEVEMENT_CONFIG[item.achievement_type];

    return (
      <TouchableOpacity
        style={styles.achievementItem}
        onPress={() => onAchievementPress?.(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.achievementIcon}>{config.icon}</Text>
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>{config.title}</Text>
          <Text style={styles.achievementDescription}>{config.description}</Text>
          <Text style={styles.achievementDate}>{formatDate(item.achieved_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <WidgetContainer title="成就展示" icon="🏆">
      {displayAchievements.length > 0 ? (
        <FlatList
          data={displayAchievements}
          renderItem={renderAchievement}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>開始運動解鎖成就</Text>
        </View>
      )}
    </WidgetContainer>
  );
};

const styles = StyleSheet.create({
  achievementItem: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 11,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 60,
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
