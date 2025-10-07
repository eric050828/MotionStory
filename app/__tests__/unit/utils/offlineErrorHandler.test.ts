/**
 * Tests for offline error handler
 */
import {
  NetworkErrorHandler,
  OfflineErrorQueue,
  SyncConflictResolver,
  RetryManager,
  OfflineErrorType,
  ConflictResolutionStrategy,
  getUserFriendlyError,
} from '@/utils/offlineErrorHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

describe('NetworkErrorHandler', () => {
  describe('isNetworkError', () => {
    it('should detect network errors', () => {
      const networkErrors = [
        new Error('Network request failed'),
        new Error('Fetch failed'),
        new Error('Timeout'),
        new Error('No internet connection'),
      ];

      networkErrors.forEach(error => {
        expect(NetworkErrorHandler.isNetworkError(error)).toBe(true);
      });
    });

    it('should not detect non-network errors', () => {
      const nonNetworkErrors = [
        new Error('Validation failed'),
        new Error('Resource not found'),
      ];

      nonNetworkErrors.forEach(error => {
        expect(NetworkErrorHandler.isNetworkError(error)).toBe(false);
      });
    });
  });

  describe('getFriendlyMessage', () => {
    it('should return friendly message for network errors', () => {
      const error = new Error('Network request failed');
      const message = NetworkErrorHandler.getFriendlyMessage(error);

      expect(message).toBe('網路連線異常，請檢查您的網路設定');
    });

    it('should return friendly message for 401 errors', () => {
      const error = { response: { status: 401 } };
      const message = NetworkErrorHandler.getFriendlyMessage(error);

      expect(message).toBe('登入已過期，請重新登入');
    });

    it('should return friendly message for 404 errors', () => {
      const error = { response: { status: 404 } };
      const message = NetworkErrorHandler.getFriendlyMessage(error);

      expect(message).toBe('找不到請求的資源');
    });

    it('should return friendly message for 500 errors', () => {
      const error = { response: { status: 500 } };
      const message = NetworkErrorHandler.getFriendlyMessage(error);

      expect(message).toBe('伺服器發生錯誤，請稍後再試');
    });
  });

  describe('isRetryable', () => {
    it('should mark network errors as retryable', () => {
      const error = new Error('Network request failed');
      expect(NetworkErrorHandler.isRetryable(error)).toBe(true);
    });

    it('should mark 5xx errors as retryable', () => {
      const error = { response: { status: 500 } };
      expect(NetworkErrorHandler.isRetryable(error)).toBe(true);
    });

    it('should mark timeout errors as retryable', () => {
      const error = { code: 'ECONNABORTED' };
      expect(NetworkErrorHandler.isRetryable(error)).toBe(true);
    });

    it('should not mark 4xx errors as retryable (except 408, 429)', () => {
      const error400 = { response: { status: 400 } };
      const error404 = { response: { status: 404 } };
      const error408 = { response: { status: 408 } };
      const error429 = { response: { status: 429 } };

      expect(NetworkErrorHandler.isRetryable(error400)).toBe(false);
      expect(NetworkErrorHandler.isRetryable(error404)).toBe(false);
      expect(NetworkErrorHandler.isRetryable(error408)).toBe(true);
      expect(NetworkErrorHandler.isRetryable(error429)).toBe(true);
    });
  });
});

