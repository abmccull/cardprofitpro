'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Database } from '@/types/database.types';
import { createServerClient } from '@supabase/ssr';

// eBay OAuth Configuration
// You need to register an application in the eBay Developer Program
// and fill in these values from your application settings
const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || '';
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || '';
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI || '';
const EBAY_RU_NAME = process.env.EBAY_RU_NAME || '';

// eBay Environment URLs - Production environment
const EBAY_AUTH_URL = 'https://auth.ebay.com/oauth2/authorize';
const EBAY_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';
const EBAY_API_URL = 'https://api.ebay.com';

// Scopes required for the application
// See https://developer.ebay.com/api-docs/static/oauth-scopes.html
const EBAY_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.marketing',
  'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
  'https://api.ebay.com/oauth/api_scope/sell.finances',
  'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
];

// This function generates a state parameter for CSRF protection
export async function initiateEbayAuth() {
  if (!EBAY_CLIENT_ID || !EBAY_REDIRECT_URI) {
    throw new Error('eBay OAuth configuration is incomplete');
  }

  try {
    // Verify user is authenticated - improved cookie handling
    const cookieStore = cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });
    
    // Explicitly await the session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Auth error:", error.message);
      redirect('/login?returnUrl=/ebay-integration&error=Authentication error: ' + error.message);
    }
    
    if (!data.session?.user.id) {
      redirect('/login?returnUrl=/ebay-integration&error=Please log in to connect your eBay account');
    }
    
    // Generate a random state parameter for CSRF protection
    const state = randomBytes(16).toString('hex');
    
    // Store the state in the server-side session or a database for verification
    const { error: upsertError } = await supabase
      .from('user_sessions')
      .upsert({ 
        user_id: data.session.user.id, 
        oauth_state: state, 
        updated_at: new Date().toISOString() 
      }, { 
        onConflict: 'user_id' 
      });
      
    if (upsertError) {
      console.error("Database error:", upsertError);
      throw new Error('Failed to store OAuth state');
    }

    // Construct the authorization URL
    const authUrl = new URL(EBAY_AUTH_URL);
    authUrl.searchParams.append('client_id', EBAY_CLIENT_ID);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', EBAY_REDIRECT_URI);
    authUrl.searchParams.append('scope', EBAY_SCOPES.join(' '));
    authUrl.searchParams.append('state', state);

    // Redirect user to eBay authorization page
    redirect(authUrl.toString());
  } catch (error) {
    console.error("eBay auth initiation error:", error);
    // If there's an error in the auth flow, redirect to login
    redirect('/login?returnUrl=/ebay-integration&error=Authentication failed. Please try again.');
  }
}

