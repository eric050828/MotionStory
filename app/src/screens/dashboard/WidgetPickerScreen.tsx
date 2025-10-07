/**
 * T153: WidgetPickerScreen
 * Widget 選擇介面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useDashboardStore from '../../store/dashboardStore';
import { WidgetType, WIDGET_TEMPLATES } from '../../types/dashboard';
import Button from '../../components/Button';

type WidgetCategory = 'all' | 'stats' | 'charts' | 'activity' | 'actions';

const CATEGORIES: Array<{ id: WidgetCategory; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'stats', label: '統計' },
  { id: 'charts', label: '圖表' },
  { id: 'activity', label: '活動' },
  { id: 'actions', label: '操作' },
];

const WIDGET_CATEGORIES: Record<WidgetType, WidgetCategory> = {
  progress_ring: 'stats',
  recent_workouts: 'activity',
  achievement_showcase: 'activity',
  workout_heatmap: 'charts',
  stats_comparison: 'stats',
  goal_tracker: 'stats',
  line_chart: 'charts',
  bar_chart: 'charts',
  pie_chart: 'charts',
  distance_leaderboard: 'stats',
  streak_counter: 'stats',
  quick_actions: 'actions',
};

const WidgetPickerScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentDashboard, addWidget } = useDashboardStore();

  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>('all');
  const [selectedWidget, setSelectedWidget] = useState<WidgetType | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const widgetTypes = Object.keys(WIDGET_TEMPLATES) as WidgetType[];
  const filteredWidgets = widgetTypes.filter((type) => {
    if (selectedCategory === 'all') return true;
    return WIDGET_CATEGORIES[type] === selectedCategory;
  });

  const handleWidgetSelect = (type: WidgetType) => {
    setSelectedWidget(type);
    setShowPreview(true);
  };

  const handleAddWidget = async () => {
    if (!selectedWidget || !currentDashboard) return;

    const template = WIDGET_TEMPLATES[selectedWidget];
    const nextRow = Math.max(...currentDashboard.widgets.map((w) => w.position.row + w.dimensions.height), 0);

    try {
      await addWidget(currentDashboard.id, {
        type: selectedWidget,
        title: template.default_title,
        position: { row: nextRow, col: 0 },
        dimensions: template.default_dimensions,
        config: {},
      });

      setShowPreview(false);
      navigation.goBack();
    } catch (err) {
      console.error('Failed to add widget:', err);
    }
  };

  const renderWidgetItem = ({ item }: { item: WidgetType }) => {
    const template = WIDGET_TEMPLATES[item];

    return (
      <TouchableOpacity
        style={styles.widgetCard}
        onPress={() => handleWidgetSelect(item)}
      >
        <View style={styles.widgetIcon}>
          <Text style={styles.iconText}>{template.icon}</Text>
        </View>

        <View style={styles.widgetInfo}>
          <Text style={styles.widgetName}>{template.default_title}</Text>
          <Text style={styles.widgetDescription}>{template.description}</Text>
          <Text style={styles.widgetSize}>
            大小: {template.default_dimensions.width}x{template.default_dimensions.height}
          </Text>
        </View>

        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPreviewModal = () => {
    if (!selectedWidget) return null;

    const template = WIDGET_TEMPLATES[selectedWidget];

    return (
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Widget 預覽</Text>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewIcon}>
              <Text style={styles.previewIconText}>{template.icon}</Text>
            </View>

            <Text style={styles.previewTitle}>{template.default_title}</Text>
            <Text style={styles.previewDescription}>{template.description}</Text>

            <View style={styles.previewSpecs}>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>預設大小</Text>
                <Text style={styles.specValue}>
                  {template.default_dimensions.width} × {template.default_dimensions.height}
                </Text>
              </View>

              {template.min_dimensions && (
                <View style={styles.specItem}>
                  <Text style={styles.specLabel}>最小大小</Text>
                  <Text style={styles.specValue}>
                    {template.min_dimensions.width} × {template.min_dimensions.height}
                  </Text>
                </View>
              )}

              <View style={styles.specItem}>
                <Text style={styles.specLabel}>類型</Text>
                <Text style={styles.specValue}>{template.default_size}</Text>
              </View>
            </View>

            <View style={styles.previewDemo}>
              <Text style={styles.demoLabel}>範例畫面</Text>
              <View style={styles.demoWidget}>
                <Text style={styles.demoText}>{template.default_title}</Text>
                <Text style={styles.demoIcon}>{template.icon}</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="取消"
              onPress={() => setShowPreview(false)}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="新增到儀表板"
              onPress={handleAddWidget}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Categories */}
      <View style={styles.categories}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Widget List */}
      <FlatList
        data={filteredWidgets}
        renderItem={renderWidgetItem}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>此分類暫無 Widget</Text>
          </View>
        }
      />

      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  categories: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2196F3',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  widgetCard: {
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
  widgetIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 28,
  },
  widgetInfo: {
    flex: 1,
  },
  widgetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  widgetDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  widgetSize: {
    fontSize: 11,
    color: '#999',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: '#ccc',
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  previewContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  previewIconText: {
    fontSize: 40,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  previewSpecs: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewDemo: {
    width: '100%',
  },
  demoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  demoWidget: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  demoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  demoIcon: {
    fontSize: 48,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
  },
});

export default WidgetPickerScreen;
