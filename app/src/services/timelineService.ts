/**
 * T111: Timeline API Service
 * 時間軸、里程碑、年度回顧相關的 API 呼叫服務
 */

import axios, { AxiosInstance } from 'axios';
import {
  Milestone,
  CreateMilestoneRequest,
  TimelineEvent,
  TimelineFilters,
  TimelineResponse,
  AnnualReview,
  GenerateAnnualReviewRequest,
  AnnualReviewStats,
  MonthlyStats,
} from '../types/timeline';
import authService from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class TimelineService {
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
   * Get timeline events with filters and pagination
   */
  async getTimeline(
    filters?: TimelineFilters,
    cursor?: string,
    limit: number = 20
  ): Promise<TimelineResponse> {
    const params = {
      ...filters,
      cursor,
      limit,
    };
    const response = await this.api.get('/timeline', { params });
    return response.data;
  }

  /**
   * Get milestones list
   */
  async getMilestones(
    cursor?: string,
    limit: number = 20
  ): Promise<{ milestones: Milestone[]; cursor?: string; has_more: boolean }> {
    const params = { cursor, limit };
    const response = await this.api.get('/timeline/milestones', { params });
    return response.data;
  }

  /**
   * Get single milestone by ID
   */
  async getMilestone(id: string): Promise<Milestone> {
    const response = await this.api.get(`/timeline/milestones/${id}`);
    return response.data;
  }

  /**
   * Create milestone
   */
  async createMilestone(data: CreateMilestoneRequest): Promise<Milestone> {
    const response = await this.api.post('/timeline/milestones', data);
    return response.data;
  }

  /**
   * Update milestone
   */
  async updateMilestone(id: string, data: Partial<CreateMilestoneRequest>): Promise<Milestone> {
    const response = await this.api.put(`/timeline/milestones/${id}`, data);
    return response.data;
  }

  /**
   * Delete milestone
   */
  async deleteMilestone(id: string): Promise<void> {
    await this.api.delete(`/timeline/milestones/${id}`);
  }

  /**
   * Get annual review for specific year
   */
  async getAnnualReview(year: number): Promise<AnnualReview> {
    const response = await this.api.get(`/timeline/annual-review/${year}`);
    return response.data;
  }

  /**
   * Generate annual review
   */
  async generateAnnualReview(data: GenerateAnnualReviewRequest): Promise<AnnualReview> {
    const response = await this.api.post('/timeline/annual-review', data);
    return response.data;
  }

  /**
   * Get annual review statistics
   */
  async getAnnualReviewStats(year: number): Promise<AnnualReviewStats> {
    const response = await this.api.get(`/timeline/annual-review/${year}/stats`);
    return response.data;
  }

  /**
   * Get all available annual reviews
   */
  async getAnnualReviews(): Promise<AnnualReview[]> {
    const response = await this.api.get('/timeline/annual-reviews');
    return response.data;
  }

  /**
   * Share annual review (generate share card)
   */
  async shareAnnualReview(year: number): Promise<{ share_card_url: string }> {
    const response = await this.api.post(`/timeline/annual-review/${year}/share`);
    return response.data;
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(year: number, month: number): Promise<MonthlyStats> {
    const response = await this.api.get(`/timeline/monthly-stats/${year}/${month}`);
    return response.data;
  }

  /**
   * Get yearly statistics summary
   */
  async getYearlyStats(year: number): Promise<{
    monthly_breakdown: MonthlyStats[];
    year_total: {
      total_workouts: number;
      total_distance_km: number;
      total_duration_minutes: number;
      total_calories: number;
    };
  }> {
    const response = await this.api.get(`/timeline/yearly-stats/${year}`);
    return response.data;
  }

  /**
   * Get timeline event by ID
   */
  async getTimelineEvent(id: string, type: 'workout' | 'achievement' | 'milestone'): Promise<TimelineEvent> {
    const response = await this.api.get(`/timeline/events/${type}/${id}`);
    return response.data;
  }

  /**
   * Search timeline events
   */
  async searchTimeline(query: string, filters?: TimelineFilters): Promise<TimelineEvent[]> {
    const params = {
      q: query,
      ...filters,
    };
    const response = await this.api.get('/timeline/search', { params });
    return response.data;
  }
}

export default new TimelineService();
