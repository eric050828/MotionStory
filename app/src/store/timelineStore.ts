
import { create } from 'zustand';
import React from 'react';
import { TimelineEvent, TimelineGroup, TimelineFilters } from '../types/timeline';

// Mock Data
const mockTimelineGroups: TimelineGroup[] = [
  {
    date: '2023-10-27',
    events: [
      { id: '1', date: '2023-10-27', type: 'workout', title: 'Morning Run', description: '5km run in the park.', icon: 'run', data: {} },
      { id: '2', date: '2023-10-27', type: 'achievement', title: '5km Club', description: 'Unlocked the 5km running achievement.', icon: 'award', data: {} },
    ],
  },
  {
    date: '2023-10-26',
    events: [
      { id: '3', date: '2023-10-26', type: 'milestone', title: '10-day streak', description: 'Completed a 10-day workout streak.', icon: 'milestone', data: {} },
      { id: '4', date: '2023-10-26', type: 'workout', title: 'Gym Session', description: 'Weightlifting and cardio.', icon: 'weight', data: {} },
    ],
  },
  {
    date: '2023-10-25',
    events: [
        { id: '5', date: '2023-10-25', type: 'workout', title: 'Cycling', description: '20km cycling.', icon: 'bike', data: {} },
    ],
  },
];


interface TimelineState {
  groups: TimelineGroup[];
  loading: boolean;
  error: Error | null;
  filters: TimelineFilters;
  fetchTimeline: (filters: TimelineFilters) => Promise<void>;
  setFilters: (filters: TimelineFilters) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  groups: [],
  loading: false,
  error: null,
  filters: {},
  fetchTimeline: async (filters: TimelineFilters) => {
    set({ loading: true, error: null });
    try {
      // In a real app, you'd fetch this from an API
      // For now, we're just using mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      set({ groups: mockTimelineGroups, loading: false });
    } catch (error: any) {
      set({ error, loading: false });
    }
  },
  setFilters: (filters: TimelineFilters) => {
    set({ filters });
    get().fetchTimeline(filters);
  },
}));
