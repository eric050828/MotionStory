/**
 * Timeline View Component Tests (T049)
 * 測試虛擬滾動、里程碑高亮、無限載入
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TimelineScreen from '@/app/screens/TimelineScreen';
import { useTimelineStore } from '@/app/stores/timelineStore';

// Mock Zustand store
jest.mock('@/app/stores/timelineStore');

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @shopify/flash-list
jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: React.forwardRef((props: any, ref: any) => {
      return React.createElement(FlatList, { ...props, ref, testID: 'timeline-list' });
    }),
  };
});

describe('TimelineScreen Component Tests', () => {
  const mockTimelineData = [
    {
      id: 'item-001',
      type: 'workout',
      date: '2025-01-15T08:30:00Z',
      data: {
        workout_type: 'running',
        duration_minutes: 30,
        distance_km: 5.0,
      },
    },
    {
      id: 'item-002',
      type: 'milestone',
      date: '2025-01-15T08:30:00Z',
      data: {
        milestone_type: 'first_5k',
        title: '首次 5K 達成！',
      },
    },
    {
      id: 'item-003',
      type: 'achievement',
      date: '2025-01-14T09:00:00Z',
      data: {
        achievement_type: 'streak_3',
        title: '連續 3 天運動',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Timeline Rendering', () => {
    it('應該顯示時間軸標題', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(<TimelineScreen />);

      expect(getByText('運動時間軸')).toBeTruthy();
    });

    it('應該渲染所有時間軸項目', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      expect(list.props.data).toHaveLength(3);
    });

    it('空時間軸應該顯示空狀態訊息', () => {
      const mockStore = {
        timelineItems: [],
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(<TimelineScreen />);

      expect(getByText('還沒有運動記錄')).toBeTruthy();
      expect(getByText('開始你的第一次運動吧！')).toBeTruthy();
    });

    it('載入中應該顯示骨架屏', () => {
      const mockStore = {
        timelineItems: [],
        isLoading: true,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getAllByTestId } = render(<TimelineScreen />);

      const skeletons = getAllByTestId('timeline-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Virtual Scrolling Performance', () => {
    it('應該使用 FlashList 實現虛擬滾動', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      expect(list).toBeTruthy();
    });

    it('應該設定正確的 estimatedItemSize', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      expect(list.props.estimatedItemSize).toBe(120); // 預估項目高度
    });

    it('應該使用 getItemType 優化渲染', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      expect(list.props.getItemType).toBeDefined();

      // 驗證不同類型返回不同值
      const item1Type = list.props.getItemType(mockTimelineData[0]);
      const item2Type = list.props.getItemType(mockTimelineData[1]);
      expect(item1Type).not.toBe(item2Type);
    });

    it('大量資料載入時性能應該穩定', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        type: 'workout',
        date: new Date().toISOString(),
        data: {},
      }));

      const mockStore = {
        timelineItems: largeDataset,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const startTime = performance.now();
      const { getByTestId } = render(<TimelineScreen />);
      const endTime = performance.now();

      // 渲染時間應該在合理範圍內 (< 500ms)
      expect(endTime - startTime).toBeLessThan(500);

      const list = getByTestId('timeline-list');
      expect(list.props.data).toHaveLength(1000);
    });
  });

  describe('Milestone Highlighting', () => {
    it('里程碑項目應該有特殊高亮樣式', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const milestoneItem = getByTestId('timeline-item-item-002');
      expect(milestoneItem.props.style).toEqual(
        expect.objectContaining({
          backgroundColor: expect.stringContaining('#FFD700'), // 金色高亮
        })
      );
    });

    it('里程碑應該顯示特殊圖示', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const milestoneIcon = getByTestId('milestone-icon-item-002');
      expect(milestoneIcon).toBeTruthy();
      expect(milestoneIcon.props.name).toBe('trophy'); // 獎盃圖示
    });

    it('點擊里程碑應該顯示詳細資訊', async () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, queryByTestId } = render(<TimelineScreen />);

      const milestoneItem = getByTestId('timeline-item-item-002');
      fireEvent.press(milestoneItem);

      await waitFor(() => {
        const detailModal = queryByTestId('milestone-detail-modal');
        expect(detailModal).toBeTruthy();
      });
    });

    it('應該自動捲動到最近的里程碑', async () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      const scrollToIndexSpy = jest.spyOn(list, 'scrollToIndex');

      // 觸發捲動到里程碑
      fireEvent.press(getByTestId('scroll-to-milestone-button'));

      await waitFor(() => {
        expect(scrollToIndexSpy).toHaveBeenCalledWith({
          index: 1, // item-002 的位置
          animated: true,
        });
      });
    });
  });

  describe('Infinite Scrolling', () => {
    it('捲動到底部應該載入更多資料', async () => {
      const mockLoadMore = jest.fn();
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        hasMore: true,
        loadMore: mockLoadMore,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');

      // 模擬捲動到底部
      fireEvent.scroll(list, {
        nativeEvent: {
          contentOffset: { y: 1000 },
          contentSize: { height: 1200 },
          layoutMeasurement: { height: 800 },
        },
      });

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalled();
      });
    });

    it('載入更多時應該顯示載入指示器', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        hasMore: true,
        isLoadingMore: true,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const loadingIndicator = getByTestId('loading-more-indicator');
      expect(loadingIndicator).toBeTruthy();
    });

    it('沒有更多資料時應該顯示結束訊息', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        hasMore: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(<TimelineScreen />);

      expect(getByText('已顯示所有記錄')).toBeTruthy();
    });

    it('載入失敗應該顯示重試按鈕', async () => {
      const mockLoadMore = jest.fn();
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        hasMore: true,
        loadMoreError: '載入失敗',
        loadMore: mockLoadMore,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(<TimelineScreen />);

      const retryButton = getByText('重試');
      expect(retryButton).toBeTruthy();

      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockLoadMore).toHaveBeenCalled();
      });
    });
  });

  describe('Date Grouping', () => {
    it('應該按日期分組顯示', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getAllByTestId } = render(<TimelineScreen />);

      const dateSeparators = getAllByTestId(/date-separator/);
      expect(dateSeparators.length).toBeGreaterThan(0);
    });

    it('同一天的項目應該在同一個群組', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      // 2025-01-15 有兩個項目
      const group20250115 = getByTestId('date-group-2025-01-15');
      expect(group20250115).toBeTruthy();
    });

    it('應該顯示相對時間 (今天、昨天)', () => {
      const today = new Date().toISOString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const mockStore = {
        timelineItems: [
          { ...mockTimelineData[0], date: today },
          { ...mockTimelineData[1], date: yesterday },
        ],
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByText } = render(<TimelineScreen />);

      expect(getByText('今天')).toBeTruthy();
      expect(getByText('昨天')).toBeTruthy();
    });
  });

  describe('Filter and Search', () => {
    it('應該顯示篩選按鈕', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const filterButton = getByTestId('filter-button');
      expect(filterButton).toBeTruthy();
    });

    it('點擊篩選按鈕應該開啟篩選面板', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, queryByTestId } = render(<TimelineScreen />);

      const filterButton = getByTestId('filter-button');
      fireEvent.press(filterButton);

      const filterPanel = queryByTestId('filter-panel');
      expect(filterPanel).toBeTruthy();
    });

    it('應該可以按運動類型篩選', async () => {
      const mockFilter = jest.fn();
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        applyFilter: mockFilter,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, getByText } = render(<TimelineScreen />);

      fireEvent.press(getByTestId('filter-button'));
      fireEvent.press(getByText('跑步'));

      await waitFor(() => {
        expect(mockFilter).toHaveBeenCalledWith({
          workout_type: 'running',
        });
      });
    });

    it('應該可以按時間範圍篩選', async () => {
      const mockFilter = jest.fn();
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        applyFilter: mockFilter,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, getByText } = render(<TimelineScreen />);

      fireEvent.press(getByTestId('filter-button'));
      fireEvent.press(getByText('最近 7 天'));

      await waitFor(() => {
        expect(mockFilter).toHaveBeenCalledWith({
          date_range: 'last_7_days',
        });
      });
    });

    it('應該顯示已套用的篩選條件', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        activeFilters: {
          workout_type: 'running',
          date_range: 'last_7_days',
        },
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const filterBadge = getByTestId('filter-badge');
      expect(filterBadge.props.children).toBe('2'); // 2 個篩選條件
    });
  });

  describe('Pull to Refresh', () => {
    it('下拉應該觸發重新整理', async () => {
      const mockRefresh = jest.fn();
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        refresh: mockRefresh,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      
      fireEvent(list, 'onRefresh');

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('重新整理時應該顯示載入指示器', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
        isRefreshing: true,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      expect(list.props.refreshing).toBe(true);
    });
  });

  describe('Item Interactions', () => {
    it('點擊運動項目應該顯示詳細資訊', async () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, queryByTestId } = render(<TimelineScreen />);

      const workoutItem = getByTestId('timeline-item-item-001');
      fireEvent.press(workoutItem);

      await waitFor(() => {
        const detailModal = queryByTestId('workout-detail-modal');
        expect(detailModal).toBeTruthy();
      });
    });

    it('長按項目應該顯示操作選單', async () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, queryByTestId } = render(<TimelineScreen />);

      const workoutItem = getByTestId('timeline-item-item-001');
      fireEvent(workoutItem, 'onLongPress');

      await waitFor(() => {
        const actionMenu = queryByTestId('item-action-menu');
        expect(actionMenu).toBeTruthy();
      });
    });

    it('操作選單應該包含編輯和刪除選項', async () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId, getByText } = render(<TimelineScreen />);

      const workoutItem = getByTestId('timeline-item-item-001');
      fireEvent(workoutItem, 'onLongPress');

      await waitFor(() => {
        expect(getByText('編輯')).toBeTruthy();
        expect(getByText('刪除')).toBeTruthy();
        expect(getByText('分享')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('時間軸列表應該有正確的 accessibility label', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const list = getByTestId('timeline-list');
      expect(list.props.accessibilityLabel).toBe('運動時間軸列表');
    });

    it('每個項目應該有描述性的 accessibility label', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const workoutItem = getByTestId('timeline-item-item-001');
      expect(workoutItem.props.accessibilityLabel).toContain('跑步');
      expect(workoutItem.props.accessibilityLabel).toContain('30 分鐘');
      expect(workoutItem.props.accessibilityLabel).toContain('5.0 公里');
    });

    it('里程碑應該有特殊的 accessibility 提示', () => {
      const mockStore = {
        timelineItems: mockTimelineData,
        isLoading: false,
      };
      (useTimelineStore as jest.Mock).mockReturnValue(mockStore);

      const { getByTestId } = render(<TimelineScreen />);

      const milestoneItem = getByTestId('timeline-item-item-002');
      expect(milestoneItem.props.accessibilityHint).toBe('雙擊查看里程碑詳情');
      expect(milestoneItem.props.accessibilityRole).toBe('button');
    });
  });
});
