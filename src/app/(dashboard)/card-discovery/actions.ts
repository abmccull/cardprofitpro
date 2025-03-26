'use server';

import { searchEbayListings } from '@/lib/ebay/client';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface SearchData {
  query: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: 'new' | 'used' | 'not_specified';
}

export async function searchAction(data: SearchData) {
  const supabase = createServerComponentClient({ cookies });
  
  // Get access token from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const { data: ebayTokens } = await supabase
    .from('ebay_tokens')
    .select('access_token')
    .eq('user_id', session?.user.id)
    .single();

  if (!ebayTokens?.access_token) {
    throw new Error('No eBay access token found');
  }

  // Convert price strings to numbers
  const minPrice = data.minPrice ? parseFloat(data.minPrice) : undefined;
  const maxPrice = data.maxPrice ? parseFloat(data.maxPrice) : undefined;

  // Search eBay
  const results = await searchEbayListings({
    query: data.query,
    minPrice,
    maxPrice,
    condition: data.condition ? [data.condition] : undefined,
    accessToken: ebayTokens.access_token,
  });

  return results;
} 