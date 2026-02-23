import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { offlineStorage } from '../lib/offlineStorage';
import {
  serializeHouseWithProgress,
  serializeDashboardSummary,
} from '../lib/bigIntUtils';

/**
 * Bootstrap hook that fetches all initial data in a single backend call
 * and primes React Query caches for instant navigation
 */
export function useBootstrapData(enabled: boolean) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const hasBootstrapped = useRef(false);
  const isBootstrapping = useRef(false);

  useEffect(() => {
    if (!enabled || !actor || hasBootstrapped.current || isBootstrapping.current) {
      return;
    }

    const bootstrap = async () => {
      isBootstrapping.current = true;
      
      try {
        console.log('Fetching bootstrap data...');
        const data = await actor.getBootstrapData();
        
        // Serialize the data
        const housesWithProgress = data.housesWithProgress.map(serializeHouseWithProgress);
        const dashboardSummary = serializeDashboardSummary(data.dashboardSummary);
        const userProfile = data.userProfile;

        // Prime React Query caches
        queryClient.setQueryData(['currentUserProfile'], userProfile);
        queryClient.setQueryData(['housesWithProgress'], housesWithProgress);
        queryClient.setQueryData(['dashboardSummary'], dashboardSummary);
        
        // Extract houses from housesWithProgress
        const houses = housesWithProgress.map(hwp => hwp.house);
        queryClient.setQueryData(['houses'], houses);

        // Update offline storage
        offlineStorage.saveProfile(userProfile);
        offlineStorage.saveHouses(houses);
        
        // Calculate and save payments if needed (backend doesn't return them in bootstrap)
        // The housesWithProgress already contains calculated totals
        
        hasBootstrapped.current = true;
        console.log('Bootstrap data loaded and cached successfully');
      } catch (error) {
        console.error('Bootstrap data fetch failed:', error);
        // Don't set hasBootstrapped to true so it can retry
      } finally {
        isBootstrapping.current = false;
      }
    };

    bootstrap();
  }, [enabled, actor, queryClient]);

  return {
    hasBootstrapped: hasBootstrapped.current,
    isBootstrapping: isBootstrapping.current,
  };
}
