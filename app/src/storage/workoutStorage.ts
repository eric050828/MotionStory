/**
 * T113: Workout Storage (SQLite CRUD)
 * 本地運動記錄的 CRUD 操作
 */

import database, { LocalWorkout } from './database';
import { Workout, WorkoutFilters } from '../types/workout';

class WorkoutStorage {
  /**
   * Convert server workout to local format
   */
  private toLocal(workout: Workout): LocalWorkout {
    return {
      server_id: workout.id,
      user_id: workout.user_id,
      workout_type: workout.workout_type,
      start_time: workout.start_time,
      duration_minutes: workout.duration_minutes,
      distance_km: workout.distance_km,
      calories: workout.calories,
      avg_heart_rate: workout.avg_heart_rate,
      max_heart_rate: workout.max_heart_rate,
      elevation_gain: workout.elevation_gain,
      notes: workout.notes,
      location_json: workout.location ? JSON.stringify(workout.location) : undefined,
      metadata_json: workout.metadata ? JSON.stringify(workout.metadata) : undefined,
      sync_status: workout.sync_status || 'synced',
      last_synced_at: workout.last_synced_at,
      created_at: workout.created_at,
      updated_at: workout.updated_at,
      is_deleted: workout.is_deleted ? 1 : 0,
    };
  }

  /**
   * Convert local workout to server format
   */
  private toServer(local: LocalWorkout): Workout {
    return {
      id: local.server_id || '',
      user_id: local.user_id,
      workout_type: local.workout_type as any,
      start_time: local.start_time,
      duration_minutes: local.duration_minutes,
      distance_km: local.distance_km,
      calories: local.calories,
      avg_heart_rate: local.avg_heart_rate,
      max_heart_rate: local.max_heart_rate,
      elevation_gain: local.elevation_gain,
      notes: local.notes,
      location: local.location_json ? JSON.parse(local.location_json) : undefined,
      metadata: local.metadata_json ? JSON.parse(local.metadata_json) : undefined,
      sync_status: local.sync_status as any,
      last_synced_at: local.last_synced_at,
      created_at: local.created_at,
      updated_at: local.updated_at,
      is_deleted: local.is_deleted === 1,
      local_id: local.id?.toString(),
    };
  }

  /**
   * Get all workouts with filters
   */
  async getAll(filters?: WorkoutFilters, limit: number = 100): Promise<Workout[]> {
    const db = database.getDB();
    let query = 'SELECT * FROM workouts WHERE is_deleted = 0';
    const params: any[] = [];

    if (filters?.workout_type) {
      query += ' AND workout_type = ?';
      params.push(filters.workout_type);
    }

    if (filters?.start_date) {
      query += ' AND start_time >= ?';
      params.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ' AND start_time <= ?';
      params.push(filters.end_date);
    }

    if (filters?.sync_status) {
      query += ' AND sync_status = ?';
      params.push(filters.sync_status);
    }

    query += ' ORDER BY start_time DESC LIMIT ?';
    params.push(limit);

    const results = await db.getAllAsync<LocalWorkout>(query, params);
    return results.map((r) => this.toServer(r));
  }

  /**
   * Get workout by ID
   */
  async getById(id: number): Promise<Workout | null> {
    const db = database.getDB();
    const result = await db.getFirstAsync<LocalWorkout>(
      'SELECT * FROM workouts WHERE id = ? AND is_deleted = 0',
      [id]
    );

    return result ? this.toServer(result) : null;
  }

  /**
   * Get workout by server ID
   */
  async getByServerId(serverId: string): Promise<Workout | null> {
    const db = database.getDB();
    const result = await db.getFirstAsync<LocalWorkout>(
      'SELECT * FROM workouts WHERE server_id = ? AND is_deleted = 0',
      [serverId]
    );

    return result ? this.toServer(result) : null;
  }

