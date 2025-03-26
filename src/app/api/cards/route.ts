import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { CardStatus } from '@/lib/supabase/types';

const cardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  year: z.number().optional(),
  manufacturer: z.string().optional(),
  purchase_price: z.number().optional(),
  current_value: z.number().optional(),
  status: z.enum(['raw', 'submitted', 'graded', 'listed', 'sold']).default('raw'),
  image_url: z.string().url().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as CardStatus | null;
    const name = searchParams.get('name');
    const year = searchParams.get('year');
    const manufacturer = searchParams.get('manufacturer');
    const maxPrice = searchParams.get('maxPrice');

    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('cards')
      .select(`
        *,
        market_data (
          platform,
          sale_price,
          condition,
          sale_date,
          listing_url
        ),
        deal_analyses (
          predicted_grade,
          confidence_score,
          estimated_value,
          potential_roi,
          analysis_date
        )
      `)
      .eq('owner_id', session.user.id);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    if (year) {
      query = query.eq('year', parseInt(year));
    }
    if (manufacturer) {
      query = query.ilike('manufacturer', `%${manufacturer}%`);
    }
    if (maxPrice) {
      query = query.lte('purchase_price', parseFloat(maxPrice));
    }

    // Order by most recently updated
    query = query.order('updated_at', { ascending: false });

    const { data: cards, error } = await query;

    if (error) {
      console.error('Error fetching cards:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cards' },
        { status: 500 }
      );
    }

    // Transform the data to include the latest market data and analysis
    const transformedCards = cards.map(card => ({
      id: card.id,
      name: card.name,
      year: card.year,
      manufacturer: card.manufacturer,
      grade: card.grade,
      purchase_price: card.purchase_price,
      current_value: card.current_value,
      status: card.status,
      image_url: card.image_url,
      latest_market_data: card.market_data?.[0],
      latest_analysis: card.deal_analyses?.[0],
      created_at: card.created_at,
      updated_at: card.updated_at,
    }));

    return NextResponse.json({ data: transformedCards });
  } catch (error) {
    console.error('Error in cards GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = cardSchema.parse(body);

    // Create card
    const { data: card, error } = await supabase
      .from('cards')
      .insert([
        {
          ...validatedData,
          owner_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating card:', error);
      return NextResponse.json(
        { error: 'Failed to create card' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: card }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in cards POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 