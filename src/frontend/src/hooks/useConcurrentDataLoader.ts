import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { 
  serializeHouse, 
  serializeHouseWithProgress, 
  serializeDashboardSummary 
} from '../lib/bigIntUtils';

/**
 * Hook for concurrent data loading during app initialization
 * Uses the new getBootstrapData backend method for efficient single-call data loading
 */
export function useConcurrentDataLoader(isAuthenticated: boolean) {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !actor || isFetching) return;

    const loadDataConcurrently = async () => {
      setIsLoadingData(true);
      setLoadingProgress(10);

      try {
        // Use the new bootstrap endpoint for efficient data loading
        const bootstrapData = await actor.getBootstrapData();
        setLoadingProgress(50);

        // Prime all caches with bootstrap data
        queryClient.setQueryData(['currentUserProfile'], bootstrapData.userProfile);
        
        const housesWithProgress = bootstrapData.housesWithProgress.map(serializeHouseWithProgress);
        queryClient.setQueryData(['housesWithProgress'], housesWithProgress);
        setLoadingProgress(70);

        const houses = housesWithProgress.map(hwp => hwp.house);
        queryClient.setQueryData(['houses'], houses);
        setLoadingProgress(85);

        const dashboardSummary = serializeDashboardSummary(bootstrapData.dashboardSummary);
        queryClient.setQueryData(['dashboardSummary'], dashboardSummary);
        setLoadingProgress(100);
      } catch (error) {
        console.error('Error during concurrent data loading:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadDataConcurrently();
  }, [isAuthenticated, actor, isFetching, queryClient]);

  return {
    isLoadingData,
    loadingProgress,
  };
}
