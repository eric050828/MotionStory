/**
 * T117: Offline Queue
 * 管理離線時的操作佇列
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple EventEmitter implementation for React Native
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  off(event: string, listener: Function): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }

  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'workout' | 'achievement' | 'dashboard';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

const QUEUE_STORAGE_KEY = '@offline_queue';
const MAX_RETRY = 3;
const MAX_QUEUE_SIZE = 1000;

class OfflineQueue extends EventEmitter {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;

  /**
   * Initialize queue from storage
   */
  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`✅ Loaded ${this.queue.length} queued operations`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Add operation to queue
   */
  async enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest completed/failed operations
      this.queue = this.queue.filter(
        (op) => op.status === 'pending' || op.status === 'processing'
      );

      if (this.queue.length >= MAX_QUEUE_SIZE) {
        throw new Error('Offline queue is full');
      }
    }

    const queuedOp: QueuedOperation = {
      ...operation,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(queuedOp);
    await this.persist();

    this.emit('enqueued', queuedOp);
    console.log(`➕ Enqueued ${operation.type} operation for ${operation.entity}`);

    return queuedOp.id;
  }

  /**
   * Process queue (execute pending operations)
   */
  async processQueue(executor: (op: QueuedOperation) => Promise<void>): Promise<{
    completed: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      console.log('⏳ Queue already processing, skipping...');
      return { completed: 0, failed: 0 };
    }

    this.isProcessing = true;
    let completed = 0;
    let failed = 0;

    try {
      const pendingOps = this.queue.filter((op) => op.status === 'pending');

      for (const op of pendingOps) {
        try {
          op.status = 'processing';
          await this.persist();

          await executor(op);

          op.status = 'completed';
          completed++;

          this.emit('operationCompleted', op);
        } catch (error: any) {
          op.retryCount++;
          op.error = error.message;

          if (op.retryCount >= MAX_RETRY) {
            op.status = 'failed';
            failed++;
            this.emit('operationFailed', op);
          } else {
            op.status = 'pending';
            this.emit('operationRetry', op);
          }

          console.error(`❌ Operation ${op.id} failed (retry ${op.retryCount}):`, error);
        }

        await this.persist();
      }

      // Clean up completed operations older than 24 hours
      await this.cleanup();
    } finally {
      this.isProcessing = false;
    }

    return { completed, failed };
  }

  /**
   * Get queue status
   */
  getStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter((op) => op.status === 'pending').length,
      processing: this.queue.filter((op) => op.status === 'processing').length,
      completed: this.queue.filter((op) => op.status === 'completed').length,
      failed: this.queue.filter((op) => op.status === 'failed').length,
    };
  }

  /**
   * Get all pending operations
   */
  getPendingOperations(): QueuedOperation[] {
    return this.queue.filter((op) => op.status === 'pending');
  }

  /**
   * Get all failed operations
   */
  getFailedOperations(): QueuedOperation[] {
    return this.queue.filter((op) => op.status === 'failed');
  }

  /**
   * Retry failed operation
   */
  async retryOperation(id: string): Promise<void> {
    const op = this.queue.find((o) => o.id === id);
    if (!op) {
      throw new Error('Operation not found');
    }

    if (op.status !== 'failed') {
      throw new Error('Only failed operations can be retried');
    }

    op.status = 'pending';
    op.retryCount = 0;
    op.error = undefined;

    await this.persist();
    this.emit('operationRetried', op);
  }

  /**
   * Retry all failed operations
   */
  async retryAllFailed(): Promise<void> {
    const failedOps = this.getFailedOperations();

    for (const op of failedOps) {
      op.status = 'pending';
      op.retryCount = 0;
      op.error = undefined;
    }

    await this.persist();
    this.emit('allFailedRetried', failedOps.length);
  }

  /**
   * Remove operation from queue
   */
  async removeOperation(id: string): Promise<void> {
    const index = this.queue.findIndex((op) => op.id === id);
    if (index === -1) {
      throw new Error('Operation not found');
    }

    const op = this.queue[index];
    this.queue.splice(index, 1);
    await this.persist();

    this.emit('operationRemoved', op);
  }

  /**
   * Clear completed operations
   */
  async clearCompleted(): Promise<number> {
    const completedCount = this.queue.filter((op) => op.status === 'completed').length;
    this.queue = this.queue.filter((op) => op.status !== 'completed');
    await this.persist();

    this.emit('completedCleared', completedCount);
    return completedCount;
  }

  /**
   * Clear all operations
   */
  async clearAll(): Promise<void> {
    this.queue = [];
    await this.persist();
    this.emit('allCleared');
  }

  /**
   * Get operation by ID
   */
  getOperation(id: string): QueuedOperation | undefined {
    return this.queue.find((op) => op.id === id);
  }

  /**
   * Get operations by entity type
   */
  getOperationsByEntity(entity: 'workout' | 'achievement' | 'dashboard'): QueuedOperation[] {
    return this.queue.filter((op) => op.entity === entity);
  }

  /**
   * Cleanup old completed operations
   */
  private async cleanup(): Promise<void> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const beforeCount = this.queue.length;

    this.queue = this.queue.filter((op) => {
      if (op.status === 'completed') {
        const opTime = new Date(op.timestamp);
        return opTime > oneDayAgo;
      }
      return true;
    });

    const removed = beforeCount - this.queue.length;

    if (removed > 0) {
      await this.persist();
      console.log(`🗑️ Cleaned up ${removed} old completed operations`);
    }
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  /**
   * Generate unique operation ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue size in bytes
   */
  async getQueueSize(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return stored ? new Blob([stored]).size : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Export queue for debugging
   */
  exportQueue(): string {
    return JSON.stringify(this.queue, null, 2);
  }

  /**
   * Import queue (for testing/recovery)
   */
  async importQueue(queueData: string): Promise<void> {
    try {
      const imported = JSON.parse(queueData) as QueuedOperation[];
      this.queue = imported;
      await this.persist();
      console.log(`✅ Imported ${imported.length} operations`);
    } catch (error) {
      throw new Error('Invalid queue data format');
    }
  }
}

export default new OfflineQueue();
