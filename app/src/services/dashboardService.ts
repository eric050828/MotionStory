/**
 * T110: Dashboard API Service
 * 儀表板與 Widget 相關的 API 呼叫服務
 */

import axios, { AxiosInstance } from 'axios';
import {
  Dashboard,
  Widget,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  AddWidgetRequest,
  UpdateWidgetRequest,
  DashboardTemplate,
} from '../types/dashboard';
import authService from './authService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class DashboardService {
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
   * Get all user dashboards
   */
  async getDashboards(): Promise<Dashboard[]> {
    const response = await this.api.get('/dashboards');
    return response.data;
  }

  /**
   * Get default dashboard
   */
  async getDefaultDashboard(): Promise<Dashboard> {
    const response = await this.api.get('/dashboards/default');
    return response.data;
  }

  /**
   * Get single dashboard by ID
   */
  async getDashboard(id: string): Promise<Dashboard> {
    const response = await this.api.get(`/dashboards/${id}`);
    return response.data;
  }

  /**
   * Create new dashboard
   */
  async createDashboard(data: CreateDashboardRequest): Promise<Dashboard> {
    const response = await this.api.post('/dashboards', data);
    return response.data;
  }

  /**
   * Update dashboard
   */
  async updateDashboard(id: string, data: UpdateDashboardRequest): Promise<Dashboard> {
    const response = await this.api.put(`/dashboards/${id}`, data);
    return response.data;
  }

  /**
   * Delete dashboard
   */
  async deleteDashboard(id: string): Promise<void> {
    await this.api.delete(`/dashboards/${id}`);
  }

  /**
   * Reorder dashboards
   */
  async reorderDashboards(dashboardIds: string[]): Promise<void> {
    await this.api.post('/dashboards/reorder', {
      dashboard_ids: dashboardIds,
    });
  }

  /**
   * Add widget to dashboard
   */
  async addWidget(dashboardId: string, data: AddWidgetRequest): Promise<Widget> {
    const response = await this.api.post(`/dashboards/${dashboardId}/widgets`, data);
    return response.data;
  }

  /**
   * Update widget
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    data: UpdateWidgetRequest
  ): Promise<Widget> {
    const response = await this.api.put(`/dashboards/${dashboardId}/widgets/${widgetId}`, data);
    return response.data;
  }

  /**
   * Delete widget from dashboard
   */
  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    await this.api.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`);
  }

  /**
   * Reorder widgets in dashboard
   */
  async reorderWidgets(dashboardId: string, widgets: Widget[]): Promise<void> {
    await this.api.post(`/dashboards/${dashboardId}/widgets/reorder`, {
      widgets: widgets.map((w) => ({
        id: w.id,
        position: w.position,
      })),
    });
  }

  /**
   * Get dashboard templates
   */
  async getTemplates(): Promise<DashboardTemplate[]> {
    const response = await this.api.get('/dashboards/templates');
    return response.data;
  }

  /**
   * Create dashboard from template
   */
  async createFromTemplate(templateId: string, name?: string): Promise<Dashboard> {
    const response = await this.api.post('/dashboards/from-template', {
      template_id: templateId,
      name,
    });
    return response.data;
  }

  /**
   * Duplicate dashboard
   */
  async duplicateDashboard(id: string, name?: string): Promise<Dashboard> {
    const response = await this.api.post(`/dashboards/${id}/duplicate`, {
      name,
    });
    return response.data;
  }

  /**
   * Get widget data (for preview/rendering)
   */
  async getWidgetData(
    dashboardId: string,
    widgetId: string
  ): Promise<{
    widget: Widget;
    data: any;
  }> {
    const response = await this.api.get(`/dashboards/${dashboardId}/widgets/${widgetId}/data`);
    return response.data;
  }
}

export default new DashboardService();
