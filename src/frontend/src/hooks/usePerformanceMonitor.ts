import { useState, useEffect } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useActorWithRetry } from './useActorWithRetry';

interface PerformanceMetrics {
  isStalled: boolean;
  progress: number;
  activeRequests: number;
  loadingStep: string;
}

const LOADING_STEPS = [
  'Initializing...',
  'Connecting...',
  'Loading Houses...',
  'Preparing Dashboard...',
  'Almost ready...',
];

export function usePerformanceMonitor(): PerformanceMetrics {
  const [isStalled, setIsStalled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(LOADING_STEPS[0]);
  const activeRequests = useIsFetching();
  const { isRetrying, retryAttempt } = useActorWithRetry();

  useEffect(() => {
    // Update loading step based on actor retry state
    if (isRetrying && retryAttempt > 0) {
      if (retryAttempt <= 2) {
        setLoadingStep(`Connecting... (attempt ${retryAttempt + 1})`);
      } else {
        setLoadingStep('Reconnecting...');
      }
    }
  }, [isRetrying, retryAttempt]);

  useEffect(() => {
    // Track stalled requests
    let stallTimer: NodeJS.Timeout;

    if (activeRequests > 0 || isRetrying) {
      // Simulate progress while loading with visible steps
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 8;
          
          // Update loading step based on progress
          if (isRetrying) {
            if (retryAttempt <= 2) {
              setLoadingStep(LOADING_STEPS[1]); // "Connecting..."
            } else {
              setLoadingStep('Reconnecting...');
            }
          } else if (newProgress >= 75) {
            setLoadingStep(LOADING_STEPS[4]); // "Almost ready..."
          } else if (newProgress >= 50) {
            setLoadingStep(LOADING_STEPS[3]); // "Preparing Dashboard..."
          } else if (newProgress >= 25) {
            setLoadingStep(LOADING_STEPS[2]); // "Loading Houses..."
          }
          
          if (newProgress >= 90) return prev; // Cap at 90% until complete
          return newProgress;
        });
      }, 200);

      // Detect stalled requests after 10 seconds (to account for retries and timeout)
      stallTimer = setTimeout(() => {
        if (activeRequests > 0 || isRetrying) {
          console.warn('Request appears stalled, active requests:', activeRequests, 'retrying:', isRetrying);
          setIsStalled(true);
        }
      }, 10000);

      return () => {
        clearInterval(progressInterval);
        clearTimeout(stallTimer);
      };
    } else {
      // Complete progress when no active requests
      setProgress(100);
      setLoadingStep('Ready!');
      setIsStalled(false);
      
      // Reset progress after a delay
      const resetTimer = setTimeout(() => {
        setProgress(0);
        setLoadingStep(LOADING_STEPS[0]);
      }, 500);

      return () => clearTimeout(resetTimer);
    }
  }, [activeRequests, isRetrying, retryAttempt]);

  return {
    isStalled,
    progress: Math.min(progress, 100),
    activeRequests,
    loadingStep,
  };
}
