import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

// Define a type for options to prevent issues with too strict type checking
type ClientOptions = any;

// Singleton instance of the Supabase client
let supabaseClientInstance: any = null;

/**
 * Creates or returns a singleton Supabase client with auth features explicitly configured
 * to prevent conflicts with Clerk authentication.
 */
export function createClient(options?: ClientOptions) {
  // Return existing instance if already created
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }
  
  const defaultOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  };
  
  // Create with auth features explicitly configured
  supabaseClientInstance = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: options ? { ...defaultOptions, ...options } : defaultOptions
  });
  
  return supabaseClientInstance;
}

/**
 * Explicitly clear the singleton instance - mainly for testing purposes
 * or when you need to create a fresh client with different options
 */
export function clearClient() {
  supabaseClientInstance = null;
} 