/**
 * T114: Sync Manager
 * 管理本地與伺服器之間的資料同步
 */

import NetInfo from '@react-native-community/netinfo';
import database from './database';
import workoutStorage from './workoutStorage';
import { workoutService } from '../services';

interface SyncQueueItem {
  id?: number;
  entity_type: 'workout' | 'achievement' | 'dashboard';
  entity_id: number;
  operation: 'create' | 'update' | 'delete';
  data_json: string;
  retry_count: number;
  created_at: string;
  last_attempt_at?: string;
}

class SyncManager {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly MAX_RETRY = 3;
  private readonly SYNC_INTERVAL_MS = 30000; // 30 seconds

  /**
   * Start automatic sync (when online)
   */
  async startAutoSync(): Promise<void> {
    // Listen to network state changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected && !this.isSyncing) {
        this.syncAll().catch(console.error);
      }
    });

    // Start periodic sync
    this.syncInterval = setInterval(async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected && !this.isSyncing) {
        this.syncAll().catch(console.error);
      }
    }, this.SYNC_INTERVAL_MS);

    // Initial sync
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      await this.syncAll();
    }
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected || false;
  }

  /**
   * Sync all pending changes
   */
  async syncAll(): Promise<{
    success: number;
    failed: number;
    conflicts: number;
  }> {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: 0, failed: 0, conflicts: 0 };
    }

    if (!(await this.isOnline())) {
      console.log('📴 Device offline, skipping sync');
      return { success: 0, failed: 0, conflicts: 0 };
    }

    this.isSyncing = true;
    console.log('🔄 Starting sync...');

    let success = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      // 1. Push local changes to server
      const pushResult = await this.pushLocalChanges();
      success += pushResult.success;
      failed += pushResult.failed;
      conflicts += pushResult.conflicts;

      // 2. Pull server changes to local
      const pullResult = await this.pullServerChanges();
      success += pullResult.success;
      failed += pullResult.failed;

      console.log(`✅ Sync complete: ${success} success, ${failed} failed, ${conflicts} conflicts`);
    } catch (error) {
      console.error('❌ Sync error:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success, failed, conflicts };
  }

  /**
   * Push local changes to server
   */
  private async pushLocalChanges(): Promise<{
    success: number;
    failed: number;
    conflicts: number;
  }> {
    let success = 0;
    let failed = 0;
    let conflicts = 0;

    // Get pending workouts
    const pendingWorkouts = await workoutStorage.getPendingSync();

    for (const workout of pendingWorkouts) {
      try {
        if (!workout.local_id) {
          failed++;
          continue;
        }

        const localId = parseInt(workout.local_id);

        // Check if it's a new workout or update
        if (workout.id && workout.id !== '') {
          // Update existing workout
          await workoutService.updateWorkout(workout.id, workout);
          await workoutStorage.markSynced(localId, workout.id);
        } else {
          // Create new workout
          const created = await workoutService.createWorkout(workout);
          await workoutStorage.markSynced(localId, created.id);
        }

        success++;
      } catch (error: any) {
        console.error('Failed to sync workout:', error);

        // Check for conflict (409)
        if (error.response?.status === 409) {
          conflicts++;
          await this.handleConflict('workout', workout);
        } else {
          failed++;
          await this.addToSyncQueue('workout', parseInt(workout.local_id!), 'update', workout);
        }
      }
    }

    return { success, failed, conflicts };
  }

  /**
   * Pull server changes to local
   */
  private async pullServerChanges(): Promise<{
    success: number;
    failed: number;
  }> {
    let success = 0;
    let failed = 0;

    try {
      // Get last sync cursor from local storage
      const db = database.getDB();
      const lastSync = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM user_settings WHERE key = ?',
        ['last_sync_cursor']
      );

      const cursor = lastSync?.value;

      // Fetch workouts from server
      const response = await workoutService.getWorkouts({}, cursor, 100);

      for (const serverWorkout of response.workouts) {
        try {
          // Check if workout exists locally
          const existingWorkout = await workoutStorage.getByServerId(serverWorkout.id);

          if (existingWorkout) {
            // Update if server version is newer
            const serverUpdated = new Date(serverWorkout.updated_at);
            const localUpdated = new Date(existingWorkout.updated_at);

            if (serverUpdated > localUpdated) {
              await workoutStorage.update(parseInt(existingWorkout.local_id!), serverWorkout);
              success++;
            }
          } else {
            // Create new local workout
            await workoutStorage.create(serverWorkout);
            success++;
          }
        } catch (error) {
          console.error('Failed to save server workout:', error);
          failed++;
        }
      }

      // Save new cursor
      if (response.cursor) {
        await db.runAsync(
          `INSERT OR REPLACE INTO user_settings (key, value, updated_at) VALUES (?, ?, ?)`,
          ['last_sync_cursor', response.cursor, new Date().toISOString()]
        );
      }
    } catch (error) {
      console.error('Failed to pull server changes:', error);
      failed++;
    }

    return { success, failed };
  }

  /**
   * Handle sync conflict
   */
  private async handleConflict(
    entityType: 'workout' | 'achievement' | 'dashboard',
    localData: any
  ): Promise<void> {
    // For now, server wins in conflicts
    // TODO: Implement conflict resolution UI
    console.warn(`⚠️ Conflict detected for ${entityType}, server version kept`);

    if (entityType === 'workout' && localData.local_id) {
      const db = database.getDB();
      await db.runAsync('UPDATE workouts SET sync_status = ? WHERE id = ?', [
        'conflict',
        parseInt(localData.local_id),
      ]);
    }
  }

  /**
   * Add item to sync queue
   */
  private async addToSyncQueue(
    entityType: 'workout' | 'achievement' | 'dashboard',
    entityId: number,
    operation: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    const db = database.getDB();

    await db.runAsync(
      `INSERT INTO sync_queue (entity_type, entity_id, operation, data_json, retry_count, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [entityType, entityId, operation, JSON.stringify(data), new Date().toISOString()]
    );
  }

  /**
   * Retry failed sync queue items
   */
  async retryFailedSync(): Promise<void> {
    const db = database.getDB();
    const failedItems = await db.getAllAsync<SyncQueueItem>(
      `SELECT * FROM sync_queue WHERE retry_count < ? ORDER BY created_at ASC`,
      [this.MAX_RETRY]
    );

    for (const item of failedItems) {
      try {
        const data = JSON.parse(item.data_json);

        if (item.entity_type === 'workout') {
          if (item.operation === 'create') {
            const created = await workoutService.createWorkout(data);
            await workoutStorage.markSynced(item.entity_id, created.id);
          } else if (item.operation === 'update') {
            await workoutService.updateWorkout(data.id, data);
            await workoutStorage.markSynced(item.entity_id, data.id);
          } else if (item.operation === 'delete') {
            await workoutService.deleteWorkout(data.id);
          }
        }

        // Remove from queue on success
        await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [item.id]);
      } catch (error) {
        console.error('Retry failed for sync queue item:', error);

        // Increment retry count
        await db.runAsync(
          'UPDATE sync_queue SET retry_count = retry_count + 1, last_attempt_at = ? WHERE id = ?',
          [new Date().toISOString(), item.id]
        );
      }
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    is_syncing: boolean;
    pending_count: number;
    failed_count: number;
    last_sync_at?: string;
  }> {
    const db = database.getDB();

    const pendingCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workouts WHERE sync_status = ?',
      ['pending']
    );

    const failedCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue WHERE retry_count >= ?',
      [this.MAX_RETRY]
    );

    const lastSync = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['last_sync_at']
    );

    return {
      is_syncing: this.isSyncing,
      pending_count: pendingCount?.count || 0,
      failed_count: failedCount?.count || 0,
      last_sync_at: lastSync?.value,
    };
  }

  /**
   * Force full sync
   */
  async forceFullSync(): Promise<void> {
    const db = database.getDB();

    // Clear last sync cursor to force full sync
    await db.runAsync('DELETE FROM user_settings WHERE key = ?', ['last_sync_cursor']);

    // Sync all
    await this.syncAll();
  }
}

export default new SyncManager();
