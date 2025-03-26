import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { exchangeEbayCode } from '@/lib/ebay/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=No authorization code provided`
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=Unauthorized`
      );
    }

    // Exchange code for tokens
    const { access_token, refresh_token, expires_in } = await exchangeEbayCode(code);

    // Store eBay credentials
    const { error: updateError } = await supabase
      .from('user_connections')
      .upsert({
        user_id: session.user.id,
        provider: 'ebay',
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error storing eBay credentials:', updateError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=Failed to store eBay credentials`
      );
    }

    // Redirect to settings page with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=Successfully connected eBay account`
    );
  } catch (error) {
    console.error('Error in eBay callback:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=Failed to connect eBay account`
    );
  }
} 