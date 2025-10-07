/**
 * T109: Achievement API Service
 * 成就系統相關的 API 呼叫服務
 */

import axios, { AxiosInstance } from 'axios';
import {
  Achievement,
  AchievementProgress,
  ShareCard,
  CreateShareCardRequest,
  AchievementNotification,
} from '../types/achievement';
import authService from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class AchievementService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use(
      (config) => {
        const token = authService.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Get user achievements list
   */
  async getAchievements(
    cursor?: string,
    limit: number = 20
  ): Promise<{ achievements: Achievement[]; cursor?: string; has_more: boolean }> {
    const params = { cursor, limit };
    const response = await this.api.get('/achievements', { params });
    return response.data;
  }

  /**
   * Get single achievement by ID
   */
  async getAchievement(id: string): Promise<Achievement> {
    const response = await this.api.get(`/achievements/${id}`);
    return response.data;
  }

  /**
   * Get achievement progress for all achievement types
   */
  async getAchievementProgress(): Promise<AchievementProgress[]> {
    const response = await this.api.get('/achievements/progress');
    return response.data;
  }

  /**
   * Check for new achievements after workout
   */
  async checkAchievements(workoutId: string): Promise<AchievementNotification[]> {
    const response = await this.api.post('/achievements/check', {
      workout_id: workoutId,
    });
    return response.data;
  }

  /**
   * Create share card for achievement
   */
  async createShareCard(data: CreateShareCardRequest): Promise<ShareCard> {
    const response = await this.api.post('/achievements/share', data);
    return response.data;
  }

  /**
   * Get share card by ID
   */
  async getShareCard(id: string): Promise<ShareCard> {
    const response = await this.api.get(`/achievements/share/${id}`);
    return response.data;
  }

  /**
   * Get user's share cards
   */
  async getShareCards(
    cursor?: string,
    limit: number = 20
  ): Promise<{ cards: ShareCard[]; cursor?: string; has_more: boolean }> {
    const params = { cursor, limit };
    const response = await this.api.get('/achievements/share/me', { params });
    return response.data;
  }

  /**
   * Delete share card
   */
  async deleteShareCard(id: string): Promise<void> {
    await this.api.delete(`/achievements/share/${id}`);
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(): Promise<{
    total_achievements: number;
    achievements_by_type: Record<string, number>;
    latest_achievement?: Achievement;
    rarest_achievement?: Achievement;
  }> {
    const response = await this.api.get('/achievements/stats');
    return response.data;
  }

  /**
   * Mark achievement as shared
   */
  async markAsShared(achievementId: string, shareCardId: string): Promise<Achievement> {
    const response = await this.api.patch(`/achievements/${achievementId}/shared`, {
      share_card_id: shareCardId,
    });
    return response.data;
  }
}

export default new AchievementService();
