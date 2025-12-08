/**
 * T110: Dashboard API Service
 * ?�表板??Widget ?��???API ?�叫?��?
 */

import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  Dashboard,
  Widget,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  AddWidgetRequest,
  UpdateWidgetRequest,
  DashboardTemplate,
} from '../types/dashboard';

// For prebuild/native builds, use app.json extra.apiUrl
// For Expo Go, use EXPO_PUBLIC_API_URL from .env
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';

console.log('?�� Dashboard Service API Configuration:');
console.log('  - Constants.expoConfig?.extra?.apiUrl:', Constants.expoConfig?.extra?.apiUrl);
console.log('  - process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
console.log('  - Using API_BASE_URL:', API_BASE_URL);

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
    console.log('?? dashboardService.getDefaultDashboard - Making request to:', `${API_BASE_URL}/dashboards/default`);
    try {
      const response = await this.api.get('/dashboards/default');
      console.log('??dashboardService.getDefaultDashboard - Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('??dashboardService.getDefaultDashboard - Error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
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
   * Uses PUT /dashboards/{id} to update the entire dashboard with new widget
   */
  async addWidget(dashboardId: string, data: AddWidgetRequest): Promise<Widget> {
    // First get the current dashboard
    const dashboard = await this.getDashboard(dashboardId);

    // Create new widget with generated ID
    const newWidget: Widget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      title: data.title,
      position: data.position || { x: 0, y: 0 },
      size: data.size || { width: 2, height: 2 },
      config: data.config || {},
      visible: true,
    };

    // Add widget to dashboard
    const updatedWidgets = [...dashboard.widgets, newWidget];

    // Update dashboard with new widgets array
    await this.updateDashboard(dashboardId, { widgets: updatedWidgets });

    return newWidget;
  }

  /**
   * Update widget
   * Uses PUT /dashboards/{id} to update the entire dashboard
   */
  async updateWidget(
    dashboardId: string,
    widgetId: string,
    data: UpdateWidgetRequest
  ): Promise<Widget> {
    // First get the current dashboard
    const dashboard = await this.getDashboard(dashboardId);

    // Find and update the widget
    const updatedWidgets = dashboard.widgets.map((w) => {
      if (w.id === widgetId) {
        return {
          ...w,
          position: data.position || w.position,
          config: data.config || w.config,
        };
      }
      return w;
    });

    // Update dashboard with modified widgets array
    await this.updateDashboard(dashboardId, { widgets: updatedWidgets });

    // Return the updated widget
    const updatedWidget = updatedWidgets.find(w => w.id === widgetId);
    if (!updatedWidget) {
      throw new Error('Widget not found');
    }
    return updatedWidget;
  }

  /**
   * Delete widget from dashboard
   * Uses PUT /dashboards/{id} to update the entire dashboard
   */
  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    // First get the current dashboard
    const dashboard = await this.getDashboard(dashboardId);

    // Remove the widget
    const updatedWidgets = dashboard.widgets.filter(w => w.id !== widgetId);

    // Update dashboard with filtered widgets array
    await this.updateDashboard(dashboardId, { widgets: updatedWidgets });
  }

  /**
   * Reorder widgets in dashboard
   * Uses PUT /dashboards/{id} to update the entire dashboard
   */
  async reorderWidgets(dashboardId: string, widgets: Widget[]): Promise<void> {
    // Update dashboard with reordered widgets array
    await this.updateDashboard(dashboardId, { widgets });
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
   * Widget data is fetched from the dashboard itself
   */
  async getWidgetData(
    dashboardId: string,
    widgetId: string
  ): Promise<{
    widget: Widget;
    data: any;
  }> {
    // Get the dashboard and find the widget
    const dashboard = await this.getDashboard(dashboardId);
    const widget = dashboard.widgets.find(w => w.id === widgetId);

    if (!widget) {
      throw new Error('Widget not found');
    }

    // Return widget with empty data - actual data is fetched by the widget component
    return {
      widget,
      data: null,
    };
  }
}

export default new DashboardService();

