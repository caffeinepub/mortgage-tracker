import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useBackgroundSync } from '../hooks/useBackgroundSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { offlineStorage } from '../lib/offlineStorage';

export default function ConnectionStatusIndicator() {
  const { isOnline } = useConnectionStatus();
  const { syncNow, pendingCount } = useBackgroundSync();
  const lastSync = offlineStorage.getLastSyncTime();

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="hidden sm:inline text-xs">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="hidden sm:inline text-xs">Offline</span>
            </>
          )}
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Connection Status</h4>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm">Connected to the internet</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm">Working offline</span>
                </>
              )}
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending changes</span>
                <Badge variant="secondary">{pendingCount}</Badge>
              </div>
              {isOnline && (
                <Button 
                  onClick={syncNow} 
                  size="sm" 
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Sync Now
                </Button>
              )}
              {!isOnline && (
                <p className="text-xs text-muted-foreground">
                  Changes will sync automatically when you're back online
                </p>
              )}
            </div>
          )}

          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Last synced</span>
              <span>{formatLastSync(lastSync)}</span>
            </div>
          </div>

          {!isOnline && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                All your data is saved locally. You can continue adding houses and payments while offline.
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
