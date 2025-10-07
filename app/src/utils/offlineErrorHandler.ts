/**
 * Offline error handling utilities
 * Handles sync conflicts, network errors, and queue recovery
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_ERROR_QUEUE_KEY = '@offline:error_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Error types for offline operations
 */
export enum OfflineErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  SYNC_CONFLICT = 'SYNC_CONFLICT',
  QUEUE_FULL = 'QUEUE_FULL',
  DATA_CORRUPTION = 'DATA_CORRUPTION',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
}

/**
 * Offline error interface
 */
export interface OfflineError {
  id: string;
  type: OfflineErrorType;
  message: string;
  timestamp: number;
  retryCount: number;
  data?: any;
  resolved: boolean;
}

/**
 * Sync conflict resolution strategies
 */
export enum ConflictResolutionStrategy {
  SERVER_WINS = 'SERVER_WINS',
  CLIENT_WINS = 'CLIENT_WINS',
  MERGE = 'MERGE',
  MANUAL = 'MANUAL',
}

/**
 * Sync conflict interface
 */
export interface SyncConflict {
  id: string;
  resourceType: string;
  resourceId: string;
  clientVersion: any;
  serverVersion: any;
  timestamp: number;
  resolved: boolean;
  resolution?: ConflictResolutionStrategy;
}

/**
 * Network error handler
 */
export class NetworkErrorHandler {
  /**
   * Check if error is network-related
   */
  static isNetworkError(error: any): boolean {
    if (error.message) {
      const networkMessages = [
        'network request failed',
        'network error',
        'timeout',
        'fetch failed',
        'no internet',
        'connection refused',
      ];

      return networkMessages.some(msg =>
        error.message.toLowerCase().includes(msg)
      );
    }

    return false;
  }

  /**
   * Get user-friendly error message
   */
  static getFriendlyMessage(error: any): string {
    if (this.isNetworkError(error)) {
      return '網路連線異常，請檢查您的網路設定';
    }

    if (error.response?.status === 401) {
      return '登入已過期，請重新登入';
    }

    if (error.response?.status === 403) {
      return '您沒有權限執行此操作';
    }

    if (error.response?.status === 404) {
      return '找不到請求的資源';
    }

    if (error.response?.status === 409) {
      return '資料衝突，請稍後再試';
    }

    if (error.response?.status >= 500) {
      return '伺服器發生錯誤，請稍後再試';
    }

    return error.message || '發生未知錯誤';
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: any): boolean {
    // Network errors are retryable
    if (this.isNetworkError(error)) {
      return true;
    }

    // 5xx server errors are retryable
    if (error.response?.status >= 500) {
      return true;
    }

    // Timeout errors are retryable
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return true;
    }

    // 4xx client errors are not retryable (except 408, 429)
    if (error.response?.status >= 400 && error.response?.status < 500) {
      return error.response.status === 408 || error.response.status === 429;
    }

    return false;
  }
}

/**
 * Offline error queue manager
 */
export class OfflineErrorQueue {
  private errors: OfflineError[] = [];
  private initialized = false;

