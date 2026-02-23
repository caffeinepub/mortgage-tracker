import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorWithRetry } from './useActorWithRetry';
import type { UserProfile } from '../backend';
import { toast } from 'sonner';
import {
  serializeHouse,
  serializePayment,
  serializeDashboardSummary,
  serializeHouseProgress,
  serializeHouseWithProgress,
  serializeAppVersion,
  deserializeHouse,
  deserializeAppVersion,
  type SerializableHouse,
  type SerializablePayment,
  type SerializableDashboardSummary,
  type SerializableHouseProgress,
  type SerializableHouseWithProgress,
  type SerializableAppVersion,
} from '../lib/bigIntUtils';
import { offlineStorage } from '../lib/offlineStorage';
import { useConnectionStatus } from './useConnectionStatus';

// User Profile Queries with offline support
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      // Try offline first
      const offlineProfile = offlineStorage.getProfile();
      
      if (!isOnline) {
        return offlineProfile;
      }

      if (!actor) throw new Error('Actor not available');
      
      try {
        const profile = await actor.getCallerUserProfile();
        // Save to offline storage
        if (profile) {
          offlineStorage.saveProfile(profile);
        }
        return profile;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to offline data
        return offlineProfile;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: 2,
    retryDelay: 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useConnectionStatus();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      // Save to offline storage immediately
      offlineStorage.saveProfile(profile);
      
      if (!isOnline) {
        offlineStorage.addToSyncQueue({ type: 'update_profile', data: profile });
        return;
      }

      if (!actor) {
        offlineStorage.addToSyncQueue({ type: 'update_profile', data: profile });
        throw new Error('Backend connection unavailable. Changes saved locally and will sync when connection is restored.');
      }
      
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('saved locally')) {
        toast.info(error.message);
      } else {
        toast.error(`Failed to save profile: ${error.message}`);
      }
    },
  });
}

