/**
 * T112: SQLite Database Setup
 * 本地 SQLite 資料庫初始化與管理
 */

import * as SQLite from 'expo-sqlite';

export interface LocalWorkout {
  id?: number; // Local SQLite ID
  server_id?: string; // Server MongoDB ID
  user_id: string;
  workout_type: string;
  start_time: string;
  duration_minutes: number;
  distance_km?: number;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  elevation_gain?: number;
  notes?: string;
  location_json?: string; // JSON string of location
  metadata_json?: string; // JSON string of metadata
  sync_status: 'pending' | 'synced' | 'failed' | 'conflict';
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: number; // SQLite boolean (0 or 1)
}

export interface LocalAchievement {
  id?: number;
  server_id?: string;
  user_id: string;
  achievement_type: string;
  achieved_at: string;
  celebration_level: string;
  metadata_json?: string;
  shared: number; // SQLite boolean
  share_card_id?: string;
  created_at: string;
  synced: number; // SQLite boolean
}

export interface LocalDashboard {
  id?: number;
  server_id?: string;
  user_id: string;
  name: string;
  is_default: number; // SQLite boolean
  order_index: number;
  widgets_json: string; // JSON string of widgets array
  grid_columns: number;
  created_at: string;
  updated_at: string;
  synced: number; // SQLite boolean
}

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  /**
   * Open database connection
   */
  async open(): Promise<void> {
    if (this.db) return;

    this.db = await SQLite.openDatabaseAsync('motionstory.db');
    await this.createTables();
  }

  /**
   * Create all tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Workouts table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        workout_type TEXT NOT NULL,
        start_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        distance_km REAL,
        calories INTEGER,
        avg_heart_rate INTEGER,
        max_heart_rate INTEGER,
        elevation_gain REAL,
        notes TEXT,
        location_json TEXT,
        metadata_json TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        last_synced_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_deleted INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
      CREATE INDEX IF NOT EXISTS idx_workouts_sync_status ON workouts(sync_status);
      CREATE INDEX IF NOT EXISTS idx_workouts_start_time ON workouts(start_time DESC);
    `);

    // Achievements table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        achieved_at TEXT NOT NULL,
        celebration_level TEXT NOT NULL,
        metadata_json TEXT,
        shared INTEGER NOT NULL DEFAULT 0,
        share_card_id TEXT,
        created_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
    `);

    // Dashboards table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS dashboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id TEXT UNIQUE,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        order_index INTEGER NOT NULL,
        widgets_json TEXT NOT NULL,
        grid_columns INTEGER NOT NULL DEFAULT 4,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
    `);

    // Sync queue table (for tracking sync operations)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        operation TEXT NOT NULL,
        data_json TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_attempt_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
    `);

    // User settings table (for caching user data)
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    console.log('✅ SQLite tables created successfully');
  }

  /**
   * Get database instance
   */
  getDB(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized. Call open() first.');
    return this.db;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }

  /**
   * Clear all data (for logout/reset)
   */
  async clearAll(): Promise<void> {
    if (!this.db) return;

    await this.db.execAsync(`
      DELETE FROM workouts;
      DELETE FROM achievements;
      DELETE FROM dashboards;
      DELETE FROM sync_queue;
      DELETE FROM user_settings;
    `);

    console.log('✅ All local data cleared');
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    workouts_count: number;
    achievements_count: number;
    dashboards_count: number;
    pending_sync_count: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const workoutsCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workouts WHERE is_deleted = 0'
    );

    const achievementsCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM achievements'
    );

    const dashboardsCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM dashboards'
    );

    const pendingSyncCount = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM workouts WHERE sync_status = "pending"'
    );

    return {
      workouts_count: workoutsCount?.count || 0,
      achievements_count: achievementsCount?.count || 0,
      dashboards_count: dashboardsCount?.count || 0,
      pending_sync_count: pendingSyncCount?.count || 0,
    };
  }
}

export default new Database();
