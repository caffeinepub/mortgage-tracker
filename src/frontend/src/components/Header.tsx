import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { LogOut, Moon, Sun, User, LayoutGrid, Store } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import ConnectionStatusIndicator from './ConnectionStatusIndicator';
import { offlineStorage } from '../lib/offlineStorage';

interface HeaderProps {
  userName?: string;
}

export default function Header({ userName }: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const isOverviewPage = routerState.location.pathname === '/';
  const isAppStoreListingPage = routerState.location.pathname === '/app-store-listing';

  const displayName = userName;
  const displayId = identity 
    ? identity.getPrincipal().toString().slice(0, 20) + '...'
    : '';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    offlineStorage.clearAllData();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <img 
                  src="/assets/generated/house-loading-icon-transparent.dim_64x64.png" 
                  alt="Mortgage Tracker" 
                  className="w-6 h-6"
                />
              </div>
              <span className="text-xl font-bold">Mortgage Tracker</span>
            </button>
            
            {!isOverviewPage && !isAppStoreListingPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: '/' })}
                className="ml-2"
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Houses Overview
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ConnectionStatusIndicator />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/app-store-listing' })}
              className="hidden md:flex"
            >
              <Store className="mr-2 h-4 w-4" />
              App Store Listing
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {displayName ? getInitials(displayName) : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {displayName || 'Account'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {displayId}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: '/app-store-listing' })} className="md:hidden">
                  <Store className="mr-2 h-4 w-4" />
                  <span>App Store Listing</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
