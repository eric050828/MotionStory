/**
 * T108: Workout API Service
 * 運動記錄相關的 API 呼叫服務
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Workout,
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  WorkoutSyncBatch,
  WorkoutStats,
  WorkoutFilters,
} from '../types/workout';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class WorkoutService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests from AsyncStorage
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Get workout list with filters and pagination
   */
  async getWorkouts(
    filters?: WorkoutFilters,
    cursor?: string,
    limit: number = 20
  ): Promise<{ workouts: Workout[]; cursor?: string; has_more: boolean }> {
    const params = {
      ...filters,
      cursor,
      limit,
    };
    const response = await this.api.get('/workouts', { params });
    return response.data;
  }

  /**
   * Get single workout by ID
   */
  async getWorkout(id: string): Promise<Workout> {
    const response = await this.api.get(`/workouts/${id}`);
    return response.data;
  }

  /**
   * Create new workout
   */
  async createWorkout(data: CreateWorkoutRequest): Promise<Workout> {
    const response = await this.api.post('/workouts', data);
    return response.data;
  }

  /**
   * Update existing workout
   */
  async updateWorkout(id: string, data: UpdateWorkoutRequest): Promise<Workout> {
    const response = await this.api.put(`/workouts/${id}`, data);
    return response.data;
  }

  /**
   * Delete workout (soft delete)
   */
  async deleteWorkout(id: string): Promise<void> {
    await this.api.delete(`/workouts/${id}`);
  }

  /**
   * Sync workouts batch (offline sync)
   */
  async syncWorkouts(workouts: Workout[]): Promise<WorkoutSyncBatch> {
    const response = await this.api.post('/workouts/sync', { workouts });
    return response.data;
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(
    startDate?: string,
    endDate?: string,
    workoutType?: string
  ): Promise<WorkoutStats> {
    const params = {
      start_date: startDate,
      end_date: endDate,
      workout_type: workoutType,
    };
    const response = await this.api.get('/workouts/stats', { params });
    return response.data;
  }

  /**
   * Import workouts from CSV
   */
  async importFromCSV(file: File): Promise<{ imported_count: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.api.post('/workouts/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Export workouts to CSV
   */
  async exportToCSV(startDate?: string, endDate?: string): Promise<Blob> {
    const params = {
      start_date: startDate,
      end_date: endDate,
    };
    const response = await this.api.get('/workouts/export/csv', {
      params,
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Import from Strava
   */
  async importFromStrava(accessToken: string): Promise<{ imported_count: number }> {
    const response = await this.api.post('/workouts/import/strava', {
      access_token: accessToken,
    });
    return response.data;
  }

  /**
   * Get workout types distribution
   */
  async getWorkoutTypesDistribution(
    startDate?: string,
    endDate?: string
  ): Promise<Array<{ workout_type: string; count: number; percentage: number }>> {
    const params = {
      start_date: startDate,
      end_date: endDate,
    };
    const response = await this.api.get('/workouts/types/distribution', { params });
    return response.data;
  }
}

export default new WorkoutService();
