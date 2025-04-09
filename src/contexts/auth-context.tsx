'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth as useClerkAuth, useSession } from '@clerk/nextjs';
import { useToast } from '@/components/ui-migrated/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';

type AuthContextType = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  supabase: ReturnType<typeof createClientComponentClient<Database>> | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const { session } = useSession();
  const { toast } = useToast();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClientComponentClient<Database>> | null>(null);

  // Initialize Supabase client using the helper
  useEffect(() => {
    // Check Clerk readiness
    if (!isLoaded || !session) {
      setSupabase(null);
      return;
    }

    try {
      // Create Supabase client using the helper designed for client components
      // This helper handles cookie management and might be necessary for the native integration
      const supabaseClient = createClientComponentClient<Database>();
      setSupabase(supabaseClient);
      console.log('Supabase client initialized using createClientComponentClient helper');

    } catch (error) {
      console.error('Error initializing Supabase client with helper:', error);
      toast({
        title: 'Connection Error',
        description: `Failed to connect to the database. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
      setSupabase(null);
    }

    // Cleanup function
    return () => {
      // No explicit cleanup needed for the helper client instance itself
      // but we reset the state if the component unmounts or dependencies change
      setSupabase(null);
    };
  // Dependencies now only rely on Clerk's readiness and session object presence
  }, [isLoaded, session, toast]);

  return (
    <AuthContext.Provider
      value={{
        isLoaded,
        isSignedIn: isLoaded && !!isSignedIn,
        userId: userId ?? null,
        supabase,
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