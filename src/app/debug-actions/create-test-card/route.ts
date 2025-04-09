import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

export async function GET(request: Request) {
  // Get user ID from the query string
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required as a query parameter' },
      { status: 400 }
    );
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create a test card
    const { data, error } = await supabase
      .from('cards')
      .insert({
        name: 'API Test Card',
        player: 'Mike Trout',
        year: 2023,
        manufacturer: 'Topps',
        purchase_price: 25.99,
        status: 'Purchased',
        owner_id: userId,
        sport: 'Baseball'
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error creating test card:', error);
      return NextResponse.json(
        { error: `Failed to create test card: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test card created successfully',
      card: data
    });
  } catch (err) {
    console.error('Exception in create-test-card route:', err);
    return NextResponse.json(
      { error: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 