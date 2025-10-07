/**
 * T101: User Types
 * 使用者相關的 TypeScript 類型定義
 */

export interface PrivacySettings {
  share_location: boolean;
  share_detailed_stats: boolean;
  public_profile: boolean;
}

export interface UserPreferences {
  language: 'zh-TW' | 'en' | 'ja';
  measurement_unit: 'metric' | 'imperial';
  notification_enabled: boolean;
}

export interface Subscription {
  tier: 'free' | 'premium';
  expires_at: string | null;
}

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  privacy_settings: PrivacySettings;
  preferences: UserPreferences;
  subscription: Subscription;
  deleted_at?: string | null;
  deletion_scheduled?: boolean;
}

export interface UserProfile extends User {
  // Extended user profile for settings screen
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface GoogleAuthRequest {
  id_token: string;
}
