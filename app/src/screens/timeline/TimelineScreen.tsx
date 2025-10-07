/**
 * T155: TimelineScreen
 * 時間軸顯示 - 運動、成就、里程碑混合
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TimelineEvent, TIMELINE_EVENT_COLORS } from '../../types/timeline';
import timelineService from '../../services/timelineService';
import Loading from '../../components/ui/Loading';

const TimelineScreen: React.FC = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async (refresh = false) => {
    try {
      const response = await timelineService.getTimeline({
        limit: 20,
        offset: refresh ? 0 : (page - 1) * 20,
      });

      if (refresh) {
        setEvents(response.events);
        setPage(1);
      } else {
        setEvents((prev) => [...prev, ...response.events]);
      }

      setHasMore(response.has_more);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTimeline(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage((p) => p + 1);
      fetchTimeline();
    }
  };

  const handleEventPress = (event: TimelineEvent) => {
    if (event.type === 'workout') {
      navigation.navigate('WorkoutDetail' as never, { workoutId: event.data.id } as never);
    }
  };

  const renderEvent = ({ item }: { item: TimelineEvent }) => {
    const colors = TIMELINE_EVENT_COLORS[item.type];
    const date = new Date(item.date);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => handleEventPress(item)}
      >
        <View style={[styles.eventIndicator, { backgroundColor: colors.border }]} />

        <View style={styles.eventContent}>
          <View style={[styles.eventIcon, { backgroundColor: colors.bg }]}>
            <Text style={styles.iconText}>{item.icon || '📍'}</Text>
          </View>

          <View style={styles.eventDetails}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            {item.description && (
              <Text style={styles.eventDescription}>{item.description}</Text>
            )}
            <Text style={styles.eventDate}>
              {date.toLocaleDateString('zh-TW')} {date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && events.length === 0) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>暫無時間軸事件</Text>
          </View>
        }
      />
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
  eventCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 12,
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
});

export default TimelineScreen;
