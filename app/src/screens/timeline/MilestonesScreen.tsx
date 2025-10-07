/**
 * T156: MilestonesScreen
 * 里程碑管理畫面
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Milestone, MILESTONE_ICONS } from '../../types/timeline';
import timelineService from '../../services/timelineService';
import Button from '../../components/Button';
import Loading from '../../components/ui/Loading';

const MilestonesScreen: React.FC = () => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const data = await timelineService.getMilestones();
      setMilestones(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('刪除里程碑', '確定要刪除這個里程碑嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          try {
            await timelineService.deleteMilestone(id);
            setMilestones((prev) => prev.filter((m) => m.id !== id));
          } catch (err) {
            Alert.alert('刪除失敗', '請稍後再試');
          }
        },
      },
    ]);
  };

  const renderMilestone = ({ item }: { item: Milestone }) => {
    const date = new Date(item.milestone_date);
    const icon = item.icon || MILESTONE_ICONS[item.milestone_type];

    return (
      <View style={styles.milestoneCard}>
        <View style={styles.milestoneIcon}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.milestoneContent}>
          <Text style={styles.milestoneTitle}>{item.title}</Text>
          {item.description && (
            <Text style={styles.milestoneDescription}>{item.description}</Text>
          )}
          <Text style={styles.milestoneDate}>
            {date.toLocaleDateString('zh-TW')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={milestones}
        renderItem={renderMilestone}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暫無里程碑</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  milestoneCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  milestoneDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  deleteText: {
    fontSize: 20,
    color: '#999',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
  },
});

export default MilestonesScreen;
