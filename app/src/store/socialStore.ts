/**
 * Social Store
 * 社群功能狀態管理
 */

import { create } from 'zustand';
import type { Activity, Comment } from '../types/social';
import { socialService } from '../services/socialService';

interface SocialState {
  // Data
  activities: Activity[];
  comments: Record<string, Comment[]>; // activityId -> comments

  // Pagination
  nextCursor: string | null;
  hasMore: boolean;

  // UI State
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;

  // Comment UI State
  commentsLoading: Record<string, boolean>; // activityId -> loading

  // Actions
  fetchFeed: (refresh?: boolean) => Promise<void>;
  loadMoreFeed: () => Promise<void>;
  toggleLike: (activityId: string) => Promise<void>;
  fetchComments: (activityId: string) => Promise<void>;
  addComment: (activityId: string, content: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  // Initial State
  activities: [],
  comments: {},
  nextCursor: null,
  hasMore: true,
  loading: false,
  loadingMore: false,
  refreshing: false,
  error: null,
  commentsLoading: {},

  /**
   * 取得動態牆
   */
  fetchFeed: async (refresh = false) => {
    if (refresh) {
      set({ refreshing: true });
    } else {
      set({ loading: true });
    }
    set({ error: null });

    try {
      const response = await socialService.getFeed({ limit: 20 });
      set({
        activities: response.activities,
        nextCursor: response.next_cursor,
        hasMore: response.has_more,
        loading: false,
        refreshing: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || '無法載入動態牆',
        loading: false,
        refreshing: false,
      });
    }
  },

  /**
   * 載入更多動態
   */
  loadMoreFeed: async () => {
    const { nextCursor, hasMore, loadingMore } = get();
    if (!hasMore || loadingMore || !nextCursor) return;

    set({ loadingMore: true, error: null });

    try {
      const response = await socialService.getFeed({ limit: 20, cursor: nextCursor });
      set((state) => ({
        activities: [...state.activities, ...response.activities],
        nextCursor: response.next_cursor,
        hasMore: response.has_more,
        loadingMore: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || '無法載入更多',
        loadingMore: false,
      });
    }
  },

  /**
   * 切換按讚（樂觀更新）
   */
  toggleLike: async (activityId: string) => {
    const activity = get().activities.find((a) => a.activity_id === activityId);
    if (!activity) return;

    const wasLiked = activity.is_liked_by_me;

    // 樂觀更新
    set((state) => ({
      activities: state.activities.map((a) =>
        a.activity_id === activityId
          ? {
              ...a,
              is_liked_by_me: !wasLiked,
              likes_count: wasLiked ? a.likes_count - 1 : a.likes_count + 1,
            }
          : a
      ),
    }));

    try {
      if (wasLiked) {
        await socialService.unlikeActivity(activityId);
      } else {
        await socialService.likeActivity(activityId);
      }
    } catch (error) {
      // 回滾
      set((state) => ({
        activities: state.activities.map((a) =>
          a.activity_id === activityId
            ? {
                ...a,
                is_liked_by_me: wasLiked,
                likes_count: wasLiked ? a.likes_count + 1 : a.likes_count - 1,
              }
            : a
        ),
      }));
    }
  },

  /**
   * 取得留言
   */
  fetchComments: async (activityId: string) => {
    set((state) => ({
      commentsLoading: { ...state.commentsLoading, [activityId]: true },
    }));

    try {
      const response = await socialService.getComments(activityId);

      set((state) => ({
        comments: { ...state.comments, [activityId]: response.comments },
        commentsLoading: { ...state.commentsLoading, [activityId]: false },
      }));
    } catch (error: any) {
      set((state) => ({
        commentsLoading: { ...state.commentsLoading, [activityId]: false },
        error: error.response?.data?.detail || error.message || '無法載入留言',
      }));
    }
  },

  /**
   * 新增留言
   */
  addComment: async (activityId: string, content: string) => {
    try {
      const newComment = await socialService.createComment(activityId, { content });

      set((state) => ({
        // 更新留言列表
        comments: {
          ...state.comments,
          [activityId]: [newComment, ...(state.comments[activityId] || [])],
        },
        // 更新動態的留言數
        activities: state.activities.map((a) =>
          a.activity_id === activityId
            ? { ...a, comments_count: a.comments_count + 1 }
            : a
        ),
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || '無法新增留言';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      activities: [],
      comments: {},
      nextCursor: null,
      hasMore: true,
      loading: false,
      loadingMore: false,
      refreshing: false,
      error: null,
      commentsLoading: {},
    }),
}));
