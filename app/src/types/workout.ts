/**
 * T102: Workout Types
 * 運動記錄相關的 TypeScript 類型定義
 */

export type WorkoutType =
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'walking'
  | 'hiking'
  | 'yoga'
  | 'strength_training'
  | 'other';

export type SyncStatus = 'pending' | 'synced' | 'failed' | 'conflict';

export interface WorkoutLocation {
  latitude: number;
  longitude: number;
  place_name?: string;
}

export interface WorkoutWeather {
  temperature: number; // 攝氏度
  condition: string; // 天氣狀況描述
  humidity?: number; // 濕度百分比
}

export interface WorkoutMetadata {
  imported_from?: string; // 'strava', 'garmin', 'apple_health'
  import_id?: string;
  weather?: WorkoutWeather;
}

export interface Workout {
  id: string;
  user_id: string;
  workout_type: WorkoutType;
  start_time: string;
  duration_minutes: number;
  distance_km?: number;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  elevation_gain?: number;
  notes?: string;
  location?: WorkoutLocation;
  metadata?: WorkoutMetadata;
  sync_status: SyncStatus;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  local_id?: string; // SQLite 本地 ID
}

export interface CreateWorkoutRequest {
  workout_type: WorkoutType;
  start_time: string;
  duration_minutes: number;
  distance_km?: number;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  elevation_gain?: number;
  notes?: string;
  location?: WorkoutLocation;
  metadata?: WorkoutMetadata;
}

export interface UpdateWorkoutRequest extends Partial<CreateWorkoutRequest> {
  sync_status?: SyncStatus;
}

export interface WorkoutSyncBatch {
  workouts: Workout[];
  last_sync_cursor?: string;
}

export interface WorkoutStats {
  total_count: number;
  total_distance_km: number;
  total_duration_minutes: number;
  total_calories: number;
  avg_duration_minutes: number;
  avg_distance_km: number;
}

export interface WorkoutFilters {
  workout_type?: WorkoutType;
  start_date?: string;
  end_date?: string;
  min_distance?: number;
  max_distance?: number;
  sync_status?: SyncStatus;
}
