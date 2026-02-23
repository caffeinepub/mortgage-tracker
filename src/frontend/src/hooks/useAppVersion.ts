import { useState, useEffect } from 'react';
import { useGetCurrentAppVersion, useCheckForUpdates } from './useQueries';
import type { SerializableAppVersion } from '../lib/bigIntUtils';

const FRONTEND_VERSION: SerializableAppVersion = {
  major: 0,
  minor: 30,
  patch: 0,
  build: 0,
};

/**
 * App version management hook with deferred version checking
 * Version checks are postponed until after first render to prioritize dashboard loading
 */
export function useAppVersion() {
  const [shouldShowNotification, setShouldShowNotification] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [enableVersionCheck, setEnableVersionCheck] = useState(false);

  // Defer version checking until after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setEnableVersionCheck(true);
    }, 3000); // Wait 3 seconds after app loads

    return () => clearTimeout(timer);
  }, []);

  const { 
    data: backendVersion, 
    isLoading: versionLoading,
    error: versionError 
  } = useGetCurrentAppVersion();

  const { 
    data: isUpdateAvailable,
    error: updateCheckError 
  } = useCheckForUpdates(enableVersionCheck ? FRONTEND_VERSION : null);

  useEffect(() => {
    if (!enableVersionCheck) return;

    if (versionError || updateCheckError) {
      console.warn('Version check failed:', versionError || updateCheckError);
      setHasChecked(true);
      return;
    }

    if (!versionLoading && backendVersion && !hasChecked) {
      const timer = setTimeout(() => {
        if (isUpdateAvailable) {
          setShouldShowNotification(true);
        }
        setHasChecked(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [enableVersionCheck, backendVersion, isUpdateAvailable, versionLoading, hasChecked, versionError, updateCheckError]);

  const handleRefresh = () => {
    setShouldShowNotification(false);
    // Clear all caches before reload
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    setShouldShowNotification(false);
  };

  return {
    shouldShowNotification,
    handleRefresh,
    handleDismiss,
    frontendVersion: FRONTEND_VERSION,
    backendVersion,
  };
}
