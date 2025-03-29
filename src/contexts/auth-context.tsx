'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef
} from 'react';
import { useUser } from '@clerk/nextjs';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  clerkId: string | null;
  isSyncedWithDatabase: boolean;
  isLoadingSync: boolean;
  supabaseUserId: string | null;
  syncUser: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Debounce helper - prevents multiple rapid calls
function useDebounce<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number
): T {
  const timer = useRef<NodeJS.Timeout | null>(null);
  const pendingPromise = useRef<Promise<unknown> | null>(null);

  const debouncedFn = ((...args: Parameters<T>) => {
    // If we already have a pending promise, return it
    if (pendingPromise.current) {
      return pendingPromise.current;
    }

    // Clear existing timer
    if (timer.current) {
      clearTimeout(timer.current);
    }

    // Create new promise
    pendingPromise.current = new Promise((resolve, reject) => {
      timer.current = setTimeout(() => {
        // Call the original function and reset state
        fn(...args)
          .then((result) => {
            pendingPromise.current = null;
            resolve(result);
          })
          .catch((error) => {
            pendingPromise.current = null;
            reject(error);
          });
      }, delay);
    });

    return pendingPromise.current;
  }) as T;

  return debouncedFn;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isSyncedWithDatabase, setIsSyncedWithDatabase] = useState(false);
  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [syncAttempted, setSyncAttempted] = useState(false);
  const { toast } = useToast();

  // The core sync function
  const syncUserCore = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn || !user) return false;
    
    try {
      setIsLoadingSync(true);
      
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id // Explicitly pass the user ID in header
        }
      });
      
      if (!response.ok) {
        // Don't immediately fail for 401 - the session might just be initializing
        if (response.status === 401) {
          console.log('Auth sync: 401 unauthorized, may need to retry');
          return false;
        }
        
        const errorData = await response.json();
        console.error('User sync failed:', errorData);
        
        // Only show toast for non-auth errors to avoid spamming
        if (response.status !== 401) {
          toast({
            title: 'Sync Error',
            description: errorData.error || 'Failed to synchronize your account',
            variant: 'destructive',
          });
        }
        
        return false;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.data?.id) {
        console.error('Invalid sync response:', data);
        toast({
          title: 'Sync Error',
          description: 'Invalid response from sync service',
          variant: 'destructive',
        });
        return false;
      }
      
      setSupabaseUserId(data.data.id);
      setIsSyncedWithDatabase(true);
      return true;
    } catch (error) {
      console.error('Error during user sync:', error);
      toast({
        title: 'Sync Error',
        description: 'An unexpected error occurred during account synchronization',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoadingSync(false);
      setSyncAttempted(true);
    }
  }, [isSignedIn, user, toast]);
  
  // Debounce the sync function to prevent multiple rapid calls
  const syncUser = useDebounce(syncUserCore, 500);
  
  // Attempt sync when auth state changes
  useEffect(() => {
    // Only attempt sync if clerk auth is loaded, user is signed in,
    // we haven't synced yet, we're not currently syncing, and we haven't already attempted
    if (isLoaded && isSignedIn && !isSyncedWithDatabase && !isLoadingSync && !syncAttempted) {
      syncUser().catch(error => {
        console.error('Failed to sync user on auth state change:', error);
      });
    }
  }, [isLoaded, isSignedIn, isSyncedWithDatabase, isLoadingSync, syncUser, syncAttempted]);
  
  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: isLoaded && isSignedIn,
        userId: supabaseUserId,
        clerkId: user?.id || null,
        isSyncedWithDatabase,
        isLoadingSync,
        supabaseUserId,
        syncUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 