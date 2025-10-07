/**
 * T103: Achievement Types
 * 成就系統相關的 TypeScript 類型定義
 */

export type AchievementType =
  | 'first_workout'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'distance_5k'
  | 'distance_10k'
  | 'distance_half_marathon'
  | 'distance_marathon'
  | 'distance_100k'
  | 'total_1000km'
  | 'personal_record_distance'
  | 'personal_record_duration'
  | 'year_in_review';

export type CelebrationLevel = 'none' | 'basic' | 'confetti' | 'fireworks' | 'epic';

export interface AchievementMetadata {
  streak_days?: number;
  distance_km?: number;
  previous_record?: number;
  new_record?: number;
  year?: number;
  total_workouts?: number;
  [key: string]: any; // 允許自訂欄位
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  achieved_at: string;
  celebration_level: CelebrationLevel;
  metadata?: AchievementMetadata;
  shared: boolean;
  share_card_id?: string;
  created_at: string;
}

export interface AchievementProgress {
  achievement_type: AchievementType;
  current_value: number;
  target_value: number;
  percentage: number;
  is_completed: boolean;
  title: string;
  description: string;
  icon: string;
}

export interface ShareCard {
  id: string;
  user_id: string;
  achievement_id: string;
  image_url: string;
  created_at: string;
  views_count: number;
  share_link?: string;
}

export interface CreateShareCardRequest {
  achievement_id: string;
  template?: string; // 分享卡片模板 ID
}

export interface AchievementNotification {
  achievement: Achievement;
  celebration_level: CelebrationLevel;
  should_show_share_prompt: boolean;
}

export const ACHIEVEMENT_CONFIG: Record<
  AchievementType,
  {
    title: string;
    description: string;
    icon: string;
    celebration_level: CelebrationLevel;
    target_value?: number;
  }
> = {
  first_workout: {
    title: '踏出第一步',
    description: '完成第一次運動記錄',
    icon: '🎉',
    celebration_level: 'basic',
  },
  streak_7: {
    title: '七天習慣',
    description: '連續運動 7 天',
    icon: '🔥',
    celebration_level: 'confetti',
    target_value: 7,
  },
  streak_30: {
    title: '月度堅持',
    description: '連續運動 30 天',
    icon: '💪',
    celebration_level: 'fireworks',
    target_value: 30,
  },
  streak_100: {
    title: '百日傳奇',
    description: '連續運動 100 天',
    icon: '👑',
    celebration_level: 'epic',
    target_value: 100,
  },
  distance_5k: {
    title: '首個 5K',
    description: '單次運動距離達到 5 公里',
    icon: '🏃',
    celebration_level: 'basic',
    target_value: 5,
  },
  distance_10k: {
    title: '10K 里程碑',
    description: '單次運動距離達到 10 公里',
    icon: '🏃‍♀️',
    celebration_level: 'confetti',
    target_value: 10,
  },
  distance_half_marathon: {
    title: '半程馬拉松',
    description: '單次運動距離達到 21.1 公里',
    icon: '🎽',
    celebration_level: 'fireworks',
    target_value: 21.1,
  },
  distance_marathon: {
    title: '全程馬拉松',
    description: '單次運動距離達到 42.195 公里',
    icon: '🏅',
    celebration_level: 'epic',
    target_value: 42.195,
  },
  distance_100k: {
    title: '百公里挑戰',
    description: '單次運動距離達到 100 公里',
    icon: '🦸',
    celebration_level: 'epic',
    target_value: 100,
  },
  total_1000km: {
    title: '千里之行',
    description: '累積運動距離達到 1000 公里',
    icon: '🌟',
    celebration_level: 'epic',
    target_value: 1000,
  },
  personal_record_distance: {
    title: '距離新紀錄',
    description: '打破個人最遠距離紀錄',
    icon: '🚀',
    celebration_level: 'fireworks',
  },
  personal_record_duration: {
    title: '時長新紀錄',
    description: '打破個人最長運動時間紀錄',
    icon: '⏱️',
    celebration_level: 'fireworks',
  },
  year_in_review: {
    title: '年度回顧',
    description: '完成年度運動總結',
    icon: '📅',
    celebration_level: 'epic',
  },
};