// This function handles the OAuth callback and exchanges the code for tokens
export async function handleEbayCallback(code: string, state: string) {
  if (!code || !state) {
    throw new Error('Missing required OAuth parameters');
  }

  // Verify user is authenticated
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user.id) {
    redirect('/login?returnUrl=/ebay-integration&error=Session expired. Please log in again.');
  }

  // Verify the state parameter to prevent CSRF attacks
  const { data: sessionData, error: sessionError } = await supabase
    .from('user_sessions')
    .select('oauth_state')
    .eq('user_id', session.user.id)
    .single();

  if (sessionError || !sessionData?.oauth_state || sessionData.oauth_state !== state) {
    throw new Error('Invalid OAuth state parameter');
  }

  // Exchange the authorization code for access and refresh tokens
  const tokenResponse = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: EBAY_REDIRECT_URI,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error(`Failed to exchange code for tokens: ${tokenResponse.statusText}`);
  }

  const tokenData = await tokenResponse.json();
  
  // Calculate token expiration date
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

  // Get the eBay user info for reference
  const userInfoResponse = await fetch(`${EBAY_API_URL}/commerce/identity/v1/user`, {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  let ebayUserId = null;
  if (userInfoResponse.ok) {
    const userInfo = await userInfoResponse.json();
    ebayUserId = userInfo.username || null;
  }

  // Store tokens in the database
  const { error: tokenError } = await supabase
    .from('ebay_tokens')
    .upsert({
      user_id: session.user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      ebay_user_id: ebayUserId,
    }, {
      onConflict: 'user_id',
    });

  if (tokenError) {
    throw new Error(`Failed to store eBay tokens: ${tokenError.message}`);
  }

  // Clear the state from the database
  await supabase
    .from('user_sessions')
    .update({ oauth_state: null })
    .eq('user_id', session.user.id);

  return { success: true, ebayUserId };
}

// Function to refresh the access token when it expires
export async function refreshEbayToken(userId: string) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Get the current tokens
  const { data: tokenData, error: tokenError } = await supabase
    .from('ebay_tokens')
    .select('refresh_token, expires_at')
    .eq('user_id', userId)
    .single();

  if (tokenError || !tokenData) {
    throw new Error('eBay tokens not found');
  }

  // Check if the token is still valid
  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);
  
  // If the token is not expired yet, we don't need to refresh
  if (expiresAt > now) {
    return { success: true, message: 'Token is still valid' };
  }

  // Exchange the refresh token for a new access token
  const refreshResponse = await fetch(EBAY_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
      scope: EBAY_SCOPES.join(' '),
    }).toString(),
  });

  if (!refreshResponse.ok) {
    throw new Error(`Failed to refresh token: ${refreshResponse.statusText}`);
  }

  const refreshData = await refreshResponse.json();
  
  // Calculate new expiration date
  const newExpiresAt = new Date();
  newExpiresAt.setSeconds(newExpiresAt.getSeconds() + refreshData.expires_in);

  // Update the tokens in the database
  const { error: updateError } = await supabase
    .from('ebay_tokens')
    .update({
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token || tokenData.refresh_token, // Some implementations don't return a new refresh token
      expires_at: newExpiresAt.toISOString(),
      scope: refreshData.scope,
      token_type: refreshData.token_type,
      updated_at: now.toISOString(),
    })
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Failed to update refreshed tokens: ${updateError.message}`);
  }

  return { success: true, message: 'Token refreshed successfully' };
}

// Function to get the eBay connection status for a user
export async function getEbayConnectionStatus() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user.id) {
    return { connected: false, reason: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('ebay_tokens')
    .select('expires_at, ebay_user_id, created_at')
    .eq('user_id', session.user.id)
    .single();

  if (error || !data) {
    return { connected: false, reason: 'No eBay account connected' };
  }

  const now = new Date();
  const expiresAt = new Date(data.expires_at);
  
  // If token is expired, try to refresh it
  if (expiresAt <= now) {
    try {
      await refreshEbayToken(session.user.id);
      return { 
        connected: true, 
        ebayUserId: data.ebay_user_id,
        connectedAt: data.created_at,
        tokenStatus: 'refreshed'
      };
    } catch (error) {
      return { 
        connected: false, 
        reason: 'Token expired and refresh failed',
        ebayUserId: data.ebay_user_id,
        connectedAt: data.created_at
      };
    }
  }

  return { 
    connected: true, 
    ebayUserId: data.ebay_user_id,
    connectedAt: data.created_at,
    tokenStatus: 'valid',
    expiresAt: data.expires_at
  };
}

/**
 * Stores the OAuth state in the user_sessions table for CSRF protection.
 */
export async function storeOauthState(state: string): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
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
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.delete(name);
        },
      },
    }
  );
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    // Use 'any' cast due to potential type mismatches
    const { error } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        oauth_state: state,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
      
    if (error) {
      console.error('Error storing OAuth state:', error);
      throw new Error('Failed to store OAuth state');
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Disconnects the eBay account by deleting the token from the database.
 */
export async function disconnectEbay(): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
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
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.delete(name);
        },
      },
    }
  );
  
  if (!userId) {
    return { success: false, error: 'User not authenticated' };
  }
  
  try {
    // Use 'any' cast due to potential type mismatches
    const { error } = await supabase
      .from('ebay_tokens')
      .delete()
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error deleting eBay tokens:', error);
      throw new Error('Failed to disconnect eBay account');
    }
    
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
} 