/**
 * T115: Network Monitor
 * 監控網路狀態變化並觸發同步
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import { EventEmitter } from 'events';

export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  status: NetworkStatus;
  effectiveType?: string;
}

class NetworkMonitor extends EventEmitter {
  private subscription: NetInfoSubscription | null = null;
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: null,
    status: 'offline',
  };

  /**
   * Start monitoring network changes
   */
  start(): void {
    if (this.subscription) {
      console.warn('Network monitor already started');
      return;
    }

    this.subscription = NetInfo.addEventListener((state: NetInfoState) => {
      const newState = this.parseNetworkState(state);
      const oldStatus = this.currentState.status;
      const newStatus = newState.status;

      this.currentState = newState;

      // Emit status change events
      if (oldStatus !== newStatus) {
        this.emit('statusChange', newStatus, oldStatus);

        if (newStatus === 'online' && oldStatus === 'offline') {
          this.emit('online');
        } else if (newStatus === 'offline' && oldStatus !== 'offline') {
          this.emit('offline');
        }
      }

      // Emit general state change
      this.emit('stateChange', newState);
    });

    // Fetch initial state
    NetInfo.fetch().then((state) => {
      this.currentState = this.parseNetworkState(state);
      this.emit('stateChange', this.currentState);
    });

    console.log('✅ Network monitor started');
  }

  /**
   * Stop monitoring network changes
   */
  stop(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
      console.log('⏹️ Network monitor stopped');
    }
  }

  /**
   * Get current network state
   */
  getState(): NetworkState {
    return { ...this.currentState };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentState.status === 'online';
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return this.currentState.status === 'offline';
  }

  /**
   * Check if connection is slow
   */
  isSlow(): boolean {
    return this.currentState.status === 'slow';
  }

  /**
   * Fetch current network state (one-time check)
   */
  async fetch(): Promise<NetworkState> {
    const state = await NetInfo.fetch();
    return this.parseNetworkState(state);
  }

  /**
   * Parse NetInfo state to our NetworkState format
   */
  private parseNetworkState(state: NetInfoState): NetworkState {
    const isConnected = state.isConnected ?? false;
    const isInternetReachable = state.isInternetReachable;
    const type = state.type;

    // Determine network status
    let status: NetworkStatus = 'offline';

    if (isConnected && isInternetReachable) {
      status = 'online';

      // Check for slow connection
      if (state.details) {
        const details = state.details as any;

        // Cellular: 2G is slow
        if (type === 'cellular' && details.cellularGeneration === '2g') {
          status = 'slow';
        }

        // WiFi: check effective type if available
        if (type === 'wifi' && details.effectiveConnectionType) {
          if (details.effectiveConnectionType === '2g' || details.effectiveConnectionType === 'slow-2g') {
            status = 'slow';
          }
        }
      }
    } else if (isConnected && isInternetReachable === false) {
      status = 'offline'; // Connected to network but no internet
    } else if (!isConnected) {
      status = 'offline';
    }

    return {
      isConnected,
      isInternetReachable,
      type,
      status,
      effectiveType: (state.details as any)?.effectiveConnectionType,
    };
  }

  /**
   * Wait for online status (with timeout)
   */
  async waitForOnline(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.off('online', onlineHandler);
        resolve(false);
      }, timeoutMs);

      const onlineHandler = () => {
        clearTimeout(timeout);
        this.off('online', onlineHandler);
        resolve(true);
      };

      this.once('online', onlineHandler);
    });
  }

  /**
   * Execute function when online
   */
  async whenOnline<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOnline()) {
      return fn();
    }

    await this.waitForOnline();
    return fn();
  }

  /**
   * Get network type description
   */
  getNetworkTypeDescription(): string {
    const { type, status } = this.currentState;

    if (status === 'offline') {
      return '離線';
    }

    if (status === 'slow') {
      return '網路緩慢';
    }

    switch (type) {
      case 'wifi':
        return 'Wi-Fi';
      case 'cellular':
        return '行動網路';
      case 'ethernet':
        return '乙太網路';
      case 'bluetooth':
        return '藍牙';
      case 'wimax':
        return 'WiMAX';
      default:
        return '未知網路';
    }
  }
}

export default new NetworkMonitor();
