import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './types';

// Add debug mode flag
const DEBUG_MODE = process.env.NODE_ENV !== 'production' || process.env.DEBUG === 'true';

/**
 * Creates a client-side Supabase client with enhanced error handling and debugging
 */
export function createClientSideClient() {
  // Log initialization in debug mode
  if (DEBUG_MODE) {
    console.debug('Initializing Supabase client with URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    
    // Check for missing env variables - common source of issues
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    }
  }
  
  const client = createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      global: {
        // Add error and request hooks for debugging
        fetch: (...args) => {
          // Only add hooks in debug mode to avoid performance impact in production
          if (DEBUG_MODE) {
            const [url, config] = args;
            
            // Log outgoing requests in debug mode
            console.debug(`Supabase request: ${config?.method || 'GET'} ${url}`);
            
            if (config?.body) {
              try {
                // Try to log request body if it's JSON
                const body = typeof config.body === 'string' 
                  ? JSON.parse(config.body)
                  : config.body;
                  
                console.debug('Request body:', body);
              } catch (e) {
                // Not JSON or can't be parsed, ignore
              }
            }
            
            // Wrap the original fetch to add response logging
            return fetch(...args).then(response => {
              const clonedResponse = response.clone();
              
              // Log response status
              console.debug(`Supabase response: ${response.status} ${response.statusText}`);
              
              // Try to log response body if there's an error
              if (!response.ok) {
                clonedResponse.json().catch(() => {}).then(data => {
                  console.error('Supabase error response:', data);
                });
              }
              
              return response;
            });
          }
          
          // Normal fetch in production
          return fetch(...args);
        }
      }
    }
  });
  
  return client;
} 