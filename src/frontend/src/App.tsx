import { useInternetIdentity } from './hooks/useInternetIdentity';
import LoginPage from './pages/LoginPage';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetupModal from './components/ProfileSetupModal';
import LoadingAnimation from './components/LoadingAnimation';
import UpdateNotification from './components/UpdateNotification';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { useAppVersion } from './hooks/useAppVersion';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { useConnectionStatus } from './hooks/useConnectionStatus';
import { useBootstrapData } from './hooks/useBootstrapData';
import { useStartupPreload } from './hooks/useStartupPreload';
import { useReactQueryStartupDefaults } from './hooks/useReactQueryStartupDefaults';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { lazy, Suspense, Component, ReactNode, useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useActorWithRetry } from './hooks/useActorWithRetry';
import { offlineStorage } from './lib/offlineStorage';
import { toast } from 'sonner';

// Lazy load pages for better performance
const HousesOverview = lazy(() => import('./pages/HousesOverview'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AppStoreListing = lazy(() => import('./pages/AppStoreListing'));

// Clean up legacy username/password auth artifacts
function cleanupLegacyAuth() {
  try {
    const legacyKeys = [
      'mortgage_tracker_session_token',
      'mortgage_tracker_username',
      'mortgage_tracker_users'
    ];
    
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log('Removing legacy auth key:', key);
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error cleaning up legacy auth:', error);
  }
}

// Top-level Error Boundary Component
class ErrorBoundary extends Component<
  { children: ReactNode; onRetry?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; onRetry?: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error Boundary - Full error details:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Something went wrong</h1>
              <p className="text-muted-foreground">
                The application encountered an unexpected error. Please try again.
              </p>
              {this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <Button onClick={this.handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Layout component that includes Header and Footer
function Layout() {
  const { data: userProfile } = useGetCallerUserProfile();
  
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header userName={userProfile?.name} />
      <main className="flex-1">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            </div>
          </div>
        }>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

// Define routes
const rootRoute = createRootRoute({
  component: Layout,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HousesOverview,
});

const houseDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/house/$houseId',
  component: Dashboard,
});

const appStoreListingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app-store-listing',
  component: AppStoreListing,
});

const routeTree = rootRoute.addChildren([overviewRoute, houseDetailRoute, appStoreListingRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { identity, isInitializing: iiInitializing, loginError: iiError } = useInternetIdentity();
  const { 
    data: userProfile, 
    isLoading: profileLoading, 
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const { shouldShowNotification, handleRefresh, handleDismiss } = useAppVersion();
  const { wasOffline } = useConnectionStatus();
  const { 
    actor, 
    isRetrying, 
    retryAttempt, 
    maxRetries, 
    hasError: actorHasError,
  } = useActorWithRetry();
  
  // Configure React Query defaults for optimized startup
  useReactQueryStartupDefaults();
  
  // State management
  const [showDashboard, setShowDashboard] = useState(false);
  const [startupPhase, setStartupPhase] = useState<'initializing' | 'ready' | 'error'>('initializing');
  const hasCachedData = useRef(false);
  
  // Determine if user is authenticated via Internet Identity only
  const isAuthenticated = !!identity;
  const isAuthInitializing = iiInitializing;
  const hasAuthError = !!iiError;

  // Defer background sync until after first render
  const [enableBackgroundSync, setEnableBackgroundSync] = useState(false);
  useBackgroundSync(enableBackgroundSync);

  // Bootstrap data fetching (after actor is ready)
  const { hasBootstrapped } = useBootstrapData(isAuthenticated && !!actor && showDashboard);
  
  // Startup preload (after dashboard is shown)
  useStartupPreload(showDashboard && isAuthenticated);

  // Clean up legacy auth on mount
  useEffect(() => {
    cleanupLegacyAuth();
  }, []);

  // Check for cached data on mount
  useEffect(() => {
    try {
      const houses = offlineStorage.getHouses();
      const profile = offlineStorage.getProfile();
      hasCachedData.current = houses.length > 0 || profile !== null;
      console.log('Cached data available:', hasCachedData.current);
    } catch (error) {
      console.error('Error checking cached data:', error);
      hasCachedData.current = false;
    }
  }, []);

  // Set user ID in offline storage when authenticated
  useEffect(() => {
    if (!isAuthenticated || !identity) return;
    
    try {
      const userId = identity.getPrincipal().toString();
      offlineStorage.setUserId(userId);
      console.log('Set offline storage user ID from Internet Identity');
    } catch (error) {
      console.error('Error setting user ID in offline storage:', error);
    }
  }, [identity, isAuthenticated]);

  // Main startup logic - render shell immediately when cached data exists
  useEffect(() => {
    // Phase 1: Wait for authentication to complete
    if (isAuthInitializing) {
      console.log('Waiting for authentication initialization...');
      return;
    }

    // Phase 2: Authentication complete - check if user is logged in
    if (!isAuthenticated) {
      console.log('User not authenticated - showing login page');
      setStartupPhase('ready');
      return;
    }

    // Phase 3: User is authenticated - show dashboard immediately if we have cached data
    if (hasCachedData.current && !showDashboard) {
      console.log('User authenticated with cached data - showing dashboard immediately');
      setShowDashboard(true);
      setStartupPhase('ready');
      return;
    }

    // Phase 4: No cached data - wait for actor connection with timeout
    if (!hasCachedData.current) {
      if (actor && !isRetrying) {
        console.log('Backend connected - showing dashboard');
        setShowDashboard(true);
        setStartupPhase('ready');
        return;
      }

      // Show error after max retries
      if (actorHasError && retryAttempt >= maxRetries) {
        console.log('No cached data and backend connection failed');
        setStartupPhase('error');
        return;
      }
    }
  }, [
    isAuthInitializing, 
    isAuthenticated, 
    actor, 
    isRetrying, 
    retryAttempt, 
    maxRetries,
    actorHasError,
    showDashboard
  ]);

  // Show notification when coming back online
  useEffect(() => {
    if (wasOffline) {
      toast.success('Back online! Syncing your data...');
    }
  }, [wasOffline]);

  // Enable background sync after dashboard is shown
  useEffect(() => {
    if (showDashboard && isAuthenticated) {
      const timer = setTimeout(() => {
        setEnableBackgroundSync(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showDashboard, isAuthenticated]);

  // Show loading animation during initialization (only when no cached data)
  if (startupPhase === 'initializing' && !hasCachedData.current) {
    const progress = isAuthInitializing ? 20 : Math.min((retryAttempt + 1) * 15 + 20, 80);
    const step = isAuthInitializing 
      ? 'Restoring session...' 
      : isRetrying 
        ? `Connecting... (attempt ${retryAttempt + 1}/${maxRetries})`
        : 'Connecting to backend...';
    
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md px-4">
          <LoadingAnimation 
            message="Initializing..." 
            progress={progress}
            step={step}
          />
        </div>
      </div>
    );
  }

  // Show error screen if startup failed
  if (startupPhase === 'error') {
    const errorMessage = hasAuthError 
      ? 'Authentication failed. Please check your connection and try again.'
      : 'Unable to connect. Please check your internet connection and try again.';
    
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Connection Issue</h1>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show profile setup if user is authenticated but has no profile
  const showProfileSetup = isAuthenticated && showDashboard && profileFetched && userProfile === null;

  // Render main application
  return (
    <>
      <RouterProvider router={router} />
      <ProfileSetupModal open={showProfileSetup} />
      <UpdateNotification 
        open={shouldShowNotification} 
        onRefresh={handleRefresh}
        onDismiss={handleDismiss}
      />
    </>
  );
}

export default function App() {
  const [retryKey, setRetryKey] = useState(0);
  
  const handleRetry = () => {
    console.log('Retrying app initialization...');
    setRetryKey(prev => prev + 1);
  };

  return (
    <ErrorBoundary key={retryKey} onRetry={handleRetry}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
