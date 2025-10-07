/**
 * T116: Conflict Resolution
 * 處理離線同步時的資料衝突
 */

import { Workout } from '../types/workout';
import { Dashboard } from '../types/dashboard';
import { Achievement } from '../types/achievement';

export type ConflictStrategy = 'server_wins' | 'local_wins' | 'newest_wins' | 'merge' | 'manual';

export interface ConflictResolution<T> {
  strategy: ConflictStrategy;
  resolved: T;
  metadata: {
    local_version: T;
    server_version: T;
    resolution_time: string;
    merged_fields?: string[];
  };
}

export interface ConflictItem<T = any> {
  id: string;
  entity_type: 'workout' | 'dashboard' | 'achievement';
  local_version: T;
  server_version: T;
  detected_at: string;
}

class ConflictResolver {
  /**
   * Resolve workout conflict
   */
  resolveWorkoutConflict(
    local: Workout,
    server: Workout,
    strategy: ConflictStrategy = 'newest_wins'
  ): ConflictResolution<Workout> {
    let resolved: Workout;
    const mergedFields: string[] = [];

    switch (strategy) {
      case 'server_wins':
        resolved = server;
        break;

      case 'local_wins':
        resolved = local;
        break;

      case 'newest_wins':
        const localUpdated = new Date(local.updated_at);
        const serverUpdated = new Date(server.updated_at);
        resolved = localUpdated > serverUpdated ? local : server;
        break;

      case 'merge':
        // Smart merge: keep non-null values, prefer newer for conflicts
        resolved = { ...server };

        // Merge notes (concatenate if both exist)
        if (local.notes && server.notes && local.notes !== server.notes) {
          resolved.notes = `${local.notes}\n---\n${server.notes}`;
          mergedFields.push('notes');
        } else if (local.notes && !server.notes) {
          resolved.notes = local.notes;
          mergedFields.push('notes');
        }

        // Prefer local for numeric values if server doesn't have them
        if (local.distance_km && !server.distance_km) {
          resolved.distance_km = local.distance_km;
          mergedFields.push('distance_km');
        }

        if (local.calories && !server.calories) {
          resolved.calories = local.calories;
          mergedFields.push('calories');
        }

        if (local.avg_heart_rate && !server.avg_heart_rate) {
          resolved.avg_heart_rate = local.avg_heart_rate;
          mergedFields.push('avg_heart_rate');
        }

        // Keep local location if server doesn't have it
        if (local.location && !server.location) {
          resolved.location = local.location;
          mergedFields.push('location');
        }

        break;

      case 'manual':
        // Manual resolution requires user intervention
        // Return server version as default, but flag for manual review
        resolved = server;
        break;

      default:
        resolved = server; // Default to server wins
    }

    return {
      strategy,
      resolved,
      metadata: {
        local_version: local,
        server_version: server,
        resolution_time: new Date().toISOString(),
        merged_fields: mergedFields.length > 0 ? mergedFields : undefined,
      },
    };
  }

  /**
   * Resolve dashboard conflict
   */
  resolveDashboardConflict(
    local: Dashboard,
    server: Dashboard,
    strategy: ConflictStrategy = 'newest_wins'
  ): ConflictResolution<Dashboard> {
    let resolved: Dashboard;
    const mergedFields: string[] = [];

    switch (strategy) {
      case 'server_wins':
        resolved = server;
        break;

      case 'local_wins':
        resolved = local;
        break;

      case 'newest_wins':
        const localUpdated = new Date(local.updated_at);
        const serverUpdated = new Date(server.updated_at);
        resolved = localUpdated > serverUpdated ? local : server;
        break;

      case 'merge':
        // For dashboards, prefer local widgets if they differ
        resolved = { ...server };

        // Merge widgets (complex merge logic)
        const localWidgetIds = new Set(local.widgets.map((w) => w.id));
        const serverWidgetIds = new Set(server.widgets.map((w) => w.id));

        // Keep all local widgets
        const mergedWidgets = [...local.widgets];

        // Add server widgets that don't exist locally
        server.widgets.forEach((serverWidget) => {
          if (!localWidgetIds.has(serverWidget.id)) {
            mergedWidgets.push(serverWidget);
          }
        });

        resolved.widgets = mergedWidgets;
        mergedFields.push('widgets');
        break;

      case 'manual':
        resolved = server;
        break;

      default:
        resolved = server;
    }

    return {
      strategy,
      resolved,
      metadata: {
        local_version: local,
        server_version: server,
        resolution_time: new Date().toISOString(),
        merged_fields: mergedFields.length > 0 ? mergedFields : undefined,
      },
    };
  }