describe('OfflineErrorQueue', () => {
  let queue: OfflineErrorQueue;

  beforeEach(() => {
    queue = new OfflineErrorQueue();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('addError', () => {
    it('should add error to queue', async () => {
      const errorId = await queue.addError(
        OfflineErrorType.NETWORK_ERROR,
        'Test error',
        { workoutId: '123' }
      );

      expect(errorId).toBeTruthy();
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getUnresolvedErrors', () => {
    it('should return unresolved errors', async () => {
      await queue.addError(OfflineErrorType.NETWORK_ERROR, 'Error 1');
      await queue.addError(OfflineErrorType.SYNC_CONFLICT, 'Error 2');

      const errors = await queue.getUnresolvedErrors();

      expect(errors.length).toBe(2);
      expect(errors.every(e => !e.resolved)).toBe(true);
    });
  });

  describe('resolveError', () => {
    it('should mark error as resolved', async () => {
      const errorId = await queue.addError(
        OfflineErrorType.NETWORK_ERROR,
        'Test error'
      );

      await queue.resolveError(errorId);

      const unresolvedErrors = await queue.getUnresolvedErrors();
      expect(unresolvedErrors.length).toBe(0);
    });
  });

  describe('incrementRetry', () => {
    it('should increment retry count', async () => {
      const errorId = await queue.addError(
        OfflineErrorType.NETWORK_ERROR,
        'Test error'
      );

      const count1 = await queue.incrementRetry(errorId);
      const count2 = await queue.incrementRetry(errorId);

      expect(count1).toBe(1);
      expect(count2).toBe(2);
    });
  });

  describe('clearResolved', () => {
    it('should clear resolved errors', async () => {
      const errorId1 = await queue.addError(
        OfflineErrorType.NETWORK_ERROR,
        'Error 1'
      );
      const errorId2 = await queue.addError(
        OfflineErrorType.NETWORK_ERROR,
        'Error 2'
      );

      await queue.resolveError(errorId1);
      await queue.clearResolved();

      const errors = await queue.getUnresolvedErrors();
      expect(errors.length).toBe(1);
    });
  });
});

describe('SyncConflictResolver', () => {
  let resolver: SyncConflictResolver;

  beforeEach(() => {
    resolver = new SyncConflictResolver();
  });

  describe('detectConflict', () => {
    it('should detect version-based conflict', () => {
      const clientData = { version: 1, name: 'Client' };
      const serverData = { version: 2, name: 'Server' };

      const conflict = resolver.detectConflict(
        'workout',
        '123',
        clientData,
        serverData
      );

      expect(conflict).not.toBeNull();
      expect(conflict?.resourceType).toBe('workout');
      expect(conflict?.resourceId).toBe('123');
    });

    it('should detect timestamp-based conflict', () => {
      const now = new Date();
      const earlier = new Date(now.getTime() - 5000); // 5 seconds earlier

      const clientData = { updated_at: earlier.toISOString() };
      const serverData = { updated_at: now.toISOString() };

      const conflict = resolver.detectConflict(
        'workout',
        '123',
        clientData,
        serverData
      );

      expect(conflict).not.toBeNull();
    });

    it('should not detect conflict for identical data', () => {
      const now = new Date().toISOString();
      const clientData = { version: 1, updated_at: now };
      const serverData = { version: 1, updated_at: now };

      const conflict = resolver.detectConflict(
        'workout',
        '123',
        clientData,
        serverData
      );

      expect(conflict).toBeNull();
    });
  });

  describe('resolveConflict', () => {
    const conflict = {
      id: 'conflict1',
      resourceType: 'workout',
      resourceId: '123',
      clientVersion: { name: 'Client', duration: 30 },
      serverVersion: { name: 'Server', duration: 45 },
      timestamp: Date.now(),
      resolved: false,
    };

    it('should resolve with SERVER_WINS strategy', () => {
      const resolved = resolver.resolveConflict(
        conflict,
        ConflictResolutionStrategy.SERVER_WINS
      );

      expect(resolved).toEqual(conflict.serverVersion);
    });

    it('should resolve with CLIENT_WINS strategy', () => {
      const resolved = resolver.resolveConflict(
        conflict,
        ConflictResolutionStrategy.CLIENT_WINS
      );

      expect(resolved).toEqual(conflict.clientVersion);
    });

    it('should resolve with MERGE strategy', () => {
      const resolved = resolver.resolveConflict(
        conflict,
        ConflictResolutionStrategy.MERGE
      );

      expect(resolved).toBeDefined();
      // Merged version should have properties from both
      expect(resolved.name).toBeDefined();
      expect(resolved.duration).toBeDefined();
    });

    it('should return conflict for MANUAL strategy', () => {
      const resolved = resolver.resolveConflict(
        conflict,
        ConflictResolutionStrategy.MANUAL
      );

      expect(resolved).toEqual(conflict);
    });
  });

  describe('getAutoResolutionStrategy', () => {
    it('should prefer CLIENT_WINS for workouts', () => {
      const conflict = {
        id: 'conflict1',
        resourceType: 'workout',
        resourceId: '123',
        clientVersion: {},
        serverVersion: {},
        timestamp: Date.now(),
        resolved: false,
      };

      const strategy = resolver.getAutoResolutionStrategy(conflict);

      expect(strategy).toBe(ConflictResolutionStrategy.CLIENT_WINS);
    });

    it('should prefer SERVER_WINS for achievements', () => {
      const conflict = {
        id: 'conflict1',
        resourceType: 'achievement',
        resourceId: '123',
        clientVersion: {},
        serverVersion: {},
        timestamp: Date.now(),
        resolved: false,
      };

      const strategy = resolver.getAutoResolutionStrategy(conflict);

      expect(strategy).toBe(ConflictResolutionStrategy.SERVER_WINS);
    });

    it('should prefer MERGE for user data', () => {
      const conflict = {
        id: 'conflict1',
        resourceType: 'user',
        resourceId: '123',
        clientVersion: {},
        serverVersion: {},
        timestamp: Date.now(),
        resolved: false,
      };

      const strategy = resolver.getAutoResolutionStrategy(conflict);

      expect(strategy).toBe(ConflictResolutionStrategy.MERGE);
    });
  });
});

describe('RetryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    retryManager = new RetryManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await retryManager.retry(operation, 3, 1000);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValue('success');

      const retryPromise = retryManager.retry(operation, 3, 100);

      // Fast-forward timers
      jest.runAllTimers();

      const result = await retryPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue({ response: { status: 404 } });

      await expect(retryManager.retry(operation, 3, 100)).rejects.toEqual({
        response: { status: 404 },
      });

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw after max attempts', async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error('Network request failed'));

      const retryPromise = retryManager.retry(operation, 3, 100);

      jest.runAllTimers();

      await expect(retryPromise).rejects.toThrow('Network request failed');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network request failed'))
        .mockResolvedValue('success');

      const onRetry = jest.fn();

      const retryPromise = retryManager.retry(operation, 3, 100, onRetry);

      jest.runAllTimers();

      await retryPromise;

      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });
  });
});

describe('getUserFriendlyError', () => {
  it('should return friendly message for network errors', () => {
    const error = new Error('Network request failed');
    const message = getUserFriendlyError(error);

    expect(message).toBe('網路連線異常，請檢查您的網路設定');
  });

  it('should return friendly message for typed errors', () => {
    const error = { type: OfflineErrorType.SYNC_CONFLICT };
    const message = getUserFriendlyError(error);

    expect(message).toBe('資料同步發生衝突，請重新整理後再試');
  });

  it('should fallback to error message', () => {
    const error = new Error('Custom error message');
    const message = getUserFriendlyError(error);

    expect(message).toBe('Custom error message');
  });
});
