/**
 * API Service
 * 處理所有 API 請求與後端通訊
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - 自動附加 token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - 處理錯誤
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token 過期，清除並重新登入
          await AsyncStorage.removeItem('access_token');
          // TODO: Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(email: string, password: string, displayName: string) {
    const response = await this.client.post('/auth/register', {
      email,
      password,
      display_name: displayName,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  }

  async googleLogin(idToken: string) {
    const response = await this.client.post('/auth/google', { id_token: idToken });
    if (response.data.access_token) {
      await AsyncStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updatePrivacySettings(settings: any) {
    const response = await this.client.put('/auth/me/privacy', settings);
    return response.data;
  }

  async deleteAccount() {
    const response = await this.client.delete('/auth/delete');
    await AsyncStorage.removeItem('access_token');
    return response.data;
  }

  // Workouts endpoints
  async createWorkout(workoutData: any) {
    const response = await this.client.post('/workouts', workoutData);
    return response.data;
  }

  async getWorkouts(params?: {
    limit?: number;
    cursor?: string;
    workout_type?: string;
    start_date?: string;
    end_date?: string;
  }) {
    const response = await this.client.get('/workouts', { params });
    return response.data;
  }

  async getWorkout(id: string) {
    const response = await this.client.get(`/workouts/${id}`);
    return response.data;
  }

  async updateWorkout(id: string, workoutData: any) {
    const response = await this.client.put(`/workouts/${id}`, workoutData);
    return response.data;
  }

  async deleteWorkout(id: string) {
    const response = await this.client.delete(`/workouts/${id}`);
    return response.data;
  }

  async restoreWorkout(id: string) {
    const response = await this.client.post(`/workouts/${id}/restore`);
    return response.data;
  }

  async getTrashWorkouts() {
    const response = await this.client.get('/workouts/trash');
    return response.data;
  }

  async getWorkoutStats(params?: {
    start_date?: string;
    end_date?: string;
  }) {
    const response = await this.client.get('/workouts/stats', { params });
    return response.data;
  }

  // Achievements endpoints
  async getAchievements(params?: {
    limit?: number;
    skip?: number;
    achievement_type?: string;
  }) {
    const response = await this.client.get('/achievements', { params });
    return response.data;
  }

  async checkAchievements() {
    const response = await this.client.post('/achievements/check');
    return response.data;
  }

  async getAchievementTypes() {
    const response = await this.client.get('/achievements/types');
    return response.data;
  }

  async createShareCard(achievementId: string, template: string) {
    const response = await this.client.post(
      `/achievements/${achievementId}/share-card`,
      { template }
    );
    return response.data;
  }

  // Dashboards endpoints
  async getDashboards() {
    const response = await this.client.get('/dashboards');
    return response.data;
  }

  async getDefaultDashboard() {
    const response = await this.client.get('/dashboards/default');
    return response.data;
  }

  async getDashboard(id: string) {
    const response = await this.client.get(`/dashboards/${id}`);
    return response.data;
  }

  async createDashboard(dashboardData: any) {
    const response = await this.client.post('/dashboards', dashboardData);
    return response.data;
  }

  async updateDashboard(id: string, dashboardData: any) {
    const response = await this.client.put(`/dashboards/${id}`, dashboardData);
    return response.data;
  }

  async deleteDashboard(id: string) {
    const response = await this.client.delete(`/dashboards/${id}`);
    return response.data;
  }

  async setDefaultDashboard(id: string) {
    const response = await this.client.post(`/dashboards/${id}/set-default`);
    return response.data;
  }

  // Timeline endpoints
  async getTimeline(params?: {
    start_date?: string;
    end_date?: string;
    highlighted_only?: boolean;
  }) {
    const response = await this.client.get('/timeline', { params });
    return response.data;
  }

  async getMilestones(highlightedOnly = true) {
    const response = await this.client.get('/timeline/milestones', {
      params: { highlighted_only: highlightedOnly },
    });
    return response.data;
  }

  async generateAnnualReview(year: number) {
    const response = await this.client.post('/timeline/annual-review', { year });
    return response.data;
  }

  async getAnnualReview(year: number) {
    const response = await this.client.get(`/timeline/annual-review/${year}`);
    return response.data;
  }

  async exportAnnualReview(year: number, options?: any) {
    const response = await this.client.get(
      `/timeline/annual-review/${year}/export`,
      { params: options }
    );
    return response.data;
  }
}

export const api = new ApiService();
