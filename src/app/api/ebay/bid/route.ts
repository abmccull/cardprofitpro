import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { placeBid } from '@/lib/ebay';
import type { Database } from '@/lib/supabase/types';

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { snipeId } = body;

    if (!snipeId) {
      return NextResponse.json(
        { error: 'Missing required parameter: snipeId' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get snipe details
    const { data: snipe, error: snipeError } = await supabase
      .from('snipes')
      .select('*')
      .eq('id', snipeId)
      .eq('user_id', user.id)
      .single();

    if (snipeError || !snipe) {
      return NextResponse.json(
        { error: 'Snipe not found or not authorized' },
        { status: 404 }
      );
    }

    // Check if already bid
    if (snipe.status === 'completed' || snipe.status === 'error') {
      return NextResponse.json(
        { error: `Snipe is already in ${snipe.status} status` },
        { status: 400 }
      );
    }

    // Update status to processing
    await supabase
      .from('snipes')
      .update({ status: 'processing' })
      .eq('id', snipeId);
    
    try {
      // Place bid through eBay API
      const bidResult = await placeBid(
        user.id,
        snipe.item_id,
        snipe.max_bid
      );
      
      // Update status to completed
      await supabase
        .from('snipes')
        .update({
          status: 'completed',
          bid_placed_at: new Date().toISOString(),
          bid_response: bidResult,
        })
        .eq('id', snipeId);
      
      return NextResponse.json({
        success: true,
        message: 'Bid placed successfully',
        bidResult
      });
    } catch (bidError: any) {
      console.error('Error placing bid:', bidError);
      
      // Update status to error
      await supabase
        .from('snipes')
        .update({
          status: 'error',
          error_message: bidError.message || 'Failed to place bid',
        })
        .eq('id', snipeId);
      
      return NextResponse.json(
        { error: 'Failed to place bid', details: bidError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in bid API:', error);
    return NextResponse.json(
      { error: 'Failed to process bid request' },
      { status: 500 }
    );
  }
} 