  /**
   * Resolve achievement conflict
   */
  resolveAchievementConflict(
    local: Achievement,
    server: Achievement,
    strategy: ConflictStrategy = 'server_wins'
  ): ConflictResolution<Achievement> {
    // For achievements, usually server wins (they are generated server-side)
    // But we preserve local sharing status
    let resolved: Achievement;

    switch (strategy) {
      case 'server_wins':
      case 'newest_wins':
      case 'merge':
        resolved = { ...server };
        // Keep local sharing status if it's true
        if (local.shared && !server.shared) {
          resolved.shared = local.shared;
          resolved.share_card_id = local.share_card_id;
        }
        break;

      case 'local_wins':
        resolved = local;
        break;

      case 'manual':
        resolved = server;
        break;

      default:
        resolved = server;
    }

    return {
      strategy,
      resolved,
      metadata: {
        local_version: local,
        server_version: server,
        resolution_time: new Date().toISOString(),
      },
    };
  }

  /**
   * Auto-resolve conflict based on entity type
   */
  autoResolve<T>(
    entityType: 'workout' | 'dashboard' | 'achievement',
    local: T,
    server: T
  ): ConflictResolution<T> {
    switch (entityType) {
      case 'workout':
        return this.resolveWorkoutConflict(
          local as unknown as Workout,
          server as unknown as Workout,
          'merge'
        ) as unknown as ConflictResolution<T>;

      case 'dashboard':
        return this.resolveDashboardConflict(
          local as unknown as Dashboard,
          server as unknown as Dashboard,
          'newest_wins'
        ) as unknown as ConflictResolution<T>;

      case 'achievement':
        return this.resolveAchievementConflict(
          local as unknown as Achievement,
          server as unknown as Achievement,
          'server_wins'
        ) as unknown as ConflictResolution<T>;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  /**
   * Detect conflicts between local and server data
   */
  detectConflict<T extends { id: string; updated_at: string }>(local: T, server: T): boolean {
    // No conflict if IDs don't match
    if (local.id !== server.id) {
      return false;
    }

    // Check if updated_at differs
    const localUpdated = new Date(local.updated_at);
    const serverUpdated = new Date(server.updated_at);

    // If times are very close (within 1 second), no conflict
    const timeDiff = Math.abs(localUpdated.getTime() - serverUpdated.getTime());
    if (timeDiff < 1000) {
      return false;
    }

    // If one is clearly newer, it's a conflict
    return localUpdated.getTime() !== serverUpdated.getTime();
  }

  /**
   * Get conflict resolution strategy for entity type
   */
  getDefaultStrategy(entityType: 'workout' | 'dashboard' | 'achievement'): ConflictStrategy {
    switch (entityType) {
      case 'workout':
        return 'merge'; // Try to merge workout data
      case 'dashboard':
        return 'newest_wins'; // Prefer newest dashboard
      case 'achievement':
        return 'server_wins'; // Server is source of truth for achievements
      default:
        return 'server_wins';
    }
  }

  /**
   * Format conflict for user display
   */
  formatConflictForDisplay(conflict: ConflictItem): {
    title: string;
    description: string;
    localSummary: string;
    serverSummary: string;
  } {
    const { entity_type, local_version, server_version } = conflict;

    switch (entity_type) {
      case 'workout':
        const localWorkout = local_version as Workout;
        const serverWorkout = server_version as Workout;

        return {
          title: '運動記錄衝突',
          description: `您的本地記錄與伺服器記錄不一致`,
          localSummary: `${localWorkout.workout_type} - ${localWorkout.duration_minutes} 分鐘 (本地版本)`,
          serverSummary: `${serverWorkout.workout_type} - ${serverWorkout.duration_minutes} 分鐘 (伺服器版本)`,
        };

      case 'dashboard':
        const localDash = local_version as Dashboard;
        const serverDash = server_version as Dashboard;

        return {
          title: '儀表板衝突',
          description: `儀表板配置不一致`,
          localSummary: `${localDash.name} - ${localDash.widgets.length} 個 Widget (本地版本)`,
          serverSummary: `${serverDash.name} - ${serverDash.widgets.length} 個 Widget (伺服器版本)`,
        };

      case 'achievement':
        const localAch = local_version as Achievement;
        const serverAch = server_version as Achievement;

        return {
          title: '成就衝突',
          description: `成就記錄不一致`,
          localSummary: `${localAch.achievement_type} (本地版本)`,
          serverSummary: `${serverAch.achievement_type} (伺服器版本)`,
        };

      default:
        return {
          title: '資料衝突',
          description: '本地與伺服器資料不一致',
          localSummary: '本地版本',
          serverSummary: '伺服器版本',
        };
    }
  }
}

export default new ConflictResolver();
