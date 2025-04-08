import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
// Import from @supabase/ssr
import { createServerClient } from '@supabase/ssr';
import EbayIntegrationClient from './components/ebay-integration-client';
import type { Database } from '@/types/database.types';

interface EbayConnectionStatus {
  connected: boolean;
  reason?: string;
  ebayUserId?: string | null;
  connectedAt?: string;
  tokenStatus?: string;
  expiresAt?: string;
}

async function getEbayConnectionStatus(userId: string): Promise<EbayConnectionStatus> {
  const cookieStore = await cookies(); // Await cookies()
  
  // Use createServerClient from @supabase/ssr
  const supabase = createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // Add set and remove methods for the client to work correctly
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          // cookieStore.delete needs specific options object or just the name
          // Pass only the name for simplicity here
          cookieStore.delete(name);
        },
      },
    }
  );
  
  try {
    // Query the ebay_tokens table
    const { data, error } = await supabase
      .from('ebay_tokens') // This table exists but isn't in the current Database type
      .select('expires_at, ebay_user_id, created_at')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) {
      console.log(`No eBay token found for user ${userId}:`, error?.message);
      return { connected: false, reason: 'No eBay account connected' };
    }
    
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (expiresAt <= now) {
      // We won't attempt refresh here, keep it simple for status check
      console.log(`eBay token expired for user ${userId}`);
      return {
        connected: false,
        reason: 'Token expired',
        ebayUserId: data.ebay_user_id,
        connectedAt: data.created_at
      };
    }
    
    // Token is valid
    return {
      connected: true,
      ebayUserId: data.ebay_user_id,
      connectedAt: data.created_at,
      tokenStatus: 'valid',
      expiresAt: data.expires_at
    };
  } catch (err) {
    console.error('Server Error getting eBay connection status:', err);
    return { connected: false, reason: 'Error checking connection status' };
  }
}

export default async function EbayIntegrationPage() {
  // Correctly await auth() and extract userId
  const { userId } = await auth(); 
  
  if (!userId) {
    // Should be handled by middleware, but good practice to check
    return <div>Not authenticated</div>;
  }
  
  const initialStatus = await getEbayConnectionStatus(userId);
  
  return (
    <EbayIntegrationClient initialStatus={initialStatus} />
  );
} 