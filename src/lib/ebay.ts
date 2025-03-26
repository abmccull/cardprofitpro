import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./supabase/types";

const EBAY_API_URL = "https://api.ebay.com";

interface EbayTokens {
  access_token: string;
  expires_at: string;
}

/**
 * Get the eBay access token for the current user
 * Will refresh the token if it's expired
 */
export async function getEbayToken(userId: string): Promise<string | null> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    // Get the current token
    const { data: tokenData, error: fetchError } = await supabase
      .from('user_tokens')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .eq('provider', 'ebay')
      .single();
    
    if (fetchError || !tokenData) {
      console.error('No eBay token found for user', userId);
      return null;
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    // Return the token if it's not expired (with 5 minute buffer)
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
      return tokenData.access_token;
    }
    
    // Token is expired, refresh it
    const response = await fetch('/api/ebay/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('Failed to refresh eBay token');
      return null;
    }
    
    // Get the updated token data
    const { data: updatedTokenData, error: updatedFetchError } = await supabase
      .from('user_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'ebay')
      .single();
    
    if (updatedFetchError || !updatedTokenData) {
      console.error('Failed to get updated eBay token');
      return null;
    }
    
    return updatedTokenData.access_token;
  } catch (error) {
    console.error('Error getting eBay token:', error);
    return null;
  }
}

/**
 * Check if the user has authenticated with eBay
 */
export async function hasEbayAuth(userId: string): Promise<boolean> {
  try {
    const supabase = createClientComponentClient<Database>();
    
    const { data, error } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'ebay')
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('Error checking eBay auth:', error);
    return false;
  }
}

/**
 * Search for items on eBay
 */
export async function searchEbayItems(
  userId: string,
  query: string,
  options: {
    category_id?: string;
    min_price?: number;
    max_price?: number;
    condition?: string[];
    sort?: string;
    limit?: number;
  } = {}
) {
  try {
    const token = await getEbayToken(userId);
    if (!token) {
      throw new Error('No eBay token available');
    }
    
    // Build the search URL with query parameters
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);
    
    if (options.category_id) {
      searchParams.append('category_ids', options.category_id);
    }
    
    if (options.min_price) {
      searchParams.append('price', `[${options.min_price}]`);
    }
    
    if (options.min_price && options.max_price) {
      searchParams.append('price', `[${options.min_price}..${options.max_price}]`);
    }
    
    if (options.condition && options.condition.length > 0) {
      searchParams.append('conditions', options.condition.join(','));
    }
    
    if (options.sort) {
      searchParams.append('sort', options.sort);
    }
    
    searchParams.append('limit', options.limit?.toString() || '50');
    
    // Make the API request
    const response = await fetch(
      `${EBAY_API_URL}/buy/browse/v1/item_summary/search?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching eBay items:', error);
    throw error;
  }
}

/**
 * Get details for a specific eBay item
 */
export async function getEbayItem(userId: string, itemId: string) {
  try {
    const token = await getEbayToken(userId);
    if (!token) {
      throw new Error('No eBay token available');
    }
    
    // Make the API request
    const response = await fetch(
      `${EBAY_API_URL}/buy/browse/v1/item/${itemId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting eBay item:', error);
    throw error;
  }
}

/**
 * Place a bid on an eBay auction item
 */
export async function placeBid(userId: string, itemId: string, bidAmount: number) {
  try {
    const token = await getEbayToken(userId);
    if (!token) {
      throw new Error('No eBay token available');
    }
    
    // Make the API request
    const response = await fetch(
      `${EBAY_API_URL}/buy/offer/v1_beta/bidding/${itemId}/place_proxy_bid`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        },
        body: JSON.stringify({
          maxAmount: {
            value: bidAmount.toString(),
            currency: 'USD'
          }
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`eBay API error: ${response.status} ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
} 