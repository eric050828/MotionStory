/**
 * Social Service
 * 處理社群功能相關的業務邏輯
 */

import { api } from './api';
import type {
  Activity,
  Comment,
  FeedResponse,
  FeedParams,
  CommentsResponse,
  CreateCommentRequest,
  CreateActivityRequest,
} from '../types/social';

class SocialService {
  /**
   * 取得動態牆
   */
  async getFeed(params?: FeedParams): Promise<FeedResponse> {
    return api.getSocialFeed(params);
  }

  /**
   * 按讚動態
   */
  async likeActivity(activityId: string): Promise<void> {
    await api.likeActivity(activityId);
  }

  /**
   * 取消按讚
   */
  async unlikeActivity(activityId: string): Promise<void> {
    await api.unlikeActivity(activityId);
  }

  /**
   * 取得留言列表
   */
  async getComments(activityId: string, params?: { limit?: number; offset?: number }): Promise<CommentsResponse> {
    return api.getActivityComments(activityId, params);
  }

  /**
   * 新增留言
   */
  async createComment(activityId: string, data: CreateCommentRequest): Promise<Comment> {
    return api.createComment(activityId, data);
  }

  /**
   * 發布動態（分享運動/成就/挑戰到社群）
   */
  async createActivity(data: CreateActivityRequest): Promise<Activity> {
    return api.createActivity(data);
  }

  /**
   * 分享運動記錄到社群
   */
  async shareWorkout(
    workoutId: string,
    workoutData: {
      workout_type: string;
      duration_minutes: number;
      distance_km?: number;
      calories?: number;
    },
    caption?: string,
    imageUrl?: string
  ): Promise<Activity> {
    return this.createActivity({
      activity_type: 'workout',
      reference_id: workoutId,
      content: workoutData,
      caption,
      image_url: imageUrl,
    });
  }

  /**
   * 分享成就到社群
   */
  async shareAchievement(achievementId: string, achievementData: {
    achievement_type: string;
    title: string;
    description?: string;
  }): Promise<Activity> {
    return this.createActivity({
      activity_type: 'achievement',
      reference_id: achievementId,
      content: achievementData
    });
  }

  /**
   * 分享挑戰完成到社群
   */
  async shareChallenge(challengeId: string, challengeData: {
    challenge_name: string;
    progress: number;
    goal: number;
  }): Promise<Activity> {
    return this.createActivity({
      activity_type: 'challenge',
      reference_id: challengeId,
      content: challengeData
    });
  }

  /**
   * 格式化相對時間
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return '剛剛';
    } else if (diffMin < 60) {
      return `${diffMin} 分鐘前`;
    } else if (diffHour < 24) {
      return `${diffHour} 小時前`;
    } else if (diffDay < 7) {
      return `${diffDay} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW', {
        month: 'short',
        day: 'numeric',
      });
    }
  }

  /**
   * 取得動態類型的顯示文字
   */
  getActivityTypeLabel(type: Activity['activity_type']): string {
    const labels: Record<Activity['activity_type'], string> = {
      workout: '完成運動',
      achievement: '獲得成就',
      challenge: '完成挑戰',
    };
    return labels[type] || '動態';
  }

  /**
   * 取得動態類型的圖示
   */
  getActivityTypeEmoji(type: Activity['activity_type']): string {
    const emojis: Record<Activity['activity_type'], string> = {
      workout: '🏃',
      achievement: '🏆',
      challenge: '🎯',
    };
    return emojis[type] || '📝';
  }
}

export const socialService = new SocialService();
