import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import type { Database } from '@/lib/supabase/types';

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID!;
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET!;
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI!;

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      // Redirect to eBay authorization page
      const scopes = [
        'https://api.ebay.com/oauth/api_scope',
        'https://api.ebay.com/oauth/api_scope/buy.offer.auction',
      ];

      const authUrl = `https://auth.ebay.com/oauth2/authorize?` +
        `client_id=${EBAY_CLIENT_ID}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(EBAY_REDIRECT_URI)}&` +
        `scope=${encodeURIComponent(scopes.join(' '))}`;

      return NextResponse.redirect(authUrl);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: EBAY_REDIRECT_URI,
      }).toString(),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Store tokens in Supabase
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const { error } = await supabase
      .from('user_tokens')
      .upsert({
        user_id: user.id,
        provider: 'ebay',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      });

    if (error) throw error;

    // Redirect back to the dashboard
    return NextResponse.redirect(new URL('/card-discovery', request.url));
  } catch (error) {
    console.error('Error in eBay auth:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with eBay' },
      { status: 500 }
    );
  }
} 