// House Queries with offline-first approach
export function useGetAllHouses() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  return useQuery<SerializableHouse[]>({
    queryKey: ['houses'],
    queryFn: async () => {
      // Always return offline data first
      const offlineHouses = offlineStorage.getHouses();
      
      if (!isOnline) {
        return offlineHouses;
      }

      if (!actor) return offlineHouses;
      
      try {
        const houses = await actor.getAllHouses();
        const serialized = houses.map(serializeHouse);
        // Update offline storage
        offlineStorage.saveHouses(serialized);
        return serialized;
      } catch (error) {
        console.error('Error fetching houses:', error);
        return offlineHouses;
      }
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useGetAllHousesWithProgress() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  return useQuery<SerializableHouseWithProgress[]>({
    queryKey: ['housesWithProgress'],
    queryFn: async () => {
      // Calculate from offline data
      const offlineData = offlineStorage.calculateHousesWithProgress();
      
      if (!isOnline) {
        return offlineData;
      }

      if (!actor) return offlineData;
      
      try {
        const bootstrap = await actor.getBootstrapData();
        const serialized = bootstrap.housesWithProgress.map(serializeHouseWithProgress);
        
        // Update offline storage with houses
        const houses = serialized.map(hwp => hwp.house);
        offlineStorage.saveHouses(houses);
        
        return serialized;
      } catch (error) {
        console.error('Error fetching houses with progress:', error);
        return offlineData;
      }
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useGetHouse(houseId: string | null) {
  const { actor, isFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  return useQuery<SerializableHouse | null>({
    queryKey: ['house', houseId],
    queryFn: async () => {
      if (!houseId) return null;
      
      // Try offline first
      const offlineHouses = offlineStorage.getHouses();
      const offlineHouse = offlineHouses.find(h => h.id === houseId) || null;
      
      if (!isOnline) {
        return offlineHouse;
      }

      if (!actor) return offlineHouse;
      
      try {
        const house = await actor.getHouse(houseId);
        return house ? serializeHouse(house) : offlineHouse;
      } catch (error) {
        console.error('Error fetching house:', error);
        return offlineHouse;
      }
    },
    enabled: !!actor && !isFetching && !!houseId,
    refetchOnMount: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useAddOrUpdateHouse() {
  const { actor, isFetching } = useActor();
  const { isRetrying } = useActorWithRetry();
  const queryClient = useQueryClient();
  const { isOnline } = useConnectionStatus();

  return useMutation({
    mutationFn: async (house: SerializableHouse) => {
      // Update offline storage immediately
      const houses = offlineStorage.getHouses();
      const index = houses.findIndex(h => h.id === house.id);
      if (index >= 0) {
        houses[index] = house;
      } else {
        houses.push(house);
      }
      offlineStorage.saveHouses(houses);
      
      // If offline, queue for sync
      if (!isOnline) {
        offlineStorage.addToSyncQueue({ 
          type: house.createdAt ? 'update_house' : 'add_house', 
          data: house 
        });
        return { queued: true, reason: 'offline' };
      }

      // If actor is initializing/retrying, queue for automatic sync
      if (!actor || isFetching || isRetrying) {
        offlineStorage.addToSyncQueue({ 
          type: house.createdAt ? 'update_house' : 'add_house', 
          data: house 
        });
        return { queued: true, reason: 'connecting' };
      }
      
      // Try to sync with backend
      try {
        const backendHouse = deserializeHouse(house);
        await actor.addOrUpdateHouse(backendHouse);
        return { queued: false };
      } catch (error: any) {
        // If backend call fails, queue for sync
        offlineStorage.addToSyncQueue({ 
          type: house.createdAt ? 'update_house' : 'add_house', 
          data: house 
        });
        throw new Error(`Backend error: ${error.message}. Changes saved locally and will sync when connection is restored.`);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['housesWithProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      if (result?.queued) {
        if (result.reason === 'connecting') {
          toast.success('House saved locally. Syncing automatically when connected...');
        } else {
          toast.success('House saved locally. Will sync when online.');
        }
      } else {
        toast.success('House saved successfully');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('saved locally')) {
        toast.info(error.message);
      } else {
        toast.error(`Failed to save house: ${error.message}`);
      }
    },
  });
}

export function useDeleteHouse() {
  const { actor, isFetching } = useActor();
  const { isRetrying } = useActorWithRetry();
  const queryClient = useQueryClient();
  const { isOnline } = useConnectionStatus();

  return useMutation({
    mutationFn: async (houseId: string) => {
      // Delete from offline storage immediately
      offlineStorage.deleteHouse(houseId);
      
      // If offline, queue for sync
      if (!isOnline) {
        offlineStorage.addToSyncQueue({ 
          type: 'delete_house', 
          data: { houseId }
        });
        return { queued: true, reason: 'offline' };
      }

      // If actor is initializing/retrying, queue for automatic sync
      if (!actor || isFetching || isRetrying) {
        offlineStorage.addToSyncQueue({ 
          type: 'delete_house', 
          data: { houseId }
        });
        return { queued: true, reason: 'connecting' };
      }
      
      // Try to sync with backend
      try {
        await actor.deleteHouse(houseId);
        return { queued: false };
      } catch (error: any) {
        // If backend call fails, queue for sync
        offlineStorage.addToSyncQueue({ 
          type: 'delete_house', 
          data: { houseId }
        });
        throw new Error(`Backend error: ${error.message}. Changes saved locally and will sync when connection is restored.`);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['houses'] });
      queryClient.invalidateQueries({ queryKey: ['housesWithProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['paymentHistory'] });
      
      if (result?.queued) {
        if (result.reason === 'connecting') {
          toast.success('House deleted locally. Syncing automatically when connected...');
        } else {
          toast.success('House deleted locally. Will sync when online.');
        }
      } else {
        toast.success('House deleted successfully');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('saved locally')) {
        toast.info(error.message);
      } else {
        toast.error(`Failed to delete house: ${error.message}`);
      }
    },
  });
}

// Payment Queries with offline support
export function useGetPaymentHistoryByHouse(houseId: string | null) {
  const { actor, isFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  return useQuery<SerializablePayment[]>({
    queryKey: ['paymentHistory', houseId],
    queryFn: async () => {
      if (!houseId) return [];
      
      // Get offline payments
      const offlinePayments = offlineStorage.getPaymentsByHouse(houseId);
      
      if (!isOnline) {
        return offlinePayments;
      }

      if (!actor) return offlinePayments;
      
      try {
        const payments = await actor.getPaymentHistoryByHouse(houseId);
        const serialized = payments.map(serializePayment);
        
        // Update offline storage
        const allPayments = offlineStorage.getPayments();
        const otherPayments = allPayments.filter(p => p.houseId !== houseId);
        offlineStorage.savePayments([...otherPayments, ...serialized]);
        
        return serialized;
      } catch (error) {
        console.error('Error fetching payment history:', error);
        return offlinePayments;
      }
    },
    enabled: !!actor && !isFetching && !!houseId,
    refetchOnMount: false,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
}

export function useAddPayment() {
  const { actor, isFetching } = useActor();
  const { isRetrying } = useActorWithRetry();
  const queryClient = useQueryClient();
  const { isOnline } = useConnectionStatus();

  return useMutation({
    mutationFn: async ({ 
      amount, 
      note, 
      houseId, 
      paymentMethod, 
      date 
    }: { 
      amount: number; 
      note: string; 
      houseId: string; 
      paymentMethod: string; 
      date: Date | null;
    }) => {
      const paymentDate = date ? date.getTime() : Date.now();
      
      // Add to offline storage immediately
      const newPayment: SerializablePayment = {
        amount,
        note,
        houseId,
        paymentMethod,
        date: paymentDate,
      };
      
      const payments = offlineStorage.getPayments();
      payments.push(newPayment);
      offlineStorage.savePayments(payments);
      
      if (!isOnline) {
        offlineStorage.addToSyncQueue({ 
          type: 'add_payment', 
          data: { amount, note, houseId, paymentMethod, date: paymentDate }
        });
        return { queued: true, reason: 'offline' };
      }

      if (!actor || isFetching || isRetrying) {
        offlineStorage.addToSyncQueue({ 
          type: 'add_payment', 
          data: { amount, note, houseId, paymentMethod, date: paymentDate }
        });
        return { queued: true, reason: 'connecting' };
      }

      try {
        const dateNanos = BigInt(paymentDate * 1000000);
        await actor.addPayment(amount, note, houseId, paymentMethod, dateNanos);
        return { queued: false };
      } catch (error: any) {
        offlineStorage.addToSyncQueue({ 
          type: 'add_payment', 
          data: { amount, note, houseId, paymentMethod, date: paymentDate }
        });
        throw new Error(`Backend error: ${error.message}. Payment saved locally and will sync when connection is restored.`);
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentHistory', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['houseProgress', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['housesWithProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      if (result?.queued) {
        if (result.reason === 'connecting') {
          toast.success('Payment saved locally. Syncing automatically when connected...');
        } else {
          toast.success('Payment saved locally. Will sync when online.');
        }
      } else {
        toast.success('Payment added successfully');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('saved locally')) {
        toast.info(error.message);
      } else {
        toast.error(`Failed to add payment: ${error.message}`);
      }
    },
  });
}

export function useEditPayment() {
  const { actor, isFetching } = useActor();
  const { isRetrying } = useActorWithRetry();
  const queryClient = useQueryClient();
  const { isOnline } = useConnectionStatus();

  return useMutation({
    mutationFn: async ({ 
      paymentIndex, 
      amount, 
      note, 
      houseId, 
      paymentMethod, 
      date 
    }: { 
      paymentIndex: number; 
      amount: number; 
      note: string; 
      houseId: string; 
      paymentMethod: string; 
      date: Date;
    }) => {
      const paymentDate = date.getTime();
      
      // Update offline storage
      const payments = offlineStorage.getPayments();
      const housePayments = payments.filter(p => p.houseId === houseId).sort((a, b) => b.date - a.date);
      
      if (paymentIndex < housePayments.length) {
        const paymentToUpdate = housePayments[paymentIndex];
        const globalIndex = payments.findIndex(p => 
          p.houseId === paymentToUpdate.houseId && 
          p.date === paymentToUpdate.date && 
          p.amount === paymentToUpdate.amount
        );
        
        if (globalIndex >= 0) {
          payments[globalIndex] = {
            amount,
            note,
            houseId,
            paymentMethod,
            date: paymentDate,
          };
          offlineStorage.savePayments(payments);
        }
      }
      
      if (!isOnline) {
        offlineStorage.addToSyncQueue({ 
          type: 'edit_payment', 
          data: { paymentIndex, amount, note, houseId, paymentMethod, date: paymentDate }
        });
        return { queued: true, reason: 'offline' };
      }

      if (!actor || isFetching || isRetrying) {
        offlineStorage.addToSyncQueue({ 
          type: 'edit_payment', 
          data: { paymentIndex, amount, note, houseId, paymentMethod, date: paymentDate }
        });
        return { queued: true, reason: 'connecting' };
      }

      try {
        const dateNanos = BigInt(paymentDate * 1000000);
        await actor.editPayment(BigInt(paymentIndex), amount, note, houseId, paymentMethod, dateNanos);
        return { queued: false };
      } catch (error: any) {
        offlineStorage.addToSyncQueue({ 
          type: 'edit_payment', 
          data: { paymentIndex, amount, note, houseId, paymentMethod, date: paymentDate }
        });
        throw new Error(`Backend error: ${error.message}. Changes saved locally and will sync when connection is restored.`);
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentHistory', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['houseProgress', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['housesWithProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      if (result?.queued) {
        if (result.reason === 'connecting') {
          toast.success('Payment updated locally. Syncing automatically when connected...');
        } else {
          toast.success('Payment updated locally. Will sync when online.');
        }
      } else {
        toast.success('Payment updated successfully');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('saved locally')) {
        toast.info(error.message);
      } else {
        toast.error(`Failed to update payment: ${error.message}`);
      }
    },
  });
}

export function useDeletePayment() {
  const { actor, isFetching } = useActor();
  const { isRetrying } = useActorWithRetry();
  const queryClient = useQueryClient();
  const { isOnline } = useConnectionStatus();

  return useMutation({
    mutationFn: async ({ 
      paymentIndex, 
      houseId 
    }: { 
      paymentIndex: number; 
      houseId: string;
    }) => {
      // Update offline storage
      const payments = offlineStorage.getPayments();
      const housePayments = payments.filter(p => p.houseId === houseId).sort((a, b) => b.date - a.date);
      
      if (paymentIndex < housePayments.length) {
        const paymentToDelete = housePayments[paymentIndex];
        const globalIndex = payments.findIndex(p => 
          p.houseId === paymentToDelete.houseId && 
          p.date === paymentToDelete.date && 
          p.amount === paymentToDelete.amount
        );
        
        if (globalIndex >= 0) {
          payments.splice(globalIndex, 1);
          offlineStorage.savePayments(payments);
        }
      }
      
      if (!isOnline) {
        offlineStorage.addToSyncQueue({ 
          type: 'delete_payment', 
          data: { paymentIndex, houseId }
        });
        return { queued: true, reason: 'offline' };
      }

      if (!actor || isFetching || isRetrying) {
        offlineStorage.addToSyncQueue({ 
          type: 'delete_payment', 
          data: { paymentIndex, houseId }
        });
        return { queued: true, reason: 'connecting' };
      }

      try {
        await actor.deletePayment(BigInt(paymentIndex));
        return { queued: false };
      } catch (error: any) {
        offlineStorage.addToSyncQueue({ 
          type: 'delete_payment', 
          data: { paymentIndex, houseId }
        });
        throw new Error(`Backend error: ${error.message}. Changes saved locally and will sync when connection is restored.`);
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['paymentHistory', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['houseProgress', variables.houseId] });
      queryClient.invalidateQueries({ queryKey: ['housesWithProgress'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      
      if (result?.queued) {
        if (result.reason === 'connecting') {
          toast.success('Payment deleted locally. Syncing automatically when connected...');
        } else {
          toast.success('Payment deleted locally. Will sync when online.');
        }
      } else {
        toast.success('Payment deleted successfully');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('saved locally')) {
        toast.info(error.message);
      } else {
        toast.error(`Failed to delete payment: ${error.message}`);
      }
    },
  });
}

// Dashboard Summary Query with offline calculation
export function useGetDashboardSummary() {
  const { actor, isFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  return useQuery<SerializableDashboardSummary>({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      // Calculate from offline data
      const offlineSummary = offlineStorage.calculateDashboardSummary();
      
      if (!isOnline) {
        return offlineSummary;
      }

      if (!actor) return offlineSummary;
      
      try {
        const bootstrap = await actor.getBootstrapData();
        return serializeDashboardSummary(bootstrap.dashboardSummary);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        return offlineSummary;
      }
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// House Progress Query with offline calculation
export function useGetHouseProgress(houseId: string | null) {
  const { actor, isFetching } = useActor();
  const { isOnline } = useConnectionStatus();

  return useQuery<SerializableHouseProgress | null>({
    queryKey: ['houseProgress', houseId],
    queryFn: async () => {
      if (!houseId) return null;
      
      // Calculate from offline data
      const offlineProgress = offlineStorage.calculateHouseProgress(houseId);
      
      if (!isOnline) {
        return offlineProgress;
      }

      if (!actor) return offlineProgress;
      
      try {
        const progress = await actor.getHouseProgress(houseId);
        return serializeHouseProgress(progress);
      } catch (error) {
        console.error('Error fetching house progress:', error);
        return offlineProgress;
      }
    },
    enabled: !!actor && !isFetching && !!houseId,
    refetchOnMount: false,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
}

// App Version Queries
export function useGetCurrentAppVersion() {
  const { actor, isFetching } = useActor();

  return useQuery<SerializableAppVersion>({
    queryKey: ['appVersion'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const version = await actor.getCurrentAppVersion();
        return serializeAppVersion(version);
      } catch (error) {
        console.error('Error fetching app version:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: Infinity,
    retry: false,
  });
}

export function useCheckForUpdates(frontendVersion: SerializableAppVersion | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['updateAvailable', frontendVersion],
    queryFn: async () => {
      if (!actor || !frontendVersion) return false;
      try {
        const backendVersion = deserializeAppVersion(frontendVersion);
        return await actor.isUpdateAvailable(backendVersion);
      } catch (error) {
        console.warn('Version check failed, assuming no update:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!frontendVersion,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: 60000,
  });
}

// Actor status hook for UI components
export function useActorStatus() {
  const { actor, isFetching } = useActor();
  const { isRetrying, retryAttempt, maxRetries, hasError } = useActorWithRetry();
  const { isOnline } = useConnectionStatus();

  const isConnecting = isFetching || isRetrying;
  const isActorReady = !!actor && !isFetching && !isRetrying;
  const showRetryPrompt = hasError && !isRetrying && retryAttempt >= maxRetries;

  return {
    isActorReady,
    isConnecting,
    isRetrying,
    retryAttempt,
    maxRetries,
    showRetryPrompt,
    isOnline,
    canPerformBackendOperations: isActorReady && isOnline,
  };
}
