/**
 * T140: WidgetPicker
 * Widget 選擇器，讓使用者選擇要新增的 Widget
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Pressable } from 'react-native';
import { WidgetType, WIDGET_TEMPLATES } from '../../types/dashboard';

interface WidgetPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectWidget: (type: WidgetType) => void;
}

interface WidgetOption {
  type: WidgetType;
  title: string;
  description: string;
  icon: string;
}

export const WidgetPicker: React.FC<WidgetPickerProps> = ({
  visible,
  onClose,
  onSelectWidget,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const widgetOptions: WidgetOption[] = Object.entries(WIDGET_TEMPLATES).map(
    ([type, config]) => ({
      type: type as WidgetType,
      title: config.default_title,
      description: config.description,
      icon: config.icon,
    })
  );

  const categories = [
    { id: 'all', label: '全部' },
    { id: 'progress', label: '進度' },
    { id: 'stats', label: '統計' },
    { id: 'actions', label: '操作' },
  ];

  const filterWidgets = (widgets: WidgetOption[]): WidgetOption[] => {
    if (selectedCategory === 'all') return widgets;

    const categoryMap: Record<string, WidgetType[]> = {
      progress: ['progress_ring', 'goal_tracker', 'streak_counter'],
      stats: [
        'recent_workouts',
        'achievement_showcase',
        'workout_heatmap',
        'stats_comparison',
        'line_chart',
        'bar_chart',
        'pie_chart',
        'distance_leaderboard',
      ],
      actions: ['quick_actions'],
    };

    return widgets.filter((widget) =>
      categoryMap[selectedCategory]?.includes(widget.type)
    );
  };

  const filteredWidgets = filterWidgets(widgetOptions);

  const renderWidgetOption = ({ item }: { item: WidgetOption }) => (
    <TouchableOpacity
      style={styles.widgetOption}
      onPress={() => {
        onSelectWidget(item.type);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <View style={styles.widgetIconContainer}>
        <Text style={styles.widgetIcon}>{item.icon}</Text>
      </View>
      <View style={styles.widgetInfo}>
        <Text style={styles.widgetTitle}>{item.title}</Text>
        <Text style={styles.widgetDescription}>{item.description}</Text>
      </View>
      <Text style={styles.addIcon}>+</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>新增 Widget</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.categories}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === category.id && styles.categoryLabelActive,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Widget List */}
        <FlatList
          data={filteredWidgets}
          renderItem={renderWidgetOption}
          keyExtractor={(item) => item.type}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  categories: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryLabelActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  widgetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
  },
  widgetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  widgetIcon: {
    fontSize: 24,
  },
  widgetInfo: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  widgetDescription: {
    fontSize: 13,
    color: '#666',
  },
  addIcon: {
    fontSize: 28,
    color: '#007AFF',
    fontWeight: '300',
  },
  separator: {
    height: 12,
  },
});
