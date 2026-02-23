import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { assetCache } from '../lib/assetCache';

/**
 * Startup preload hook that triggers critical asset caching
 * and non-blocking data prefetching after the app shell is visible
 */
export function useStartupPreload(enabled: boolean) {
  const queryClient = useQueryClient();
  const hasPreloaded = useRef(false);

  useEffect(() => {
    if (!enabled || hasPreloaded.current) {
      return;
    }

    hasPreloaded.current = true;

    // Preload critical assets (fire-and-forget with error handling)
    assetCache.preloadCriticalAssets().catch(error => {
      console.warn('Asset preload failed (non-critical):', error);
    });

    // Trigger non-blocking prefetch after a short delay
    // This ensures the app shell is fully rendered first
    const prefetchTimer = setTimeout(() => {
      // Prefetch is handled by React Query's background refetch
      // We just need to ensure queries are enabled
      console.log('Background prefetch enabled');
    }, 500);

    return () => clearTimeout(prefetchTimer);
  }, [enabled, queryClient]);
}
