/**
 * VirtualList Component - Optimized list rendering with FlashList
 * Replaces FlatList for better performance with large datasets
 */
import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

interface VirtualListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement;
  estimatedItemSize?: number;
  contentContainerStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function VirtualList<T>({
  data,
  renderItem,
  keyExtractor,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  estimatedItemSize = 100,
  contentContainerStyle,
  refreshing,
  onRefresh,
}: VirtualListProps<T>) {
  // Memoize render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback(
    (props: { item: T; index: number }) => renderItem(props),
    [renderItem]
  );

  // Memoize key extractor
  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  return (
    <FlashList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      estimatedItemSize={estimatedItemSize}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      contentContainerStyle={contentContainerStyle}
      onRefresh={onRefresh}
      refreshing={refreshing}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={5}
    />
  );
}

/**
 * WorkoutVirtualList - Optimized workout list
 */
interface Workout {
  id: string;
  type: string;
  date: string;
  duration: number;
  distance?: number;
}

interface WorkoutListItemProps {
  workout: Workout;
  onPress: (workout: Workout) => void;
}

const WorkoutListItem = React.memo<WorkoutListItemProps>(
  ({ workout, onPress }) => {
    const handlePress = useCallback(() => {
      onPress(workout);
    }, [workout, onPress]);

    return (
      <View style={styles.workoutItem}>
        {/* Workout item content - implement based on design */}
      </View>
    );
  }
);

interface WorkoutVirtualListProps {
  workouts: Workout[];
  onWorkoutPress: (workout: Workout) => void;
  onLoadMore?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const WorkoutVirtualList: React.FC<WorkoutVirtualListProps> = ({
  workouts,
  onWorkoutPress,
  onLoadMore,
  refreshing,
  onRefresh,
}) => {
  const renderWorkout = useCallback(
    ({ item }: { item: Workout }) => (
      <WorkoutListItem workout={item} onPress={onWorkoutPress} />
    ),
    [onWorkoutPress]
  );

  const keyExtractor = useCallback((item: Workout) => item.id, []);

  return (
    <VirtualList
      data={workouts}
      renderItem={renderWorkout}
      keyExtractor={keyExtractor}
      onEndReached={onLoadMore}
      estimatedItemSize={80}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

/**
 * TimelineVirtualList - Optimized timeline rendering
 */
interface TimelineEntry {
  id: string;
  type: 'workout' | 'achievement' | 'milestone';
  date: string;
  data: any;
}

interface TimelineItemProps {
  entry: TimelineEntry;
  onPress?: (entry: TimelineEntry) => void;
}

const TimelineItem = React.memo<TimelineItemProps>(({ entry, onPress }) => {
  const handlePress = useCallback(() => {
    onPress?.(entry);
  }, [entry, onPress]);

  return (
    <View style={styles.timelineItem}>
      {/* Timeline item content - implement based on design */}
    </View>
  );
});

interface TimelineVirtualListProps {
  entries: TimelineEntry[];
  onEntryPress?: (entry: TimelineEntry) => void;
  onLoadMore?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const TimelineVirtualList: React.FC<TimelineVirtualListProps> = ({
  entries,
  onEntryPress,
  onLoadMore,
  refreshing,
  onRefresh,
}) => {
  const renderEntry = useCallback(
    ({ item }: { item: TimelineEntry }) => (
      <TimelineItem entry={item} onPress={onEntryPress} />
    ),
    [onEntryPress]
  );

  const keyExtractor = useCallback((item: TimelineEntry) => item.id, []);

  return (
    <VirtualList
      data={entries}
      renderItem={renderEntry}
      keyExtractor={keyExtractor}
      onEndReached={onLoadMore}
      estimatedItemSize={120}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
};

/**
 * Memory optimization utilities
 */

/**
 * Calculate optimal estimated item size based on screen dimensions
 */
export function calculateEstimatedItemSize(
  itemType: 'workout' | 'timeline' | 'achievement',
  screenHeight: number
): number {
  const sizes = {
    workout: 80,
    timeline: 120,
    achievement: 100,
  };

  const baseSize = sizes[itemType];

  // Adjust for screen size
  if (screenHeight < 600) {
    return baseSize * 0.8;
  } else if (screenHeight > 800) {
    return baseSize * 1.2;
  }

  return baseSize;
}

/**
 * Memory usage monitor for list performance
 */
export class ListMemoryMonitor {
  private startMemory: number = 0;
  private measurements: number[] = [];

  start() {
    // Note: React Native doesn't provide direct memory API
    // This is a placeholder for future native module integration
    this.startMemory = Date.now();
    this.measurements = [];
  }

  measure() {
    this.measurements.push(Date.now() - this.startMemory);
  }

  getStats() {
    if (this.measurements.length === 0) {
      return { avg: 0, max: 0, count: 0 };
    }

    return {
      avg: this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length,
      max: Math.max(...this.measurements),
      count: this.measurements.length,
    };
  }
}

/**
 * Recycling pool for list items (advanced optimization)
 */
export class ItemRecyclingPool<T> {
  private pool: T[] = [];
  private maxPoolSize: number;

  constructor(maxPoolSize: number = 20) {
    this.maxPoolSize = maxPoolSize;
  }

  recycle(item: T) {
    if (this.pool.length < this.maxPoolSize) {
      this.pool.push(item);
    }
  }

  acquire(): T | undefined {
    return this.pool.pop();
  }

  clear() {
    this.pool = [];
  }

  get size() {
    return this.pool.length;
  }
}

const styles = StyleSheet.create({
  workoutItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 80,
  },
  timelineItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 120,
  },
});

/**
 * Performance recommendations:
 *
 * 1. Use FlashList instead of FlatList for lists with >50 items
 * 2. Memoize renderItem and keyExtractor callbacks
 * 3. Use React.memo for list item components
 * 4. Set appropriate estimatedItemSize based on content
 * 5. Implement pagination with onEndReached
 * 6. Use removeClippedSubviews for better memory usage
 * 7. Keep windowSize reasonable (5-10)
 * 8. Batch updates with maxToRenderPerBatch
 */
