/**
 * T120: Dashboard Store
 * Widget 配置、拖拉狀態管理
 */

import { create } from 'zustand';
import {
  Dashboard,
  Widget,
  CreateDashboardRequest,
  UpdateDashboardRequest,
  AddWidgetRequest,
  UpdateWidgetRequest,
  DashboardTemplate,
} from '../types/dashboard';
import dashboardService from '../services/dashboardService';

interface DashboardState {
  // Data
  dashboards: Dashboard[];
  currentDashboard: Dashboard | null;
  templates: DashboardTemplate[];

  // UI State
  loading: boolean;
  error: string | null;
  isDragging: boolean;
  draggedWidget: Widget | null;

  // Actions
  fetchDashboards: () => Promise<void>;
  fetchDefaultDashboard: () => Promise<void>;
  fetchDashboard: (id: string) => Promise<void>;
  createDashboard: (data: CreateDashboardRequest) => Promise<Dashboard>;
  updateDashboard: (id: string, data: UpdateDashboardRequest) => Promise<void>;
  deleteDashboard: (id: string) => Promise<void>;
  setCurrentDashboard: (dashboard: Dashboard | null) => void;

  // Widget Actions
  addWidget: (dashboardId: string, data: AddWidgetRequest) => Promise<void>;
  updateWidget: (dashboardId: string, widgetId: string, data: UpdateWidgetRequest) => Promise<void>;
  deleteWidget: (dashboardId: string, widgetId: string) => Promise<void>;
  reorderWidgets: (dashboardId: string, widgets: Widget[]) => Promise<void>;

  // Drag & Drop
  startDrag: (widget: Widget) => void;
  endDrag: () => void;
  updateWidgetPosition: (widgetId: string, row: number, col: number) => void;

  // Templates
  fetchTemplates: () => Promise<void>;
  createFromTemplate: (templateId: string, name?: string) => Promise<void>;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial State
  dashboards: [],
  currentDashboard: null,
  templates: [],
  loading: false,
  error: null,
  isDragging: false,
  draggedWidget: null,

