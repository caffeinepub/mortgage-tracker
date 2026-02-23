import { useActor } from './useActor';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect, useCallback } from 'react';

const MAX_RETRY_ATTEMPTS = 5;

interface UseActorWithRetryReturn {
  actor: any | null;
  isFetching: boolean;
  isRetrying: boolean;
  retryAttempt: number;
  maxRetries: number;
  hasError: boolean;
  manualRetry: () => void;
}

/**
 * Enhanced actor hook with intelligent retry logic and connection state management.
 * Implements progressive retry with exponential backoff and provides clear connection state tracking.
 * Includes comprehensive error handling to prevent unhandled promise rejections.
 */
export function useActorWithRetry(): UseActorWithRetryReturn {
  const { actor, isFetching } = useActor();
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const queryClient = useQueryClient();
  const startTime = useRef(Date.now());
  const lastStateChange = useRef(Date.now());
  const errorHandled = useRef(false);
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Monitor actor availability and track retry state
  useEffect(() => {
    if (!mounted.current) return;

    try {
      const now = Date.now();
      const elapsed = now - startTime.current;
      const timeSinceLastChange = now - lastStateChange.current;
      
      // Actor is available - reset retry state
      if (actor) {
        if (isRetrying || hasError) {
          console.log('Actor connected successfully');
          lastStateChange.current = now;
        }
        setIsRetrying(false);
        setRetryAttempt(0);
        setHasError(false);
        errorHandled.current = false;
        startTime.current = now;
        return;
      }
      
      // Actor is being fetched - we're in retry mode
      if (isFetching) {
        if (!isRetrying) {
          console.log('Actor connection in progress');
          lastStateChange.current = now;
        }
        setIsRetrying(true);
        
        // Estimate retry attempt based on elapsed time
        // Retry delays: 1s, 2s, 4s, 4s, 4s
        let estimatedAttempt = 0;
        if (elapsed >= 1000) estimatedAttempt = 1;
        if (elapsed >= 3000) estimatedAttempt = 2; // 1s + 2s
        if (elapsed >= 7000) estimatedAttempt = 3; // 1s + 2s + 4s
        if (elapsed >= 11000) estimatedAttempt = 4; // 1s + 2s + 4s + 4s
        if (elapsed >= 15000) estimatedAttempt = 5; // 1s + 2s + 4s + 4s + 4s
        
        setRetryAttempt(Math.min(estimatedAttempt, MAX_RETRY_ATTEMPTS));
        setHasError(false);
        errorHandled.current = false;
        return;
      }
      
      // Actor is not available and not fetching
      if (!actor && !isFetching) {
        // If enough time has passed without progress, consider it an error
        if (elapsed > 12000 && timeSinceLastChange > 5000 && !errorHandled.current) {
          console.log('Actor connection timeout - no progress detected');
          setHasError(true);
          setIsRetrying(false);
          setRetryAttempt(MAX_RETRY_ATTEMPTS);
          errorHandled.current = true;
          lastStateChange.current = now;
        }
      }
    } catch (error) {
      console.error('Error in useActorWithRetry effect:', error);
      if (mounted.current) {
        setHasError(true);
        setIsRetrying(false);
        errorHandled.current = true;
      }
    }
  }, [actor, isFetching, isRetrying, hasError]);

  const manualRetry = useCallback(() => {
    if (!mounted.current) return;

    try {
      console.log('Manual retry triggered by user');
      setRetryAttempt(0);
      setIsRetrying(true);
      setHasError(false);
      errorHandled.current = false;
      startTime.current = Date.now();
      lastStateChange.current = Date.now();
      
      // Force refetch by invalidating the actor query
      queryClient.invalidateQueries({ queryKey: ['actor'] });
      queryClient.refetchQueries({ queryKey: ['actor'] }).catch((error) => {
        console.error('Error during manual retry:', error);
        if (mounted.current) {
          setHasError(true);
          setIsRetrying(false);
        }
      });
    } catch (error) {
      console.error('Error in manualRetry:', error);
      if (mounted.current) {
        setHasError(true);
        setIsRetrying(false);
      }
    }
  }, [queryClient]);

  return {
    actor,
    isFetching,
    isRetrying,
    retryAttempt,
    maxRetries: MAX_RETRY_ATTEMPTS,
    hasError,
    manualRetry,
  };
}
