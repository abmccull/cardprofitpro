import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const product = searchParams.get('product');

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get players for the selected sport
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select(`
        player_id,
        player_name,
        is_rookie,
        rookie_year,
        sports (
          sport_name
        )
      `)
      .eq('sports.sport_name', sport)
      .order('player_name');

    if (playersError) {
      console.error('Error fetching players:', playersError);
      return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 });
    }

    // Get products for the selected sport
    const { data: products, error: productsError } = await supabase
      .from('sport_product_mapping')
      .select(`
        products (
          product_id,
          product_name
        ),
        sports (
          sport_name
        )
      `)
      .eq('sports.sport_name', sport);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      players: players || [],
      products: products?.map(mapping => mapping.products) || []
    });

  } catch (error) {
    console.error('Error in top-100 route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 