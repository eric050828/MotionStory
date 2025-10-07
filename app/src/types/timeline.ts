/**
 * T105: Timeline Types
 * 時間軸、里程碑、年度回顧相關的 TypeScript 類型定義
 */

export type MilestoneType =
  | 'first_workout'
  | 'streak_milestone'
  | 'distance_milestone'
  | 'achievement_earned'
  | 'personal_record'
  | 'year_complete'
  | 'custom';

export interface Milestone {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  milestone_date: string;
  title: string;
  description?: string;
  related_workout_id?: string;
  related_achievement_id?: string;
  icon?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateMilestoneRequest {
  milestone_type: MilestoneType;
  milestone_date: string;
  title: string;
  description?: string;
  related_workout_id?: string;
  related_achievement_id?: string;
  icon?: string;
  metadata?: Record<string, any>;
}

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'workout' | 'achievement' | 'milestone';
  title: string;
  description?: string;
  icon?: string;
  data: any; // Workout | Achievement | Milestone
}

export interface TimelineFilters {
  start_date?: string;
  end_date?: string;
  event_types?: Array<'workout' | 'achievement' | 'milestone'>;
  workout_types?: string[];
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  total_workouts: number;
  total_distance_km: number;
  total_duration_minutes: number;
  total_calories: number;
  achievements_count: number;
  milestones_count: number;
}

export interface YearlyHighlight {
  type: 'achievement' | 'workout' | 'milestone' | 'stat';
  title: string;
  description: string;
  icon: string;
  value?: number | string;
  date?: string;
  metadata?: Record<string, any>;
}

export interface AnnualReview {
  id: string;
  user_id: string;
  year: number;
  total_workouts: number;
  total_distance_km: number;
  total_duration_minutes: number;
  total_calories: number;
  total_achievements: number;
  favorite_workout_type?: string;
  longest_streak_days: number;
  best_month?: string; // YYYY-MM
  top_achievements: string[]; // achievement_ids
  highlights: YearlyHighlight[];
  monthly_breakdown: MonthlyStats[];
  workout_type_distribution: Record<string, number>; // { "running": 45, "cycling": 30 }
  share_card_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerateAnnualReviewRequest {
  year: number;
  include_share_card?: boolean;
}

export interface AnnualReviewStats {
  // 核心數據
  total_workouts: number;
  total_distance_km: number;
  total_duration_minutes: number;
  total_calories: number;
  total_achievements: number;

  // 趨勢分析
  distance_trend: Array<{ month: string; value: number }>;
  workout_trend: Array<{ month: string; value: number }>;
  avg_distance_per_workout: number;
  avg_duration_per_workout: number;

  // 里程碑
  longest_distance: number;
  longest_duration: number;
  longest_streak: number;
  best_month_workouts: number;
  best_month_name: string;

  // 運動類型分布
  workout_types: Array<{ type: string; count: number; percentage: number }>;
  favorite_workout_type: string;

  // 時間分布
  morning_workouts: number; // 06:00-12:00
  afternoon_workouts: number; // 12:00-18:00
  evening_workouts: number; // 18:00-00:00
  night_workouts: number; // 00:00-06:00

  // 比較數據
  compared_to_last_year?: {
    workout_change_percent: number;
    distance_change_percent: number;
    achievement_change_percent: number;
  };
}

export interface TimelineGroup {
  date: string; // YYYY-MM-DD
  events: TimelineEvent[];
}

export interface TimelineResponse {
  groups: TimelineGroup[];
  total_count: number;
  has_more: boolean;
  cursor?: string;
}

export const MILESTONE_ICONS: Record<MilestoneType, string> = {
  first_workout: '🎉',
  streak_milestone: '🔥',
  distance_milestone: '🏃',
  achievement_earned: '🏆',
  personal_record: '🚀',
  year_complete: '📅',
  custom: '⭐',
};

export const TIMELINE_EVENT_COLORS: Record<
  TimelineEvent['type'],
  { bg: string; border: string; text: string }
> = {
  workout: {
    bg: '#E3F2FD',
    border: '#2196F3',
    text: '#1976D2',
  },
  achievement: {
    bg: '#FFF3E0',
    border: '#FF9800',
    text: '#F57C00',
  },
  milestone: {
    bg: '#F3E5F5',
    border: '#9C27B0',
    text: '#7B1FA2',
  },
};
