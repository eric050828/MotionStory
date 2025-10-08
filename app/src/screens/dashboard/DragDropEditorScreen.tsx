/**
 * T154: DragDropEditorScreen
 * Widget 拖拉編輯器
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import useDashboardStore from '../../store/dashboardStore';
import { Widget } from '../../types/dashboard';
import { Button } from '../../components/Button';

const DragDropEditorScreen: React.FC = () => {
  const navigation = useNavigation();
  const { currentDashboard, reorderWidgets } = useDashboardStore();

  const [widgets, setWidgets] = useState<Widget[]>(currentDashboard?.widgets || []);
  const [draggedWidget, setDraggedWidget] = useState<Widget | null>(null);

  const handleDragStart = (widget: Widget) => {
    setDraggedWidget(widget);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const handlePositionChange = (widgetId: string, row: number, col: number) => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId
          ? { ...w, position: { row, col } }
          : w
      )
    );
  };

  const handleSave = async () => {
    if (!currentDashboard) return;

    try {
      await reorderWidgets(currentDashboard.id, widgets);
      Alert.alert('儲存成功', '佈局已更新');
      navigation.goBack();
    } catch (err) {
      Alert.alert('儲存失敗', '請稍後再試');
    }
  };

  const renderGrid = () => {
    if (!currentDashboard) return null;

    const gridColumns = currentDashboard.grid_columns;
    const cellSize = 80;
    const gap = 8;

    return (
      <View style={styles.gridContainer}>
        {widgets.map((widget) => (
          <TouchableOpacity
            key={widget.id}
            style={[
              styles.gridWidget,
              {
                left: widget.position.col * (cellSize + gap),
                top: widget.position.row * (cellSize + gap),
                width: widget.dimensions.width * cellSize + (widget.dimensions.width - 1) * gap,
                height: widget.dimensions.height * cellSize + (widget.dimensions.height - 1) * gap,
              },
              draggedWidget?.id === widget.id && styles.gridWidgetDragging,
            ]}
            onLongPress={() => handleDragStart(widget)}
            onPressOut={handleDragEnd}
          >
            <Text style={styles.gridWidgetTitle}>{widget.title}</Text>
            <Text style={styles.gridWidgetSize}>
              {widget.dimensions.width}×{widget.dimensions.height}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Grid Lines */}
        <View style={styles.gridLines}>
          {Array.from({ length: 10 }).map((_, row) =>
            Array.from({ length: gridColumns }).map((_, col) => (
              <View
                key={`${row}-${col}`}
                style={[
                  styles.gridCell,
                  {
                    left: col * (cellSize + gap),
                    top: row * (cellSize + gap),
                    width: cellSize,
                    height: cellSize,
                  },
                ]}
              />
            ))
          )}
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>佈局編輯器</Text>
        <Text style={styles.subtitle}>長按 Widget 進行拖動</Text>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderGrid()}
        </ScrollView>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          title="取消"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="儲存佈局"
          onPress={handleSave}
          style={styles.actionButton}
        />
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scrollContent: {
    padding: 16,
  },
  gridContainer: {
    position: 'relative',
    minWidth: 400,
    minHeight: 800,
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gridCell: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  gridWidget: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2196F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gridWidgetDragging: {
    opacity: 0.7,
    transform: [{ scale: 1.05 }],
    zIndex: 1000,
  },
  gridWidgetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  gridWidgetSize: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
  },
});

export default DragDropEditorScreen;
