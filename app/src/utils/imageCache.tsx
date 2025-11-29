/**
 * Image caching utilities using expo-image
 * Optimized for achievement share cards, avatars, and workout images
 */
import { Image } from "expo-image";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";

const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
const MAX_CACHE_SIZE_MB = 50;
const CACHE_EXPIRY_DAYS = 7;
const CACHE_METADATA_KEY = "@imageCache:metadata";

type ImageType = "avatar" | "achievement" | "workout" | "other";

interface CacheMetadata {
  [uri: string]: {
    localUri: string;
    size: number;
    timestamp: number;
    type: "avatar" | "achievement" | "workout" | "other";
  };
}

/**
 * Image cache manager
 */
export class ImageCacheManager {
  private metadata: CacheMetadata = {};
  private initialized = false;

  /**
   * Initialize cache manager
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Load metadata
      const metadataStr = await AsyncStorage.getItem(CACHE_METADATA_KEY);
      if (metadataStr) {
        this.metadata = JSON.parse(metadataStr);
      }

      this.initialized = true;

      // Clean up expired cache on init
      await this.cleanExpiredCache();
    } catch (error) {
      console.error("Failed to initialize image cache:", error);
    }
  }

  /**
   * Get cached image URI or download and cache
   */
  async getCachedUri(
    uri: string,
    type: "avatar" | "achievement" | "workout" | "other" = "other"
  ): Promise<string> {
    await this.initialize();

    // Check if already cached
    const cached = this.metadata[uri];
    if (cached) {
      const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
      if (fileInfo.exists) {
        // Update access timestamp
        cached.timestamp = Date.now();
        await this.saveMetadata();
        return cached.localUri;
      } else {
        // File missing, remove from metadata
        delete this.metadata[uri];
        await this.saveMetadata();
      }
    }

    // Download and cache
    try {
      const filename = this.generateFilename(uri);
      const localUri = `${CACHE_DIR}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(uri, localUri);

      if (downloadResult.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        const size =
          fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size ?? 0 : 0;

        // Add to metadata
        this.metadata[uri] = {
          localUri,
          size,
          timestamp: Date.now(),
          type,
        };

        await this.saveMetadata();

        // Check cache size and clean if needed
        await this.ensureCacheSizeLimit();

        return localUri;
      }
    } catch (error) {
      console.error("Failed to cache image:", error);
    }

    // Return original URI if caching fails
    return uri;
  }

  /**
   * Preload images for better UX
   */

  async preloadImages(uris: string[], type: ImageType) {
    await this.initialize();

    const promises = uris.map((uri) => this.getCachedUri(uri, type));
    await Promise.allSettled(promises);
  }

  /**
   * Clear all cached images
   */
  async clearCache() {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      this.metadata = {};
      await this.saveMetadata();
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }

  /**
   * Clear specific type of cached images
   */
  async clearCacheByType(type: "avatar" | "achievement" | "workout" | "other") {
    const urisToDelete = Object.entries(this.metadata)
      .filter(([_, meta]) => meta.type === type)
      .map(([uri]) => uri);

    for (const uri of urisToDelete) {
      await this.deleteCache(uri);
    }
  }

  /**
   * Delete specific cached image
   */
  async deleteCache(uri: string) {
    const cached = this.metadata[uri];
    if (cached) {
      try {
        await FileSystem.deleteAsync(cached.localUri, { idempotent: true });
        delete this.metadata[uri];
        await this.saveMetadata();
      } catch (error) {
        console.error("Failed to delete cached image:", error);
      }
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    await this.initialize();

    const entries = Object.values(this.metadata);
    const totalSize = entries.reduce((sum, meta) => sum + meta.size, 0);

    const byType = entries.reduce((acc, meta) => {
      acc[meta.type] = (acc[meta.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalFiles: entries.length,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      byType,
      oldestEntry: entries.reduce(
        (oldest, meta) => (meta.timestamp < oldest ? meta.timestamp : oldest),
        Date.now()
      ),
    };
  }

  /**
   * Clean expired cache entries
   */
  private async cleanExpiredCache() {
    const now = Date.now();
    const expiryMs = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const expiredUris = Object.entries(this.metadata)
      .filter(([_, meta]) => now - meta.timestamp > expiryMs)
      .map(([uri]) => uri);

    for (const uri of expiredUris) {
      await this.deleteCache(uri);
    }
  }

  /**
   * Ensure cache size doesn't exceed limit
   */
  private async ensureCacheSizeLimit() {
    const entries = Object.entries(this.metadata);
    const totalSize = entries.reduce((sum, [_, meta]) => sum + meta.size, 0);
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    if (totalSize <= maxSizeBytes) return;

    // Sort by timestamp (oldest first)
    const sortedEntries = entries.sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    // Delete oldest entries until under limit
    let currentSize = totalSize;
    for (const [uri, meta] of sortedEntries) {
      if (currentSize <= maxSizeBytes) break;

      await this.deleteCache(uri);
      currentSize -= meta.size;
    }
  }

  /**
   * Generate filename from URI
   */
  private generateFilename(uri: string): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < uri.length; i++) {
      const char = uri.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const extension = uri.split(".").pop()?.split("?")[0] || "jpg";
    return `${Math.abs(hash)}.${extension}`;
  }

  /**
   * Save metadata to AsyncStorage
   */
  private async saveMetadata() {
    try {
      await AsyncStorage.setItem(
        CACHE_METADATA_KEY,
        JSON.stringify(this.metadata)
      );
    } catch (error) {
      console.error("Failed to save cache metadata:", error);
    }
  }
}

// Global cache manager instance
export const imageCacheManager = new ImageCacheManager();

/**
 * Configure expo-image cache settings
 */
export function configureImageCache() {
  Image.clearDiskCache = async () => {
    await imageCacheManager.clearCache();
    return true;
  };

  Image.clearMemoryCache = async () => {
    return true; // expo-image 自帶記憶體快取
  };
}

/**
 * Custom image component with caching
 */
export interface CachedImageProps {
  uri: string;
  type?: "avatar" | "achievement" | "workout" | "other";
  style?: any;
  contentFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  placeholder?: string;
  transition?: number;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  type = "other",
  style,
  contentFit = "cover",
  placeholder,
  transition = 300,
}) => {
  const [cachedUri, setCachedUri] = React.useState<string>(uri);

  React.useEffect(() => {
    imageCacheManager.getCachedUri(uri, type).then(setCachedUri);
  }, [uri, type]);

  return (
    <Image
      source={{ uri: cachedUri }}
      style={style}
      contentFit={contentFit}
      placeholder={placeholder}
      transition={transition}
      cachePolicy="memory-disk"
    />
  );
};

/**
 * Avatar caching utilities
 */
export const AvatarCache = {
  async preloadAvatars(
    userIds: string[],
    getAvatarUri: (id: string) => string
  ) {
    const uris = userIds.map(getAvatarUri);
    await imageCacheManager.preloadImages(uris, "avatar");
  },

  async clearAvatarCache() {
    await imageCacheManager.clearCacheByType("avatar");
  },
};

/**
 * Achievement share card caching
 */
export const AchievementShareCache = {
  async cacheShareCard(achievementId: string, imageUri: string) {
    await imageCacheManager.getCachedUri(imageUri, "achievement");
  },

  async preloadShareCards(
    achievementIds: string[],
    getShareCardUri: (id: string) => string
  ) {
    const uris = achievementIds.map(getShareCardUri);
    await imageCacheManager.preloadImages(uris, "achievement");
  },

  async clearShareCardCache() {
    await imageCacheManager.clearCacheByType("achievement");
  },
};

/**
 * Workout image caching
 */
export const WorkoutImageCache = {
  async cacheWorkoutImages(
    workoutIds: string[],
    getImageUri: (id: string) => string
  ) {
    const uris = workoutIds.map(getImageUri);
    await imageCacheManager.preloadImages(uris, "workout");
  },

  async clearWorkoutImageCache() {
    await imageCacheManager.clearCacheByType("workout");
  },
};

/**
 * Performance best practices:
 *
 * 1. Use CachedImage component for all remote images
 * 2. Preload images for better UX (avatars, frequently accessed)
 * 3. Set appropriate cache expiry based on content type
 * 4. Monitor cache size and clear periodically
 * 5. Use appropriate image sizes (don't load 4K for thumbnails)
 * 6. Configure expo-image with cachePolicy="memory-disk"
 * 7. Use placeholder images for better perceived performance
 */
