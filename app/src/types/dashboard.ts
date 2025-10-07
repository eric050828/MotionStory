/**
 * T104: Dashboard & Widget Types
 * 儀表板與 Widget 相關的 TypeScript 類型定義
 */

export type WidgetType =
  | 'progress_ring'
  | 'recent_workouts'
  | 'achievement_showcase'
  | 'workout_heatmap'
  | 'stats_comparison'
  | 'goal_tracker'
  | 'line_chart'
  | 'bar_chart'
  | 'pie_chart'
  | 'distance_leaderboard'
  | 'streak_counter'
  | 'quick_actions';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export type ChartTimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export interface WidgetPosition {
  row: number;
  col: number;
}

export interface WidgetDimensions {
  width: number; // Grid columns (1-4)
  height: number; // Grid rows (1-4)
}

export interface WidgetConfig {
  // Progress Ring
  metric?: 'distance' | 'duration' | 'calories' | 'workouts';
  goal_value?: number;
  time_range?: ChartTimeRange;

  // Charts
  chart_type?: 'line' | 'bar' | 'pie';
  data_source?: 'workouts' | 'achievements' | 'goals';
  workout_types?: string[]; // Filter by workout types

  // Heatmap
  heatmap_year?: number;

  // Leaderboard
  leaderboard_metric?: 'distance' | 'duration' | 'workouts';
  leaderboard_period?: 'weekly' | 'monthly' | 'yearly' | 'all_time';

  // Custom
  [key: string]: any;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  dimensions: WidgetDimensions;
  config: WidgetConfig;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  order: number;
  widgets: Widget[];
  grid_columns: number; // 預設 4
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardRequest {
  name: string;
  is_default?: boolean;
}

export interface UpdateDashboardRequest {
  name?: string;
  is_default?: boolean;
  order?: number;
  widgets?: Widget[];
}

export interface AddWidgetRequest {
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  dimensions: WidgetDimensions;
  config?: WidgetConfig;
}

export interface UpdateWidgetRequest {
  title?: string;
  position?: WidgetPosition;
  dimensions?: WidgetDimensions;
  config?: WidgetConfig;
  visible?: boolean;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  preview_image?: string;
  widgets: Omit<Widget, 'id' | 'created_at' | 'updated_at'>[];
  category: 'beginner' | 'runner' | 'cyclist' | 'multi_sport' | 'analyst';
}

export const WIDGET_TEMPLATES: Record<WidgetType, {
  default_title: string;
  default_size: WidgetSize;
  default_dimensions: WidgetDimensions;
  description: string;
  icon: string;
  min_dimensions?: WidgetDimensions;
}> = {
  progress_ring: {
    default_title: '本週進度',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 2 },
    description: '顯示目標進度環',
    icon: '🎯',
    min_dimensions: { width: 2, height: 2 },
  },
  recent_workouts: {
    default_title: '最近運動',
    default_size: 'large',
    default_dimensions: { width: 4, height: 2 },
    description: '最近的運動記錄列表',
    icon: '📋',
    min_dimensions: { width: 2, height: 2 },
  },
  achievement_showcase: {
    default_title: '成就展示',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 2 },
    description: '展示最新成就',
    icon: '🏆',
    min_dimensions: { width: 2, height: 2 },
  },
  workout_heatmap: {
    default_title: '運動熱力圖',
    default_size: 'full',
    default_dimensions: { width: 4, height: 2 },
    description: 'GitHub 風格活動熱力圖',
    icon: '📅',
    min_dimensions: { width: 4, height: 2 },
  },
  stats_comparison: {
    default_title: '數據對比',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 2 },
    description: '不同時期數據對比',
    icon: '📊',
    min_dimensions: { width: 2, height: 2 },
  },
  goal_tracker: {
    default_title: '目標追蹤',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 2 },
    description: '追蹤設定的目標',
    icon: '🎯',
    min_dimensions: { width: 2, height: 1 },
  },
  line_chart: {
    default_title: '趨勢圖表',
    default_size: 'large',
    default_dimensions: { width: 4, height: 2 },
    description: '折線圖顯示趨勢',
    icon: '📈',
    min_dimensions: { width: 2, height: 2 },
  },
  bar_chart: {
    default_title: '柱狀圖表',
    default_size: 'large',
    default_dimensions: { width: 4, height: 2 },
    description: '柱狀圖顯示數據',
    icon: '📊',
    min_dimensions: { width: 2, height: 2 },
  },
  pie_chart: {
    default_title: '圓餅圖表',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 2 },
    description: '圓餅圖顯示佔比',
    icon: '🥧',
    min_dimensions: { width: 2, height: 2 },
  },
  distance_leaderboard: {
    default_title: '距離排行',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 2 },
    description: '個人距離排行榜',
    icon: '🏃',
    min_dimensions: { width: 2, height: 2 },
  },
  streak_counter: {
    default_title: '連續天數',
    default_size: 'small',
    default_dimensions: { width: 1, height: 1 },
    description: '顯示當前連續天數',
    icon: '🔥',
    min_dimensions: { width: 1, height: 1 },
  },
  quick_actions: {
    default_title: '快速操作',
    default_size: 'medium',
    default_dimensions: { width: 2, height: 1 },
    description: '常用操作快捷按鈕',
    icon: '⚡',
    min_dimensions: { width: 2, height: 1 },
  },
};

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'beginner',
    name: '新手入門',
    description: '適合剛開始運動的使用者',
    category: 'beginner',
    widgets: [
      {
        type: 'progress_ring',
        title: '本週目標',
        position: { row: 0, col: 0 },
        dimensions: { width: 2, height: 2 },
        config: { metric: 'workouts', goal_value: 3, time_range: '7d' },
        visible: true,
        created_at: '',
        updated_at: '',
      },
      {
        type: 'recent_workouts',
        title: '最近運動',
        position: { row: 0, col: 2 },
        dimensions: { width: 2, height: 2 },
        config: {},
        visible: true,
        created_at: '',
        updated_at: '',
      },
      {
        type: 'streak_counter',
        title: '連續天數',
        position: { row: 2, col: 0 },
        dimensions: { width: 2, height: 1 },
        config: {},
        visible: true,
        created_at: '',
        updated_at: '',
      },
    ],
  },
  {
    id: 'runner',
    name: '跑者專用',
    description: '專為跑步愛好者設計',
    category: 'runner',
    widgets: [
      {
        type: 'line_chart',
        title: '距離趨勢',
        position: { row: 0, col: 0 },
        dimensions: { width: 4, height: 2 },
        config: {
          chart_type: 'line',
          metric: 'distance',
          time_range: '30d',
          workout_types: ['running'],
        },
        visible: true,
        created_at: '',
        updated_at: '',
      },
      {
        type: 'distance_leaderboard',
        title: '月度距離',
        position: { row: 2, col: 0 },
        dimensions: { width: 2, height: 2 },
        config: { leaderboard_metric: 'distance', leaderboard_period: 'monthly' },
        visible: true,
        created_at: '',
        updated_at: '',
      },
      {
        type: 'achievement_showcase',
        title: '最新成就',
        position: { row: 2, col: 2 },
        dimensions: { width: 2, height: 2 },
        config: {},
        visible: true,
        created_at: '',
        updated_at: '',
      },
    ],
  },
];
