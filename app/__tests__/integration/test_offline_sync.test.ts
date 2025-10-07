/**
 * Integration Test: Offline Sync Flow (T052)
 * 測試離線同步流程：SQLite 本地儲存 → 網路恢復 → 批次同步
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useOfflineStore } from '@/app/stores/offlineStore';
import { useWorkoutStore } from '@/app/stores/workoutStore';
import * as SQLite from 'expo-sqlite';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@react-native-community/netinfo');
jest.mock('expo-sqlite');

describe('Offline Sync Integration Tests', () => {
  let mockDB: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SQLite database
    mockDB = {
      transaction: jest.fn((callback) => callback({
        executeSql: jest.fn((sql, params, success) => {
          if (success) success(null, { rows: { _array: [] } });
        }),
      })),
      executeSql: jest.fn(),
    };

    (SQLite.openDatabase as jest.Mock).mockReturnValue(mockDB);

    // Mock NetInfo
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
  });

  describe('Local Storage When Offline', () => {
    it('離線時應該將運動記錄儲存到 SQLite', async () => {
      // 設定離線狀態
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const { result } = renderHook(() => useOfflineStore());

      const workoutData = {
        workout_type: 'running',
        start_time: new Date().toISOString(),
        duration_minutes: 30,
        distance_km: 5.0,
      };

      await act(async () => {
        await result.current.saveWorkoutOffline(workoutData);
      });

      // 驗證 SQLite 插入被呼叫
      expect(mockDB.transaction).toHaveBeenCalled();
      
      const transactionCallback = mockDB.transaction.mock.calls[0][0];
      const mockTx = {
        executeSql: jest.fn(),
      };
      
      transactionCallback(mockTx);

      expect(mockTx.executeSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO workouts'),
        expect.arrayContaining([
          'running',
          expect.any(String),
          30,
          5.0,
        ]),
        expect.any(Function)
      );
    });

    it('離線時應該將資料標記為待同步', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
      });

      const { result } = renderHook(() => useOfflineStore());

      const workoutData = {
        workout_type: 'running',
        duration_minutes: 30,
      };

      await act(async () => {
        await result.current.saveWorkoutOffline(workoutData);
      });

      // 驗證待同步佇列
      const pendingSync = result.current.getPendingSyncItems();
      expect(pendingSync.length).toBeGreaterThan(0);
      expect(pendingSync[0].type).toBe('workout');
      expect(pendingSync[0].synced).toBe(false);
    });

    it('離線時應該儲存多筆記錄', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValue({
        isConnected: false,
      });

      const { result } = renderHook(() => useOfflineStore());

      const workouts = [
        { workout_type: 'running', duration_minutes: 30 },
        { workout_type: 'cycling', duration_minutes: 45 },
        { workout_type: 'swimming', duration_minutes: 60 },
      ];

      for (const workout of workouts) {
        await act(async () => {
          await result.current.saveWorkoutOffline(workout);
        });
      }

      const pendingSync = result.current.getPendingSyncItems();
      expect(pendingSync.length).toBe(3);
    });
  });

  describe('Network Recovery Detection', () => {
    it('網路恢復時應該觸發自動同步', async () => {
      const { result } = renderHook(() => useOfflineStore());
      const syncSpy = jest.spyOn(result.current, 'syncPendingData');

      // 模擬網路狀態變化：離線 → 上線
      const listeners: any[] = [];
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        listeners.push(callback);
        return () => {};
      });

      await act(async () => {
        result.current.startNetworkMonitoring();
      });

      // 觸發網路恢復事件
      await act(async () => {
        listeners[0]({
          isConnected: true,
          isInternetReachable: true,
        });
      });

      await waitFor(() => {
        expect(syncSpy).toHaveBeenCalled();
      });
    });

    it('網路不穩定時不應該觸發同步', async () => {
      const { result } = renderHook(() => useOfflineStore());
      const syncSpy = jest.spyOn(result.current, 'syncPendingData');

      const listeners: any[] = [];
      (NetInfo.addEventListener as jest.Mock).mockImplementation((callback) => {
        listeners.push(callback);
        return () => {};
      });

      await act(async () => {
        result.current.startNetworkMonitoring();
      });

      // 網路連接但無法訪問網際網路
      await act(async () => {
        listeners[0]({
          isConnected: true,
          isInternetReachable: false,
        });
      });

      expect(syncSpy).not.toHaveBeenCalled();
    });
  });

  describe('Batch Synchronization', () => {
    it('應該批次上傳所有待同步資料', async () => {
      const { result: offlineResult } = renderHook(() => useOfflineStore());
      const { result: workoutResult } = renderHook(() => useWorkoutStore());

      const mockCreateWorkout = jest.fn().mockResolvedValue({ success: true });
      workoutResult.current.createWorkout = mockCreateWorkout;

      // 建立待同步資料
      const pendingWorkouts = [
        { id: 'local-1', workout_type: 'running', duration_minutes: 30, synced: false },
        { id: 'local-2', workout_type: 'cycling', duration_minutes: 45, synced: false },
        { id: 'local-3', workout_type: 'swimming', duration_minutes: 60, synced: false },
      ];

      // Mock SQLite 查詢
      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            if (sql.includes('SELECT')) {
              success(null, { rows: { _array: pendingWorkouts } });
            }
          },
        });
      });

      await act(async () => {
        await offlineResult.current.syncPendingData();
      });

      // 驗證批次上傳
      expect(mockCreateWorkout).toHaveBeenCalledTimes(3);
      expect(mockCreateWorkout).toHaveBeenCalledWith(expect.objectContaining({
        workout_type: 'running',
      }));
    });

    it('同步成功後應該標記資料為已同步', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const mockCreateWorkout = jest.fn().mockResolvedValue({ 
        success: true,
        workout: { id: 'server-123' }
      });

      // Mock 待同步項目
      const pendingItem = {
        id: 'local-1',
        workout_type: 'running',
        duration_minutes: 30,
        synced: false,
      };

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            if (sql.includes('SELECT')) {
              success(null, { rows: { _array: [pendingItem] } });
            } else if (sql.includes('UPDATE')) {
              success(null, {});
            }
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
      });

      // 驗證更新 synced 標記
      expect(mockDB.transaction).toHaveBeenCalled();
      const calls = mockDB.transaction.mock.calls;
      const updateCall = calls.find((call: any) => {
        const tx = { executeSql: jest.fn() };
        call[0](tx);
        return tx.executeSql.mock.calls.some((c: any) => 
          c[0].includes('UPDATE') && c[0].includes('synced = 1')
        );
      });
      
      expect(updateCall).toBeDefined();
    });

    it('同步失敗應該保留待同步狀態', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const mockCreateWorkout = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

      const pendingItem = {
        id: 'local-1',
        workout_type: 'running',
        duration_minutes: 30,
        synced: false,
      };

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: [pendingItem] } });
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
      });

      // 驗證資料仍標記為待同步
      const pending = result.current.getPendingSyncItems();
      expect(pending.length).toBeGreaterThan(0);
      expect(pending[0].synced).toBe(false);
    });

    it('應該顯示同步進度', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const pendingItems = Array.from({ length: 10 }, (_, i) => ({
        id: `local-${i}`,
        workout_type: 'running',
        duration_minutes: 30,
        synced: false,
      }));

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: pendingItems } });
          },
        });
      });

      await act(async () => {
        result.current.syncPendingData();
      });

      await waitFor(() => {
        const syncProgress = result.current.getSyncProgress();
        expect(syncProgress.total).toBe(10);
        expect(syncProgress.completed).toBeGreaterThan(0);
        expect(syncProgress.percentage).toBeGreaterThan(0);
      });
    });
  });

  describe('Conflict Resolution', () => {
    it('伺服器端資料較新時應該使用伺服器版本', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const localWorkout = {
        id: 'local-1',
        workout_type: 'running',
        duration_minutes: 30,
        updated_at: '2025-01-15T08:00:00Z',
        synced: false,
      };

      const serverWorkout = {
        id: 'server-123',
        workout_type: 'running',
        duration_minutes: 35, // 不同的值
        updated_at: '2025-01-15T09:00:00Z', // 較新
      };

      const mockCreateWorkout = jest.fn().mockResolvedValue({
        success: true,
        workout: serverWorkout,
        conflict: true,
      });

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            if (sql.includes('SELECT')) {
              success(null, { rows: { _array: [localWorkout] } });
            } else if (sql.includes('UPDATE')) {
              success(null, {});
            }
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
      });

      // 驗證使用伺服器版本
      const resolvedData = result.current.getWorkoutById('local-1');
      expect(resolvedData?.duration_minutes).toBe(35);
    });

    it('本地資料較新時應該上傳覆蓋', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const localWorkout = {
        id: 'local-1',
        server_id: 'server-123',
        workout_type: 'running',
        duration_minutes: 35,
        updated_at: '2025-01-15T09:00:00Z', // 較新
        synced: false,
      };

      const mockUpdateWorkout = jest.fn().mockResolvedValue({
        success: true,
      });

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: [localWorkout] } });
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
      });

      // 驗證使用 PUT 更新而非 POST 建立
      expect(mockUpdateWorkout).toHaveBeenCalledWith(
        'server-123',
        expect.objectContaining({
          duration_minutes: 35,
        })
      );
    });

    it('衝突時應該觸發使用者選擇', async () => {
      const { result } = renderHook(() => useOfflineStore());
      const onConflict = jest.fn();

      result.current.setConflictHandler(onConflict);

      const localWorkout = {
        id: 'local-1',
        duration_minutes: 30,
        updated_at: '2025-01-15T08:00:00Z',
      };

      const serverWorkout = {
        id: 'server-123',
        duration_minutes: 35,
        updated_at: '2025-01-15T08:00:00Z', // 相同時間
      };

      const mockCreateWorkout = jest.fn().mockResolvedValue({
        success: true,
        workout: serverWorkout,
        conflict: true,
      });

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: [localWorkout] } });
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
      });

      // 驗證衝突處理器被呼叫
      await waitFor(() => {
        expect(onConflict).toHaveBeenCalledWith({
          local: expect.objectContaining(localWorkout),
          server: expect.objectContaining(serverWorkout),
        });
      });
    });
  });

  describe('Data Integrity', () => {
    it('同步過程中斷應該可以恢復', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const pendingItems = [
        { id: 'local-1', synced: false },
        { id: 'local-2', synced: false },
        { id: 'local-3', synced: false },
      ];

      const mockCreateWorkout = jest.fn()
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Network interruption'))
        .mockResolvedValueOnce({ success: true });

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: pendingItems } });
          },
        });
      });

      // 第一次同步（中斷）
      await act(async () => {
        try {
          await result.current.syncPendingData();
        } catch (error) {
          // 預期錯誤
        }
      });

      // 第二次同步（恢復）
      await act(async () => {
        await result.current.syncPendingData();
      });

      // 驗證未同步的資料會重試
      expect(mockCreateWorkout).toHaveBeenCalledTimes(4); // 1 + 失敗 + 2
    });

    it('應該儲存同步錯誤日誌', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const mockCreateWorkout = jest.fn().mockRejectedValue(
        new Error('Server error 500')
      );

      const pendingItem = {
        id: 'local-1',
        workout_type: 'running',
        synced: false,
      };

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: [pendingItem] } });
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
      });

      const errorLogs = result.current.getSyncErrorLogs();
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].error).toContain('Server error 500');
      expect(errorLogs[0].item_id).toBe('local-1');
    });

    it('同步完成後應該清理已同步資料', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const pendingItem = {
        id: 'local-1',
        workout_type: 'running',
        synced: false,
      };

      const mockCreateWorkout = jest.fn().mockResolvedValue({ success: true });

      let syncedCount = 0;
      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            if (sql.includes('SELECT')) {
              // 第二次查詢應該返回空（已清理）
              const items = syncedCount > 0 ? [] : [pendingItem];
              success(null, { rows: { _array: items } });
            } else if (sql.includes('DELETE')) {
              syncedCount++;
              success(null, {});
            }
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData();
        await result.current.cleanupSyncedData();
      });

      const remaining = result.current.getPendingSyncItems();
      expect(remaining.length).toBe(0);
    });
  });

  describe('Performance Optimization', () => {
    it('大量資料同步應該使用批次請求', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const pendingItems = Array.from({ length: 50 }, (_, i) => ({
        id: `local-${i}`,
        workout_type: 'running',
        synced: false,
      }));

      const mockBatchCreate = jest.fn().mockResolvedValue({ success: true });

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: pendingItems } });
          },
        });
      });

      await act(async () => {
        await result.current.syncPendingData({ batchSize: 10 });
      });

      // 應該分 5 批（50 / 10）
      expect(mockBatchCreate).toHaveBeenCalledTimes(5);
    });

    it('同步效能應該在可接受範圍內', async () => {
      const { result } = renderHook(() => useOfflineStore());

      const pendingItems = Array.from({ length: 100 }, (_, i) => ({
        id: `local-${i}`,
        workout_type: 'running',
        synced: false,
      }));

      mockDB.transaction.mockImplementation((callback) => {
        callback({
          executeSql: (sql: string, params: any[], success: Function) => {
            success(null, { rows: { _array: pendingItems } });
          },
        });
      });

      const startTime = performance.now();
      
      await act(async () => {
        await result.current.syncPendingData();
      });

      const duration = performance.now() - startTime;

      // 100 筆資料應在 5 秒內同步完成
      expect(duration).toBeLessThan(5000);
    });
  });
});
