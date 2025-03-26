import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { 
  getOrderProgressByOrderNumber,
  PSAOrderProgress,
  PSAOrderResponse
} from '@/lib/psa-api';
import type { Database } from '@/lib/supabase/types';

export async function GET(
  request: Request
) {
  try {
    // Verify authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the order number from query parameters
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Missing required parameter: orderNumber' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if we already have this order in our database
    const { data: existingOrder, error: fetchError } = await supabase
      .from('psa_grading_orders')
      .select('*')
      .eq('order_number', orderNumber)
      .eq('user_id', user.id)
      .single();
    
    // If we have recent data (less than 1 hour old), use it
    if (existingOrder && !fetchError) {
      const lastChecked = new Date(existingOrder.last_checked);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate < 60) {
        return NextResponse.json({ data: existingOrder });
      }
    }
    
    // Fetch fresh data from PSA API
    const orderData: PSAOrderResponse = await getOrderProgressByOrderNumber(orderNumber);
    
    if (!orderData || !orderData.OrderProgress) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const progress = orderData.OrderProgress;
    
    // Transform data to our format
    const orderProgress = {
      user_id: user.id,
      order_number: progress.orderNumber,
      order_is_pending: progress.orderIsPending,
      order_in_assembly: progress.orderInAssembly,
      order_is_in_progress: progress.orderIsInProgress,
      grades_ready: progress.gradesReady,
      shipped: progress.shipped,
      ship_tracking_number: progress.shipTrackingNumber,
      ship_date: progress.shipDate ? progress.shipDate : null,
      estimated_completion_date: progress.estimatedCompletionDate ? progress.estimatedCompletionDate : null,
      last_checked: new Date().toISOString()
    };
    
    // Store or update in database
    const { data: updatedData, error } = await supabase
      .from('psa_grading_orders')
      .upsert(orderProgress, { onConflict: 'order_number' })
      .select()
      .single();
    
    if (error) {
      console.error('Error storing PSA order data:', error);
      // Return the data we fetched even if storage failed
      return NextResponse.json({ data: orderProgress });
    }
    
    return NextResponse.json({ data: updatedData || orderProgress });
  } catch (error: any) {
    console.error('Error in PSA order API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PSA order data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    // Verify authentication
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { orderNumber } = body;
    
    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Missing required parameter: orderNumber' },
        { status: 400 }
      );
    }
    
    // Start tracking a new order (fetch current status first)
    const orderData: PSAOrderResponse = await getOrderProgressByOrderNumber(orderNumber);
    
    if (!orderData || !orderData.OrderProgress) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const progress = orderData.OrderProgress;
    
    // Transform data to our format
    const orderProgress = {
      user_id: user.id,
      order_number: progress.orderNumber,
      order_is_pending: progress.orderIsPending,
      order_in_assembly: progress.orderInAssembly,
      order_is_in_progress: progress.orderIsInProgress,
      grades_ready: progress.gradesReady,
      shipped: progress.shipped,
      ship_tracking_number: progress.shipTrackingNumber,
      ship_date: progress.shipDate ? progress.shipDate : null,
      estimated_completion_date: progress.estimatedCompletionDate ? progress.estimatedCompletionDate : null,
      last_checked: new Date().toISOString()
    };
    
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Store in database
    const { data, error } = await supabase
      .from('psa_grading_orders')
      .upsert(orderProgress, { onConflict: 'order_number' })
      .select()
      .single();
    
    if (error) {
      console.error('Error storing PSA order data:', error);
      return NextResponse.json(
        { error: 'Failed to store PSA order data' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data, message: 'Successfully added order to tracking' });
  } catch (error: any) {
    console.error('Error in PSA order API:', error);
    return NextResponse.json(
      { error: 'Failed to add PSA order tracking' },
      { status: 500 }
    );
  }
} 