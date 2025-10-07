/**
 * T119: Workout Store
 * 運動記錄、同步狀態管理
 */

import { create } from 'zustand';
import { Workout, WorkoutFilters, WorkoutStats } from '../types/workout';
import workoutService from '../services/workoutService';
import workoutStorage from '../storage/workoutStorage';
import syncManager from '../storage/syncManager';
import networkMonitor from '../sync/networkMonitor';

interface WorkoutState {
  // Data
  workouts: Workout[];
  currentWorkout: Workout | null;
  stats: WorkoutStats | null;

  // UI State
  loading: boolean;
  error: string | null;
  filters: WorkoutFilters;

  // Sync State
  syncStatus: {
    is_syncing: boolean;
    pending_count: number;
    failed_count: number;
    last_sync_at?: string;
  };

  // Actions
  fetchWorkouts: (filters?: WorkoutFilters) => Promise<void>;
  fetchWorkout: (id: string) => Promise<void>;
  createWorkout: (data: Partial<Workout>) => Promise<Workout>;
  updateWorkout: (id: string, data: Partial<Workout>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  fetchStats: (startDate?: string, endDate?: string) => Promise<void>;
  setFilters: (filters: WorkoutFilters) => void;
  clearFilters: () => void;
  syncWorkouts: () => Promise<void>;
  getSyncStatus: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial State
  workouts: [],
  currentWorkout: null,
  stats: null,
  loading: false,
  error: null,
  filters: {},
  syncStatus: {
    is_syncing: false,
    pending_count: 0,
    failed_count: 0,
  },

  // Fetch Workouts
  fetchWorkouts: async (filters?: WorkoutFilters) => {
    set({ loading: true, error: null });

    try {
      // Try to fetch from server if online
      if (networkMonitor.isOnline()) {
        const response = await workoutService.getWorkouts(filters || get().filters);
        set({ workouts: response.workouts, loading: false });
      } else {
        // Fallback to local storage
        const localWorkouts = await workoutStorage.getAll(filters || get().filters);
        set({ workouts: localWorkouts, loading: false });
      }
    } catch (error: any) {
      // Fallback to local storage on error
      try {
        const localWorkouts = await workoutStorage.getAll(filters || get().filters);
        set({ workouts: localWorkouts, loading: false, error: null });
      } catch (localError: any) {
        set({ error: error.message || 'Failed to fetch workouts', loading: false });
      }
    }
  },

  // Fetch Single Workout
  fetchWorkout: async (id: string) => {
    set({ loading: true, error: null });

    try {
      if (networkMonitor.isOnline()) {
        const workout = await workoutService.getWorkout(id);
        set({ currentWorkout: workout, loading: false });
      } else {
        const localWorkout = await workoutStorage.getByServerId(id);
        set({ currentWorkout: localWorkout, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch workout', loading: false });
    }
  },

  // Create Workout
  createWorkout: async (data: Partial<Workout>) => {
    set({ loading: true, error: null });

    try {
      const newWorkout: Workout = {
        id: '',
        user_id: '',
        workout_type: data.workout_type!,
        start_time: data.start_time || new Date().toISOString(),
        duration_minutes: data.duration_minutes || 0,
        distance_km: data.distance_km,
        calories: data.calories,
        avg_heart_rate: data.avg_heart_rate,
        max_heart_rate: data.max_heart_rate,
        elevation_gain: data.elevation_gain,
        notes: data.notes,
        location: data.location,
        metadata: data.metadata,
        sync_status: networkMonitor.isOnline() ? 'synced' : 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false,
      };

      if (networkMonitor.isOnline()) {
        // Create on server
        const created = await workoutService.createWorkout(newWorkout);

        // Save to local storage
        await workoutStorage.create(created);

        set((state) => ({
          workouts: [created, ...state.workouts],
          loading: false,
        }));

        return created;
      } else {
        // Save to local storage only
        const localId = await workoutStorage.create(newWorkout);
        const created = { ...newWorkout, local_id: localId.toString() };

        set((state) => ({
          workouts: [created, ...state.workouts],
          loading: false,
        }));

        return created;
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to create workout', loading: false });
      throw error;
    }
  },

  // Update Workout
  updateWorkout: async (id: string, data: Partial<Workout>) => {
    set({ loading: true, error: null });

    try {
      if (networkMonitor.isOnline()) {
        const updated = await workoutService.updateWorkout(id, data);

        // Update local storage
        const localWorkout = await workoutStorage.getByServerId(id);
        if (localWorkout?.local_id) {
          await workoutStorage.update(parseInt(localWorkout.local_id), updated);
        }

        set((state) => ({
          workouts: state.workouts.map((w) => (w.id === id ? updated : w)),
          currentWorkout: state.currentWorkout?.id === id ? updated : state.currentWorkout,
          loading: false,
        }));
      } else {
        // Update local storage only
        const localWorkout = await workoutStorage.getByServerId(id);
        if (localWorkout?.local_id) {
          await workoutStorage.update(parseInt(localWorkout.local_id), data);

          const updated = { ...localWorkout, ...data, sync_status: 'pending' as const };

          set((state) => ({
            workouts: state.workouts.map((w) => (w.id === id ? updated : w)),
            currentWorkout: state.currentWorkout?.id === id ? updated : state.currentWorkout,
            loading: false,
          }));
        }
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to update workout', loading: false });
    }
  },

  // Delete Workout
  deleteWorkout: async (id: string) => {
    set({ loading: true, error: null });

    try {
      if (networkMonitor.isOnline()) {
        await workoutService.deleteWorkout(id);
      }

      // Soft delete in local storage
      const localWorkout = await workoutStorage.getByServerId(id);
      if (localWorkout?.local_id) {
        await workoutStorage.delete(parseInt(localWorkout.local_id));
      }

      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== id),
        currentWorkout: state.currentWorkout?.id === id ? null : state.currentWorkout,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete workout', loading: false });
    }
  },

  // Fetch Stats
  fetchStats: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null });

    try {
      if (networkMonitor.isOnline()) {
        const stats = await workoutService.getWorkoutStats(startDate, endDate);
        set({ stats, loading: false });
      } else {
        const localStats = await workoutStorage.getStats(startDate, endDate);
        const stats: WorkoutStats = {
          ...localStats,
          avg_duration_minutes: localStats.total_count > 0
            ? localStats.total_duration_minutes / localStats.total_count
            : 0,
          avg_distance_km: localStats.total_count > 0
            ? localStats.total_distance_km / localStats.total_count
            : 0,
        };
        set({ stats, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch stats', loading: false });
    }
  },

  // Set Filters
  setFilters: (filters: WorkoutFilters) => {
    set({ filters });
    get().fetchWorkouts(filters);
  },

  // Clear Filters
  clearFilters: () => {
    set({ filters: {} });
    get().fetchWorkouts({});
  },

  // Sync Workouts
  syncWorkouts: async () => {
    try {
      await syncManager.syncAll();
      await get().getSyncStatus();
      await get().fetchWorkouts(); // Refresh workouts after sync
    } catch (error: any) {
      set({ error: error.message || 'Sync failed' });
    }
  },

  // Get Sync Status
  getSyncStatus: async () => {
    try {
      const syncStatus = await syncManager.getSyncStatus();
      set({ syncStatus });
    } catch (error) {
      console.error('Failed to get sync status:', error);
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),

  // Reset Store
  reset: () =>
    set({
      workouts: [],
      currentWorkout: null,
      stats: null,
      loading: false,
      error: null,
      filters: {},
      syncStatus: {
        is_syncing: false,
        pending_count: 0,
        failed_count: 0,
      },
    }),
}));

export default useWorkoutStore;
