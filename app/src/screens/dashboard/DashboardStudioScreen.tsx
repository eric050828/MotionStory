/**
 * T152: DashboardStudioScreen
 * 儀表板編輯工作室
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useDashboardStore from '../../store/dashboardStore';
import { Widget } from '../../types/dashboard';
import { Loading } from '../../components/ui/Loading';
import { Button } from '../../components/Button';

const DashboardStudioScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    currentDashboard,
    loading,
    isDragging,
    fetchDefaultDashboard,
    updateDashboard,
  } = useDashboardStore();

  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchDefaultDashboard();
  }, []);

  const handleAddWidget = () => {
    navigation.navigate('WidgetPicker' as never);
  };

  const handleEditWidget = (widget: Widget) => {
    navigation.navigate('DragDropEditor' as never, { widgetId: widget.id } as never);
  };

  const handleSave = async () => {
    if (!currentDashboard) return;

    try {
      await updateDashboard(currentDashboard.id, {
        widgets: currentDashboard.widgets,
      });
      Alert.alert('儲存成功', '儀表板配置已更新');
      setEditMode(false);
    } catch (err) {
      Alert.alert('儲存失敗', '請稍後再試');
    }
  };

  const handleToggleEditMode = () => {
    if (editMode && currentDashboard) {
      handleSave();
    } else {
      setEditMode(true);
    }
  };

  if (loading || !currentDashboard) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{currentDashboard.name}</Text>
          <Text style={styles.subtitle}>
            {editMode ? '編輯模式' : '預覽模式'}
          </Text>
        </View>
        <Button
          title={editMode ? '儲存' : '編輯'}
          onPress={handleToggleEditMode}
          size="small"
        />
      </View>

      {/* Dashboard Preview */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {currentDashboard.widgets.map((widget) => (
            <TouchableOpacity
              key={widget.id}
              style={[
                styles.widgetPreview,
                {
                  width: `${(widget.size.width / 12) * 100}%`,
                  height: widget.size.height * 60,
                },
                editMode && styles.widgetPreviewEdit,
              ]}
              onPress={() => editMode && handleEditWidget(widget)}
              disabled={!editMode}
            >
              <View style={styles.widgetHeader}>
                <View style={styles.widgetTitleRow}>
                  <Text style={styles.widgetTitle}>{widget.title}</Text>
                  {!widget.visible && (
                    <View style={styles.hiddenBadgeInline}>
                      <Text style={styles.hiddenTextInline}>隱藏</Text>
                    </View>
                  )}
                </View>
                {editMode && (
                  <TouchableOpacity style={styles.widgetSettings}>
                    <Text>⚙️</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.widgetContent}>
                <Text style={styles.widgetType}>
                  {widget.type.replace(/_/g, ' ').toUpperCase()}
                </Text>
                <Text style={styles.widgetSize}>
                  {widget.size.width}x{widget.size.height}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Add Widget Button */}
          {editMode && (
            <TouchableOpacity
              style={styles.addWidgetButton}
              onPress={handleAddWidget}
            >
              <Text style={styles.addWidgetIcon}>+</Text>
              <Text style={styles.addWidgetText}>新增 Widget</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Edit Mode Actions */}
      {editMode && (
        <View style={styles.actions}>
          <Button
            title="Widget 庫"
            onPress={handleAddWidget}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="佈局編輯器"
            onPress={() => navigation.navigate('DragDropEditor' as never)}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  widgetPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  widgetPreviewEdit: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  widgetSettings: {
    padding: 4,
  },
  widgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hiddenBadgeInline: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hiddenTextInline: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '600',
  },
  widgetContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widgetType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  widgetSize: {
    fontSize: 10,
    color: '#ccc',
  },

  addWidgetButton: {
    width: '48%',
    height: 120,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addWidgetIcon: {
    fontSize: 32,
    color: '#2196F3',
    marginBottom: 8,
  },
  addWidgetText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
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

export default DashboardStudioScreen;
