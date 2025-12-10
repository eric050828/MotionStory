/**
 * Social Types
 * 社群功能相關的 TypeScript 類型定義
 */

// 動態類型
export type ActivityType = 'workout' | 'achievement' | 'challenge';

// 動態內容快照（根據不同類型有不同結構）
export interface WorkoutContent {
  workout_type: string;
  duration_minutes: number;
  distance_km?: number;
  calories?: number;
}

export interface AchievementContent {
  achievement_type: string;
  title: string;
  description: string;
}

export interface ChallengeContent {
  challenge_name: string;
  progress: number;
  goal: number;
}

export type ActivityContent = WorkoutContent | AchievementContent | ChallengeContent | Record<string, unknown>;

// 動態主體
export interface Activity {
  activity_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  activity_type: ActivityType;
  reference_id: string;
  content: ActivityContent;
  image_url: string | null;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
  created_at: string;
}

// 留言（不支援巢狀回覆）
export interface Comment {
  comment_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  content: string;
  status: 'normal' | 'filtered' | 'reported';
  created_at: string;
}

// API 回應
export interface FeedResponse {
  activities: Activity[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface CommentsResponse {
  comments: Comment[];
  total_count: number;
}

// 請求參數
export interface FeedParams {
  limit?: number;
  cursor?: string;
}

export interface CreateCommentRequest {
  content: string;
}

// 建立動態請求
export interface CreateActivityRequest {
  activity_type: ActivityType;
  reference_id: string;
  content?: Record<string, unknown>;
  image_url?: string;
  caption?: string;
}
