/**
 * API Service
 * 處理所有 API 請求與後端通訊
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// For prebuild/native builds, use app.json extra.apiUrl
// For Expo Go, use EXPO_PUBLIC_API_URL from .env
const API_BASE_URL = 
  Constants.expoConfig?.extra?.apiUrl || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:8000/api/v1';

console.log('🔧 API Configuration:');
console.log('  - Constants.expoConfig?.extra?.apiUrl:', Constants.expoConfig?.extra?.apiUrl);
console.log('  - process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('  - Using API_BASE_URL:', API_BASE_URL);

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
    try {
      console.log('🚀 API Register - Sending request to:', `${API_BASE_URL}/auth/register`);
      console.log('📝 Register data:', { email, displayName });
      
      const response = await this.client.post('/auth/register', {
        email,
        password,
        display_name: displayName,
      });
      
      console.log('✅ Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Register error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      console.log('🚀 API Login - Sending request to:', `${API_BASE_URL}/auth/login`);
      console.log('📝 Login data:', { email });

      const response = await this.client.post('/auth/login', { email, password });

      console.log('✅ Login response:', response.data);

      if (response.data.access_token) {
        await AsyncStorage.setItem('access_token', response.data.access_token);
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ Login error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
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

  // Social endpoints
  async getSocialFeed(params?: { limit?: number; cursor?: string }) {
    const response = await this.client.get('/social/feed', { params });
    return response.data;
  }

  async likeActivity(activityId: string) {
    const response = await this.client.post(`/social/activities/${activityId}/like`);
    return response.data;
  }

  async unlikeActivity(activityId: string) {
    await this.client.delete(`/social/activities/${activityId}/like`);
  }

  async getActivityComments(activityId: string, params?: { limit?: number; offset?: number }) {
    const response = await this.client.get(`/social/activities/${activityId}/comments`, { params });
    return response.data;
  }

  async createComment(activityId: string, data: { content: string }) {
    const response = await this.client.post(`/social/activities/${activityId}/comment`, data);
    return response.data;
  }

  async createActivity(data: {
    activity_type: string;
    reference_id: string;
    content?: Record<string, unknown>;
    image_url?: string;
    caption?: string;
  }) {
    const response = await this.client.post('/social/activities', data);
    return response.data;
  }

  // Leaderboard endpoints
  async getLeaderboard(params?: {
    period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    metric?: 'distance' | 'duration' | 'workouts' | 'calories';
  }) {
    const response = await this.client.get('/leaderboard', { params });
    return response.data;
  }

  // Friends endpoints
  async searchFriends(queryType: 'user_id' | 'email' | 'qrcode', query: string) {
    const response = await this.client.post('/friends/search', null, {
      params: { query_type: queryType, query },
    });
    return response.data;
  }

  async sendFriendInvite(friendId: string) {
    const response = await this.client.post('/friends/invite', { friend_id: friendId });
    return response.data;
  }

  async getFriends(params?: {
    status?: 'accepted' | 'pending' | 'rejected';
    limit?: number;
    offset?: number;
  }) {
    const response = await this.client.get('/friends', { params });
    return response.data;
  }

  async getFriendRequests() {
    const response = await this.client.get('/friends/requests');
    return response.data;
  }

  async acceptFriendRequest(friendshipId: string) {
    const response = await this.client.post(`/friends/${friendshipId}/accept`);
    return response.data;
  }

  async rejectFriendRequest(friendshipId: string) {
    const response = await this.client.post(`/friends/${friendshipId}/reject`);
    return response.data;
  }

  async removeFriend(friendshipId: string) {
    await this.client.delete(`/friends/${friendshipId}`);
  }

  async blockUser(userId: string, reason?: string) {
    const response = await this.client.post(`/friends/${userId}/block`, { reason });
    return response.data;
  }

  // My Activities endpoints
  async getMyActivities(params?: { limit?: number; cursor?: string }) {
    const response = await this.client.get('/social/my-activities', { params });
    return response.data;
  }

  async updateActivity(activityId: string, data: { caption?: string; image_url?: string }) {
    const response = await this.client.put(`/social/activities/${activityId}`, data);
    return response.data;
  }

  async deleteActivity(activityId: string) {
    await this.client.delete(`/social/activities/${activityId}`);
  }

  // Profile endpoints
  async getUserProfile(userId: string) {
    const response = await this.client.get(`/profiles/${userId}`);
    return response.data;
  }

  async getMyProfile() {
    const response = await this.client.get('/profiles/me');
    return response.data;
  }

  async updateMyProfile(data: {
    display_name?: string;
    avatar_url?: string;
    privacy_settings?: Record<string, unknown>;
    preferences?: Record<string, unknown>;
  }) {
    const response = await this.client.put('/profiles/me', data);
    return response.data;
  }

  // Get user's activities (public activities for profile view)
  async getUserActivities(userId: string, params?: { limit?: number; cursor?: string }) {
    const response = await this.client.get(`/social/user/${userId}/activities`, { params });
    return response.data;
  }
}

export const api = new ApiService();
