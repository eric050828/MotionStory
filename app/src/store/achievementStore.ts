/**
 * T121: Achievement Store
 * 成就清單、慶祝觸發管理
 */

import { create } from 'zustand';
import {
  Achievement,
  AchievementProgress,
  ShareCard,
  CreateShareCardRequest,
  AchievementNotification,
  CelebrationLevel,
} from '../types/achievement';
import achievementService from '../services/achievementService';

interface AchievementState {
  // Data
  achievements: Achievement[];
  progress: AchievementProgress[];
  shareCards: ShareCard[];

  // UI State
  loading: boolean;
  error: string | null;

  // Celebration State
  pendingCelebration: AchievementNotification | null;
  celebrationQueue: AchievementNotification[];
  isCelebrating: boolean;

  // Actions
  fetchAchievements: () => Promise<void>;
  fetchProgress: () => Promise<void>;
  checkAchievements: (workoutId: string) => Promise<void>;
  createShareCard: (data: CreateShareCardRequest) => Promise<ShareCard>;
  fetchShareCards: () => Promise<void>;
  deleteShareCard: (id: string) => Promise<void>;

  // Celebration Actions
  showCelebration: (notification: AchievementNotification) => void;
  dismissCelebration: () => void;
  processNextCelebration: () => void;
  clearCelebrationQueue: () => void;

  // Utility
  clearError: () => void;
  reset: () => void;
}

const useAchievementStore = create<AchievementState>((set, get) => ({
  // Initial State
  achievements: [],
  progress: [],
  shareCards: [],
  loading: false,
  error: null,
  pendingCelebration: null,
  celebrationQueue: [],
  isCelebrating: false,

  // Fetch Achievements
  fetchAchievements: async () => {
    set({ loading: true, error: null });

    try {
      const response = await achievementService.getAchievements();
      set({ achievements: response.achievements, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch achievements', loading: false });
    }
  },

  // Fetch Progress
  fetchProgress: async () => {
    set({ loading: true, error: null });

    try {
      const progress = await achievementService.getAchievementProgress();
      set({ progress, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch progress', loading: false });
    }
  },

  // Check Achievements (after workout)
  checkAchievements: async (workoutId: string) => {
    try {
      const notifications = await achievementService.checkAchievements(workoutId);

      if (notifications.length > 0) {
        // Add to celebration queue
        set((state) => ({
          celebrationQueue: [...state.celebrationQueue, ...notifications],
        }));

        // Start celebrating if not already
        if (!get().isCelebrating) {
          get().processNextCelebration();
        }

        // Refresh achievements list
        await get().fetchAchievements();
      }
    } catch (error: any) {
      console.error('Failed to check achievements:', error);
      // Don't set error state for achievement checks (silent fail)
    }
  },

  // Create Share Card
  createShareCard: async (data: CreateShareCardRequest) => {
    set({ loading: true, error: null });

    try {
      const shareCard = await achievementService.createShareCard(data);

      set((state) => ({
        shareCards: [shareCard, ...state.shareCards],
        loading: false,
      }));

      // Mark achievement as shared
      await achievementService.markAsShared(data.achievement_id, shareCard.id);

      // Update achievement in list
      set((state) => ({
        achievements: state.achievements.map((a) =>
          a.id === data.achievement_id
            ? { ...a, shared: true, share_card_id: shareCard.id }
            : a
        ),
      }));

      return shareCard;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create share card', loading: false });
      throw error;
    }
  },

  // Fetch Share Cards
  fetchShareCards: async () => {
    set({ loading: true, error: null });

    try {
      const response = await achievementService.getShareCards();
      set({ shareCards: response.cards, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch share cards', loading: false });
    }
  },

  // Delete Share Card
  deleteShareCard: async (id: string) => {
    set({ loading: true, error: null });

    try {
      await achievementService.deleteShareCard(id);

      set((state) => ({
        shareCards: state.shareCards.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete share card', loading: false });
    }
  },

  // Show Celebration
  showCelebration: (notification: AchievementNotification) => {
    set({
      pendingCelebration: notification,
      isCelebrating: true,
    });
  },

  // Dismiss Celebration
  dismissCelebration: () => {
    set({
      pendingCelebration: null,
      isCelebrating: false,
    });

    // Process next celebration in queue
    setTimeout(() => {
      get().processNextCelebration();
    }, 500); // Small delay before next celebration
  },

  // Process Next Celebration
  processNextCelebration: () => {
    const { celebrationQueue, isCelebrating } = get();

    if (celebrationQueue.length === 0 || isCelebrating) {
      return;
    }

    const [next, ...remaining] = celebrationQueue;

    set({
      celebrationQueue: remaining,
      pendingCelebration: next,
      isCelebrating: true,
    });
  },

  // Clear Celebration Queue
  clearCelebrationQueue: () => {
    set({
      celebrationQueue: [],
      pendingCelebration: null,
      isCelebrating: false,
    });
  },

  // Clear Error
  clearError: () => set({ error: null }),

  // Reset Store
  reset: () =>
    set({
      achievements: [],
      progress: [],
      shareCards: [],
      loading: false,
      error: null,
      pendingCelebration: null,
      celebrationQueue: [],
      isCelebrating: false,
    }),
}));

export default useAchievementStore;