  /**
   * Create new workout
   */
  async create(workout: Workout): Promise<number> {
    const db = database.getDB();
    const local = this.toLocal(workout);

    const result = await db.runAsync(
      `INSERT INTO workouts (
        server_id, user_id, workout_type, start_time, duration_minutes,
        distance_km, calories, avg_heart_rate, max_heart_rate, elevation_gain,
        notes, location_json, metadata_json, sync_status, last_synced_at,
        created_at, updated_at, is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        local.server_id,
        local.user_id,
        local.workout_type,
        local.start_time,
        local.duration_minutes,
        local.distance_km,
        local.calories,
        local.avg_heart_rate,
        local.max_heart_rate,
        local.elevation_gain,
        local.notes,
        local.location_json,
        local.metadata_json,
        local.sync_status,
        local.last_synced_at,
        local.created_at,
        local.updated_at,
        local.is_deleted,
      ]
    );

    return result.lastInsertRowId;
  }

  /**
   * Update workout
   */
  async update(id: number, workout: Partial<Workout>): Promise<void> {
    const db = database.getDB();
    const existing = await this.getById(id);
    if (!existing) throw new Error('Workout not found');

    const updated = { ...existing, ...workout, updated_at: new Date().toISOString() };
    const local = this.toLocal(updated);

    await db.runAsync(
      `UPDATE workouts SET
        workout_type = ?, start_time = ?, duration_minutes = ?,
        distance_km = ?, calories = ?, avg_heart_rate = ?, max_heart_rate = ?,
        elevation_gain = ?, notes = ?, location_json = ?, metadata_json = ?,
        sync_status = ?, updated_at = ?
      WHERE id = ?`,
      [
        local.workout_type,
        local.start_time,
        local.duration_minutes,
        local.distance_km,
        local.calories,
        local.avg_heart_rate,
        local.max_heart_rate,
        local.elevation_gain,
        local.notes,
        local.location_json,
        local.metadata_json,
        local.sync_status,
        local.updated_at,
        id,
      ]
    );
  }

  /**
   * Soft delete workout
   */
  async delete(id: number): Promise<void> {
    const db = database.getDB();
    await db.runAsync(
      'UPDATE workouts SET is_deleted = 1, updated_at = ?, sync_status = ? WHERE id = ?',
      [new Date().toISOString(), 'pending', id]
    );
  }

  /**
   * Get pending sync workouts
   */
  async getPendingSync(): Promise<Workout[]> {
    const db = database.getDB();
    const results = await db.getAllAsync<LocalWorkout>(
      'SELECT * FROM workouts WHERE sync_status = ? ORDER BY created_at ASC',
      ['pending']
    );

    return results.map((r) => this.toServer(r));
  }

  /**
   * Mark workout as synced
   */
  async markSynced(localId: number, serverId: string): Promise<void> {
    const db = database.getDB();
    await db.runAsync(
      `UPDATE workouts SET
        server_id = ?,
        sync_status = ?,
        last_synced_at = ?
      WHERE id = ?`,
      [serverId, 'synced', new Date().toISOString(), localId]
    );
  }

  /**
   * Get workout statistics
   */
  async getStats(startDate?: string, endDate?: string): Promise<{
    total_count: number;
    total_distance_km: number;
    total_duration_minutes: number;
    total_calories: number;
  }> {
    const db = database.getDB();
    let query = `
      SELECT
        COUNT(*) as total_count,
        COALESCE(SUM(distance_km), 0) as total_distance_km,
        COALESCE(SUM(duration_minutes), 0) as total_duration_minutes,
        COALESCE(SUM(calories), 0) as total_calories
      FROM workouts
      WHERE is_deleted = 0
    `;

    const params: any[] = [];

    if (startDate) {
      query += ' AND start_time >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND start_time <= ?';
      params.push(endDate);
    }

    const result = await db.getFirstAsync<{
      total_count: number;
      total_distance_km: number;
      total_duration_minutes: number;
      total_calories: number;
    }>(query, params);

    return (
      result || {
        total_count: 0,
        total_distance_km: 0,
        total_duration_minutes: 0,
        total_calories: 0,
      }
    );
  }
}

export default new WorkoutStorage();