  // Fetch All Dashboards
  fetchDashboards: async () => {
    set({ loading: true, error: null });

    try {
      const dashboards = await dashboardService.getDashboards();
      set({ dashboards, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch dashboards', loading: false });
    }
  },

  // Fetch Default Dashboard
  fetchDefaultDashboard: async () => {
    set({ loading: true, error: null });

    try {
      const dashboard = await dashboardService.getDefaultDashboard();
      set({ currentDashboard: dashboard, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch default dashboard', loading: false });
    }
  },

  // Fetch Single Dashboard
  fetchDashboard: async (id: string) => {
    set({ loading: true, error: null });

    try {
      const dashboard = await dashboardService.getDashboard(id);
      set({ currentDashboard: dashboard, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch dashboard', loading: false });
    }
  },

  // Create Dashboard
  createDashboard: async (data: CreateDashboardRequest) => {
    set({ loading: true, error: null });

    try {
      const created = await dashboardService.createDashboard(data);

      set((state) => ({
        dashboards: [...state.dashboards, created],
        loading: false,
      }));

      return created;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create dashboard', loading: false });
      throw error;
    }
  },

  // Update Dashboard
  updateDashboard: async (id: string, data: UpdateDashboardRequest) => {
    set({ loading: true, error: null });

    try {
      const updated = await dashboardService.updateDashboard(id, data);

      set((state) => ({
        dashboards: state.dashboards.map((d) => (d.id === id ? updated : d)),
        currentDashboard: state.currentDashboard?.id === id ? updated : state.currentDashboard,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update dashboard', loading: false });
    }
  },

  // Delete Dashboard
  deleteDashboard: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await dashboardService.deleteDashboard(id);

      set((state) => ({
        dashboards: state.dashboards.filter((d) => d.id !== id),
        currentDashboard: state.currentDashboard?.id === id ? null : state.currentDashboard,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete dashboard', loading: false });
    }
  },

  // Set Current Dashboard
  setCurrentDashboard: (dashboard: Dashboard | null) => {
    set({ currentDashboard: dashboard });
  },

  // Add Widget
  addWidget: async (dashboardId: string, data: AddWidgetRequest) => {
    set({ loading: true, error: null });

    try {
      const widget = await dashboardService.addWidget(dashboardId, data);

      set((state) => {
        const updatedDashboards = state.dashboards.map((d) => {
          if (d.id === dashboardId) {
            return { ...d, widgets: [...d.widgets, widget] };
          }
          return d;
        });

        const updatedCurrentDashboard =
          state.currentDashboard?.id === dashboardId
            ? { ...state.currentDashboard, widgets: [...state.currentDashboard.widgets, widget] }
            : state.currentDashboard;

        return {
          dashboards: updatedDashboards,
          currentDashboard: updatedCurrentDashboard,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to add widget', loading: false });
    }
  },

  // Update Widget
  updateWidget: async (dashboardId: string, widgetId: string, data: UpdateWidgetRequest) => {
    set({ loading: true, error: null });

    try {
      const updated = await dashboardService.updateWidget(dashboardId, widgetId, data);

      set((state) => {
        const updateWidgetInDashboard = (dashboard: Dashboard) => ({
          ...dashboard,
          widgets: dashboard.widgets.map((w) => (w.id === widgetId ? updated : w)),
        });

        return {
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId ? updateWidgetInDashboard(d) : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? updateWidgetInDashboard(state.currentDashboard)
              : state.currentDashboard,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update widget', loading: false });
    }
  },

  // Delete Widget
  deleteWidget: async (dashboardId: string, widgetId: string) => {
    set({ loading: true, error: null });

    try {
      await dashboardService.deleteWidget(dashboardId, widgetId);

      set((state) => {
        const removeWidgetFromDashboard = (dashboard: Dashboard) => ({
          ...dashboard,
          widgets: dashboard.widgets.filter((w) => w.id !== widgetId),
        });

        return {
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId ? removeWidgetFromDashboard(d) : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? removeWidgetFromDashboard(state.currentDashboard)
              : state.currentDashboard,
          loading: false,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete widget', loading: false });
    }
  },

  // Reorder Widgets
  reorderWidgets: async (dashboardId: string, widgets: Widget[]) => {
    try {
      await dashboardService.reorderWidgets(dashboardId, widgets);

      set((state) => {
        const updateDashboardWidgets = (dashboard: Dashboard) => ({
          ...dashboard,
          widgets,
        });

        return {
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId ? updateDashboardWidgets(d) : d
          ),
          currentDashboard:
            state.currentDashboard?.id === dashboardId
              ? updateDashboardWidgets(state.currentDashboard)
              : state.currentDashboard,
        };
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to reorder widgets' });
    }
  },

  // Start Drag
  startDrag: (widget: Widget) => {
    set({ isDragging: true, draggedWidget: widget });
  },

  // End Drag
  endDrag: () => {
    set({ isDragging: false, draggedWidget: null });
  },

  // Update Widget Position (optimistic update during drag)
  updateWidgetPosition: (widgetId: string, row: number, col: number) => {
    set((state) => {
      if (!state.currentDashboard) return state;

      const updatedWidgets = state.currentDashboard.widgets.map((w) =>
        w.id === widgetId ? { ...w, position: { row, col } } : w
      );

      return {
        currentDashboard: {
          ...state.currentDashboard,
          widgets: updatedWidgets,
        },
      };
    });
  },

  // Fetch Templates
  fetchTemplates: async () => {
    set({ loading: true, error: null });

    try {
      const templates = await dashboardService.getTemplates();
      set({ templates, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch templates', loading: false });
    }
  },

  // Create From Template
  createFromTemplate: async (templateId: string, name?: string) => {
    set({ loading: true, error: null });

    try {
      const created = await dashboardService.createFromTemplate(templateId, name);

      set((state) => ({
        dashboards: [...state.dashboards, created],
        currentDashboard: created,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to create from template', loading: false });
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),

  // Reset Store
  reset: () =>
    set({
      dashboards: [],
      currentDashboard: null,
      templates: [],
      loading: false,
      error: null,
      isDragging: false,
      draggedWidget: null,
    }),
}));

export default useDashboardStore;
