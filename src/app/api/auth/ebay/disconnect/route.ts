import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete eBay connection
    const { error: deleteError } = await supabase
      .from('user_connections')
      .delete()
      .eq('user_id', session.user.id)
      .eq('provider', 'ebay');

    if (deleteError) {
      console.error('Error deleting eBay connection:', deleteError);
      return NextResponse.json(
        { error: 'Failed to disconnect eBay account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting eBay account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 