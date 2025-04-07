import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for server components with admin access
export async function createServerClient() {
  // Get Supabase connection details
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  
  // Use service role key for server functions (has admin privileges and bypasses RLS)
  // IMPORTANT: Only use this on the server, never expose this key to the client
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log('Server connection details:', {
    url: supabaseUrl,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    usingAnonKey: !process.env.SUPABASE_SERVICE_ROLE_KEY
  });
  
  // Create Supabase client with admin privileges
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
} 