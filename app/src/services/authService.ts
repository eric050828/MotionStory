/**
 * T107: Auth API Service
 * 認證相關的 API 呼叫服務
 */

import axios, { AxiosInstance } from 'axios';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  GoogleAuthRequest,
  User,
  UserProfile,
  PrivacySettings,
} from '../types/user';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class AuthService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear token and redirect to login
          this.clearToken();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Register new user with email/password
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  /**
   * Login with email/password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const data: GoogleAuthRequest = { id_token: idToken };
    const response = await this.api.post<AuthResponse>('/auth/google', data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  /**
   * Refresh JWT token using Firebase ID token
   */
  async refreshToken(firebaseIdToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await this.api.post('/auth/refresh', {
      firebase_id_token: firebaseIdToken,
    });
    this.setToken(response.data.access_token);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.api.get<User>('/auth/me');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateUser(data: {
    display_name?: string;
    privacy_settings?: PrivacySettings;
  }): Promise<User> {
    const response = await this.api.put<User>('/auth/me', data);
    return response.data;
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<{
    message: string;
    privacy_settings: PrivacySettings;
  }> {
    const response = await this.api.put('/auth/me/privacy', settings);
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    await this.api.delete('/auth/delete');
    this.clearToken();
  }

  /**
   * Logout user (clear local token)
   */
  logout() {
    this.clearToken();
  }
}

export default new AuthService();
