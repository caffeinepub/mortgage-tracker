/**
 * Browser CacheStorage manager for static assets
 * Provides instant reuse of icons, themes, and stylesheets
 */

const CACHE_NAME = 'mortgage-tracker-assets-v1';
const ASSETS_TO_CACHE = [
  '/assets/generated/house-loading-icon-transparent.dim_64x64.png',
  '/assets/generated/connection-online-icon-transparent.dim_24x24.png',
  '/assets/generated/connection-offline-icon-transparent.dim_24x24.png',
  '/assets/generated/sync-complete-icon-transparent.dim_24x24.png',
  '/assets/generated/sync-error-icon-transparent.dim_24x24.png',
  '/assets/generated/sync-progress-icon-transparent.dim_24x24.png',
];

const CRITICAL_ASSETS = [
  '/assets/generated/house-loading-icon-transparent.dim_64x64.png',
  '/assets/generated/connection-online-icon-transparent.dim_24x24.png',
  '/assets/generated/connection-offline-icon-transparent.dim_24x24.png',
  '/assets/generated/sync-progress-icon-transparent.dim_24x24.png',
  '/assets/generated/sync-complete-icon-transparent.dim_24x24.png',
  '/assets/generated/sync-error-icon-transparent.dim_24x24.png',
];

class AssetCacheManager {
  private cacheInitialized = false;

  /**
   * Initialize cache with static assets
   */
  async initializeCache(): Promise<void> {
    if (this.cacheInitialized) return;

    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache all static assets
        await Promise.allSettled(
          ASSETS_TO_CACHE.map(async (asset) => {
            try {
              const response = await fetch(asset);
              if (response.ok) {
                await cache.put(asset, response);
              }
            } catch (error) {
              console.warn(`Failed to cache asset: ${asset}`, error);
            }
          })
        );

        this.cacheInitialized = true;
        console.log('Asset cache initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize asset cache:', error);
    }
  }

  /**
   * Get asset from cache or fetch from network
   */
  async getAsset(url: string): Promise<Response | null> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(url);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fetch from network and cache
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
        }
        return response;
      }
    } catch (error) {
      console.error('Failed to get asset from cache:', error);
    }
    
    return null;
  }

  /**
   * Clear old cache versions
   */
  async clearOldCaches(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }
    } catch (error) {
      console.error('Failed to clear old caches:', error);
    }
  }

  /**
   * Preload critical assets for instant display during startup
   */
  async preloadCriticalAssets(): Promise<void> {
    try {
      if ('caches' in window) {
        const cache = await caches.open(CACHE_NAME);
        
        await Promise.allSettled(
          CRITICAL_ASSETS.map(async (asset) => {
            try {
              // Check if already cached
              const cached = await cache.match(asset);
              if (cached) return;
              
              // Fetch and cache
              const response = await fetch(asset);
              if (response.ok) {
                await cache.put(asset, response);
              }
            } catch (error) {
              console.warn(`Failed to preload critical asset: ${asset}`, error);
            }
          })
        );
        
        console.log('Critical assets preloaded');
      }
    } catch (error) {
      console.error('Failed to preload critical assets:', error);
    }
  }
}

export const assetCache = new AssetCacheManager();

// Initialize cache on module load
if (typeof window !== 'undefined') {
  assetCache.initializeCache();
  assetCache.clearOldCaches();
}
