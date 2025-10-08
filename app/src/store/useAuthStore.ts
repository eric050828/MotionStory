/**
 * Auth Store
 * 管理使用者認證狀態
 */

import { create } from 'zustand';
import { api } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

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
      
      console.log('🔥 Step 1: Creating Firebase user...');
      // Step 1: Create user in Firebase
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const firebaseUser = userCredential.user;
      
      console.log('🔥 Step 2: Updating Firebase profile...');
      // Step 2: Update Firebase profile with display name
      await firebaseUser.updateProfile({
        displayName: displayName,
      });
      
      console.log('🔥 Step 3: Getting Firebase ID token...');
      // Step 3: Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      console.log('🔥 Step 4: Registering with backend...');
      console.log('Firebase UID:', firebaseUser.uid);
      // Step 4: Register with backend using Firebase UID
      const response = await api.register(email, password, displayName, firebaseUser.uid);
      
      console.log('✅ Registration successful!');
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      
      // Handle Firebase errors
      let errorMessage = 'Registration failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email 已被註冊';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '密碼強度不足';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email 格式錯誤';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({
        error: errorMessage,
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
