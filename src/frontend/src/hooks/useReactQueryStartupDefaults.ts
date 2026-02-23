import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Configures React Query default options at runtime to reduce
 * unnecessary refetches during startup while preserving correctness
 */
export function useReactQueryStartupDefaults() {
  const queryClient = useQueryClient();
  const hasConfigured = useRef(false);

  useEffect(() => {
    if (hasConfigured.current) return;
    hasConfigured.current = true;

    queryClient.setDefaultOptions({
      queries: {
        // Reduce refetch on mount when data is fresh
        refetchOnMount: (query) => {
          // Only refetch if data is stale
          return query.state.dataUpdatedAt === 0 || query.isStale();
        },
        // Reduce refetch on window focus during startup
        refetchOnWindowFocus: false,
        // Keep reasonable retry policy
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
        // Set reasonable stale times
        staleTime: 30000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
      },
    });

    console.log('React Query startup defaults configured');
  }, [queryClient]);
}
