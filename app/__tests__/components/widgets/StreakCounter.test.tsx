/**
 * Dashboard Widget Component Tests (T047)
 * 測試 Widget 資料顯示、拖拉互動、大小調整
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StreakCounter from '@/app/components/widgets/StreakCounter';
import { useDashboardStore } from '@/app/stores/dashboardStore';

// Mock Zustand store
jest.mock('@/app/stores/dashboardStore');

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    GestureDetector: View,
    Gesture: {
      Pan: () => ({
        onStart: jest.fn().mockReturnThis(),
        onUpdate: jest.fn().mockReturnThis(),
        onEnd: jest.fn().mockReturnThis(),
      }),
    },
  };
});

describe('StreakCounter Widget Tests', () => {
  const defaultWidget = {
    id: 'widget-001',
    type: 'streak_counter',
    position: { x: 0, y: 0 },
    size: { width: 6, height: 4 },
    config: { time_range: '30d' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Widget Rendering', () => {
    it('應該顯示連續天數標題', () => {
      const { getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      expect(getByText('連續運動天數')).toBeTruthy();
    });

    it('應該顯示當前連續天數', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      expect(getByText('7')).toBeTruthy();
      expect(getByText('天')).toBeTruthy();
    });

    it('連續天數為 0 時應該顯示鼓勵訊息', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(0),
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      expect(getByText('開始你的運動旅程！')).toBeTruthy();
    });

    it('應該顯示進度條', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        getStreakGoal: jest.fn().mockReturnValue(30),
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const progressBar = getByTestId('streak-progress-bar');
      expect(progressBar).toBeTruthy();
      // 7/30 = 23.33%
      expect(progressBar.props.style).toEqual(
        expect.objectContaining({ width: '23%' })
      );
    });

    it('達到目標時應該顯示慶祝圖示', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(30),
        getStreakGoal: jest.fn().mockReturnValue(30),
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const celebrationIcon = getByTestId('celebration-icon');
      expect(celebrationIcon).toBeTruthy();
    });
  });

  describe('Data Loading States', () => {
    it('載入中應該顯示 Loading 指示器', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(null),
        isLoading: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const loadingIndicator = getByTestId('widget-loading');
      expect(loadingIndicator).toBeTruthy();
    });

    it('載入失敗應該顯示錯誤訊息', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(null),
        error: '載入失敗',
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      expect(getByText(/載入失敗/i)).toBeTruthy();
    });

    it('點擊錯誤訊息應該重試載入', async () => {
      const mockRefresh = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(null),
        error: '載入失敗',
        refreshWidget: mockRefresh,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      fireEvent.press(getByText('重試'));

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledWith(defaultWidget.id);
      });
    });
  });

  describe('Drag and Drop Interaction', () => {
    it('長按應該進入編輯模式', async () => {
      const mockSetEditMode = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        setEditMode: mockSetEditMode,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const widget = getByTestId('widget-container');
      fireEvent(widget, 'onLongPress');

      await waitFor(() => {
        expect(mockSetEditMode).toHaveBeenCalledWith(true);
      });
    });

    it('拖拉應該更新 Widget 位置', async () => {
      const mockUpdatePosition = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        updateWidgetPosition: mockUpdatePosition,
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const widget = getByTestId('widget-container');

      // 模擬拖拉手勢
      fireEvent(widget, 'onPanGestureEvent', {
        nativeEvent: {
          translationX: 100,
          translationY: 50,
        },
      });

      fireEvent(widget, 'onPanGestureEnd');

      await waitFor(() => {
        expect(mockUpdatePosition).toHaveBeenCalledWith(
          defaultWidget.id,
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
          })
        );
      });
    });

    it('拖拉過程應該顯示視覺回饋', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        isEditMode: true,
        isDragging: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const widget = getByTestId('widget-container');
      
      // 拖拉中應該有陰影或透明度變化
      expect(widget.props.style).toEqual(
        expect.objectContaining({
          opacity: expect.any(Number),
          elevation: expect.any(Number),
        })
      );
    });
  });

  describe('Widget Resizing', () => {
    it('編輯模式應該顯示大小調整控制點', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const resizeHandle = getByTestId('resize-handle');
      expect(resizeHandle).toBeTruthy();
    });

    it('拖拉控制點應該調整 Widget 大小', async () => {
      const mockUpdateSize = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        updateWidgetSize: mockUpdateSize,
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const resizeHandle = getByTestId('resize-handle');

      fireEvent(resizeHandle, 'onPanGestureEvent', {
        nativeEvent: {
          translationX: 100,
          translationY: 80,
        },
      });

      fireEvent(resizeHandle, 'onPanGestureEnd');

      await waitFor(() => {
        expect(mockUpdateSize).toHaveBeenCalledWith(
          defaultWidget.id,
          expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number),
          })
        );
      });
    });

    it('大小調整應該有最小和最大限制', () => {
      const mockUpdateSize = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        updateWidgetSize: mockUpdateSize,
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const resizeHandle = getByTestId('resize-handle');

      // 嘗試縮小到低於最小值
      fireEvent(resizeHandle, 'onPanGestureEvent', {
        nativeEvent: {
          translationX: -500,
          translationY: -500,
        },
      });

      fireEvent(resizeHandle, 'onPanGestureEnd');

      // 應該限制在最小值 (如 3x2)
      expect(mockUpdateSize).toHaveBeenCalledWith(
        defaultWidget.id,
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );

      const calledSize = mockUpdateSize.mock.calls[0][1];
      expect(calledSize.width).toBeGreaterThanOrEqual(3);
      expect(calledSize.height).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Widget Configuration', () => {
    it('點擊設定按鈕應該開啟配置面板', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, queryByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const configButton = getByTestId('widget-config-button');
      fireEvent.press(configButton);

      const configPanel = queryByTestId('widget-config-panel');
      expect(configPanel).toBeTruthy();
    });

    it('應該可以修改時間範圍設定', async () => {
      const mockUpdateConfig = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        updateWidgetConfig: mockUpdateConfig,
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const configButton = getByTestId('widget-config-button');
      fireEvent.press(configButton);

      // 選擇不同的時間範圍
      fireEvent.press(getByText('90 天'));

      await waitFor(() => {
        expect(mockUpdateConfig).toHaveBeenCalledWith(
          defaultWidget.id,
          expect.objectContaining({
            time_range: '90d',
          })
        );
      });
    });

    it('關閉配置面板應該儲存變更', async () => {
      const mockUpdateConfig = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        updateWidgetConfig: mockUpdateConfig,
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const configButton = getByTestId('widget-config-button');
      fireEvent.press(configButton);

      const closeButton = getByTestId('config-close-button');
      fireEvent.press(closeButton);

      await waitFor(() => {
        expect(mockUpdateConfig).toHaveBeenCalled();
      });
    });
  });

  describe('Widget Deletion', () => {
    it('編輯模式應該顯示刪除按鈕', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const deleteButton = getByTestId('widget-delete-button');
      expect(deleteButton).toBeTruthy();
    });

    it('點擊刪除應該顯示確認對話框', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, queryByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const deleteButton = getByTestId('widget-delete-button');
      fireEvent.press(deleteButton);

      const confirmDialog = queryByTestId('delete-confirm-dialog');
      expect(confirmDialog).toBeTruthy();
    });

    it('確認刪除應該移除 Widget', async () => {
      const mockDeleteWidget = jest.fn();
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        deleteWidget: mockDeleteWidget,
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, getByText } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const deleteButton = getByTestId('widget-delete-button');
      fireEvent.press(deleteButton);

      fireEvent.press(getByText('確認刪除'));

      await waitFor(() => {
        expect(mockDeleteWidget).toHaveBeenCalledWith(defaultWidget.id);
      });
    });
  });

  describe('Accessibility', () => {
    it('Widget 應該有正確的 accessibility label', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const widget = getByTestId('widget-container');
      expect(widget.props.accessibilityLabel).toBe('連續運動天數 Widget，目前 7 天');
    });

    it('編輯模式控制應該有正確的 accessibility hint', () => {
      const mockStore = {
        getCurrentStreak: jest.fn().mockReturnValue(7),
        isEditMode: true,
      };
      (useDashboardStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(
        <GestureHandlerRootView>
          <StreakCounter widget={defaultWidget} />
        </GestureHandlerRootView>
      );

      const configButton = getByTestId('widget-config-button');
      expect(configButton.props.accessibilityHint).toBe('開啟 Widget 設定');

      const deleteButton = getByTestId('widget-delete-button');
      expect(deleteButton.props.accessibilityHint).toBe('刪除此 Widget');
    });
  });
});