  /**
   * Initialize error queue
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(OFFLINE_ERROR_QUEUE_KEY);
      if (stored) {
        this.errors = JSON.parse(stored);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize error queue:', error);
      this.errors = [];
    }
  }

  /**
   * Add error to queue
   */
  async addError(
    type: OfflineErrorType,
    message: string,
    data?: any
  ): Promise<string> {
    await this.initialize();

    const error: OfflineError = {
      id: `error_${Date.now()}_${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
      retryCount: 0,
      data,
      resolved: false,
    };

    this.errors.push(error);
    await this.persist();

    return error.id;
  }

  /**
   * Get all unresolved errors
   */
  async getUnresolvedErrors(): Promise<OfflineError[]> {
    await this.initialize();
    return this.errors.filter(e => !e.resolved);
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string) {
    await this.initialize();

    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      await this.persist();
    }
  }

  /**
   * Increment retry count
   */
  async incrementRetry(errorId: string): Promise<number> {
    await this.initialize();

    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.retryCount++;
      await this.persist();
      return error.retryCount;
    }

    return 0;
  }

  /**
   * Clear resolved errors
   */
  async clearResolved() {
    await this.initialize();
    this.errors = this.errors.filter(e => !e.resolved);
    await this.persist();
  }

  /**
   * Clear all errors
   */
  async clearAll() {
    this.errors = [];
    await this.persist();
  }

  /**
   * Persist errors to storage
   */
  private async persist() {
    try {
      await AsyncStorage.setItem(
        OFFLINE_ERROR_QUEUE_KEY,
        JSON.stringify(this.errors)
      );
    } catch (error) {
      console.error('Failed to persist error queue:', error);
    }
  }
}

/**
 * Sync conflict resolver
 */
export class SyncConflictResolver {
  private conflicts: SyncConflict[] = [];

  /**
   * Detect conflict between client and server data
   */
  detectConflict(
    resourceType: string,
    resourceId: string,
    clientData: any,
    serverData: any
  ): SyncConflict | null {
    // Simple version-based conflict detection
    if (clientData.version && serverData.version) {
      if (clientData.version !== serverData.version) {
        return {
          id: `conflict_${Date.now()}`,
          resourceType,
          resourceId,
          clientVersion: clientData,
          serverVersion: serverData,
          timestamp: Date.now(),
          resolved: false,
        };
      }
    }

    // Timestamp-based conflict detection
    const clientTimestamp = new Date(clientData.updated_at || clientData.created_at).getTime();
    const serverTimestamp = new Date(serverData.updated_at || serverData.created_at).getTime();

    if (Math.abs(clientTimestamp - serverTimestamp) > 1000) {
      // More than 1 second difference
      return {
        id: `conflict_${Date.now()}`,
        resourceType,
        resourceId,
        clientVersion: clientData,
        serverVersion: serverData,
        timestamp: Date.now(),
        resolved: false,
      };
    }

    return null;
  }

  /**
   * Resolve conflict with strategy
   */
  resolveConflict(
    conflict: SyncConflict,
    strategy: ConflictResolutionStrategy
  ): any {
    switch (strategy) {
      case ConflictResolutionStrategy.SERVER_WINS:
        return conflict.serverVersion;

      case ConflictResolutionStrategy.CLIENT_WINS:
        return conflict.clientVersion;

      case ConflictResolutionStrategy.MERGE:
        return this.mergeVersions(conflict.clientVersion, conflict.serverVersion);

      case ConflictResolutionStrategy.MANUAL:
        // Return conflict for manual resolution
        return conflict;

      default:
        return conflict.serverVersion;
    }
  }

  /**
   * Merge client and server versions
   */
  private mergeVersions(clientData: any, serverData: any): any {
    // Simple merge strategy: prefer newer values
    const merged = { ...serverData };

    for (const key in clientData) {
      if (clientData[key] !== undefined && clientData[key] !== null) {
        // Prefer client data for certain fields
        if (key === 'notes' || key === 'tags' || key === 'metadata') {
          merged[key] = clientData[key];
        }
      }
    }

    return merged;
  }

  /**
   * Get auto-resolution strategy based on conflict type
   */
  getAutoResolutionStrategy(conflict: SyncConflict): ConflictResolutionStrategy {
    // For workouts, prefer client data (user's device is source of truth)
    if (conflict.resourceType === 'workout') {
      return ConflictResolutionStrategy.CLIENT_WINS;
    }

    // For achievements, prefer server data (server is authoritative)
    if (conflict.resourceType === 'achievement') {
      return ConflictResolutionStrategy.SERVER_WINS;
    }

    // For user profile, merge both versions
    if (conflict.resourceType === 'user') {
      return ConflictResolutionStrategy.MERGE;
    }

    // Default: server wins
    return ConflictResolutionStrategy.SERVER_WINS;
  }
}

/**
 * Retry manager with exponential backoff
 */
export class RetryManager {
  /**
   * Retry operation with exponential backoff
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = MAX_RETRY_ATTEMPTS,
    delayMs: number = RETRY_DELAY_MS,
    onRetry?: (attempt: number, error: any) => void
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if not retryable
        if (!NetworkErrorHandler.isRetryable(error)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = delayMs * Math.pow(2, attempt - 1);

          onRetry?.(attempt, error);

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Retry with network check
   */
  async retryWithNetworkCheck<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number) => void
  ): Promise<T> {
    return this.retry(
      async () => {
        // Check network connectivity before retry
        const netInfo = await NetInfo.fetch();

        if (!netInfo.isConnected) {
          throw new Error('No network connection');
        }

        return await operation();
      },
      MAX_RETRY_ATTEMPTS,
      RETRY_DELAY_MS,
      onRetry
    );
  }
}

/**
 * Global instances
 */
export const offlineErrorQueue = new OfflineErrorQueue();
export const syncConflictResolver = new SyncConflictResolver();
export const retryManager = new RetryManager();

/**
 * User-friendly error messages in Traditional Chinese
 */
export const ErrorMessages = {
  NETWORK_ERROR: '網路連線異常，請檢查您的網路設定',
  SYNC_CONFLICT: '資料同步發生衝突，請重新整理後再試',
  QUEUE_FULL: '離線佇列已滿，請連線後同步資料',
  DATA_CORRUPTION: '資料損壞，請重新載入應用程式',
  SERVER_ERROR: '伺服器發生錯誤，請稍後再試',
  TIMEOUT: '連線逾時，請稍後再試',
  AUTH_ERROR: '登入已過期，請重新登入',
  UNAUTHORIZED: '您沒有權限執行此操作',
  NOT_FOUND: '找不到請求的資源',
  UNKNOWN: '發生未知錯誤，請稍後再試',
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  if (NetworkErrorHandler.isNetworkError(error)) {
    return ErrorMessages.NETWORK_ERROR;
  }

  if (error.type && ErrorMessages[error.type as keyof typeof ErrorMessages]) {
    return ErrorMessages[error.type as keyof typeof ErrorMessages];
  }

  return NetworkErrorHandler.getFriendlyMessage(error);
}

/**
 * Usage examples:
 *
 * 1. Handle network error with retry:
 *    try {
 *      await retryManager.retryWithNetworkCheck(
 *        () => api.createWorkout(data)
 *      );
 *    } catch (error) {
 *      showError(getUserFriendlyError(error));
 *    }
 *
 * 2. Handle sync conflict:
 *    const conflict = syncConflictResolver.detectConflict(
 *      'workout',
 *      workoutId,
 *      localData,
 *      serverData
 *    );
 *
 *    if (conflict) {
 *      const strategy = syncConflictResolver.getAutoResolutionStrategy(conflict);
 *      const resolved = syncConflictResolver.resolveConflict(conflict, strategy);
 *      return resolved;
 *    }
 *
 * 3. Track offline errors:
 *    await offlineErrorQueue.addError(
 *      OfflineErrorType.NETWORK_ERROR,
 *      'Failed to sync workout',
 *      { workoutId }
 *    );
 */
