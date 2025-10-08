/**
 * Auth Store
 * 管理使用者認證狀態
 */

import { create } from 'zustand';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  privacy_settings: {
    share_location: boolean;
    share_detailed_stats: boolean;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updatePrivacySettings: (settings: any) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.login(email, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  googleLogin: async (idToken: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.googleLogin(idToken);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Google login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.register(email, password, displayName);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('access_token');
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const user = await api.getCurrentUser();
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updatePrivacySettings: async (settings: any) => {
    try {
      const user = await api.updatePrivacySettings(settings);
      set({ user });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Update failed' });
      throw error;
    }
  },
}));
