import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorWithRetry } from './useActorWithRetry';
import { offlineStorage, type SyncQueueItem } from '../lib/offlineStorage';
import { useConnectionStatus } from './useConnectionStatus';
import { toast } from 'sonner';
import { deserializeHouse } from '../lib/bigIntUtils';

/**
 * Background synchronization hook with deferred initialization and intelligent retry handling
 * @param enabled - Whether background sync should be active
 */
export function useBackgroundSync(enabled: boolean = true) {
  const { actor, isFetching } = useActor();
  const { isRetrying } = useActorWithRetry();
  const queryClient = useQueryClient();
  const { isOnline, wasOffline } = useConnectionStatus();
  const syncInProgress = useRef(false);
  const lastSyncAttempt = useRef(0);

  const processSyncQueue = async () => {
    // Wait for actor to be ready (not initializing/retrying) and sync to be enabled
    if (!enabled || !actor || isFetching || isRetrying || !isOnline || syncInProgress.current) {
      return;
    }

    const queue = offlineStorage.getSyncQueue();
    if (queue.length === 0) return;

    // Prevent too frequent sync attempts
    const now = Date.now();
    if (now - lastSyncAttempt.current < 2000) return;
    lastSyncAttempt.current = now;

    syncInProgress.current = true;
    let successCount = 0;
    let failCount = 0;

    toast.info(`Syncing ${queue.length} pending changes...`);

    for (const item of queue) {
      try {
        await processSyncItem(item);
        offlineStorage.removeFromSyncQueue(item.id);
        successCount++;
      } catch (error) {
        console.error('Sync item failed:', item, error);
        failCount++;
        
        // Increment retry count
        offlineStorage.incrementRetryCount(item.id);
        
        // Remove from queue if too many retries
        if (item.retryCount >= 3) {
          offlineStorage.removeFromSyncQueue(item.id);
          toast.error(`Failed to sync ${item.type} after 3 attempts`);
        }
      }
    }

    syncInProgress.current = false;

    if (successCount > 0) {
      offlineStorage.setLastSyncTime(Date.now());
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['housesWithProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      queryClient.invalidateQueries({ queryKey: ['houseProgress'] });
      
      toast.success(`Successfully synced ${successCount} changes`);
    }

    if (failCount > 0 && successCount === 0) {
      toast.error(`Failed to sync ${failCount} changes. Will retry later.`);
    }
  };

  const processSyncItem = async (item: SyncQueueItem) => {
    if (!actor) throw new Error('Actor not available');

    switch (item.type) {
      case 'add_house':
      case 'update_house':
        await actor.addOrUpdateHouse(deserializeHouse(item.data));
        break;

      case 'delete_house':
        await actor.deleteHouse(item.data.houseId);
        break;

      case 'add_payment':
        const { amount, note, houseId, paymentMethod, date } = item.data;
        const dateNanos = date ? BigInt(date * 1000000) : null;
        await actor.addPayment(amount, note, houseId, paymentMethod, dateNanos);
        break;

      case 'edit_payment':
        const editData = item.data;
        const editDateNanos = BigInt(editData.date * 1000000);
        await actor.editPayment(
          BigInt(editData.paymentIndex),
          editData.amount,
          editData.note,
          editData.houseId,
          editData.paymentMethod,
          editDateNanos
        );
        break;

      case 'delete_payment':
        await actor.deletePayment(BigInt(item.data.paymentIndex));
        break;

      case 'update_profile':
        await actor.saveCallerUserProfile(item.data);
        break;

      default:
        console.warn('Unknown sync item type:', item.type);
    }
  };

  // Trigger sync when actor becomes ready after being offline or during initialization
  useEffect(() => {
    if (enabled && isOnline && actor && !isFetching && !isRetrying) {
      const queue = offlineStorage.getSyncQueue();
      if (queue.length > 0) {
        console.log('Actor ready and sync queue has items, starting background sync...');
        setTimeout(() => processSyncQueue(), 1000);
      }
    }
  }, [enabled, isOnline, actor, isFetching, isRetrying]);

  // Trigger sync when coming back online
  useEffect(() => {
    if (enabled && wasOffline && isOnline && actor && !isFetching && !isRetrying) {
      console.log('Connection restored and actor ready, starting background sync...');
      setTimeout(() => processSyncQueue(), 1000);
    }
  }, [enabled, wasOffline, isOnline, actor, isFetching, isRetrying]);

  // Periodic sync check when actor is ready (only if enabled)
  useEffect(() => {
    if (!enabled || !isOnline || !actor || isFetching || isRetrying) return;

    const interval = setInterval(() => {
      processSyncQueue();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, isOnline, actor, isFetching, isRetrying]);

  return {
    syncNow: processSyncQueue,
    pendingCount: offlineStorage.getSyncQueue().length,
    canSync: enabled && !!actor && !isFetching && !isRetrying && isOnline,
  };
}
