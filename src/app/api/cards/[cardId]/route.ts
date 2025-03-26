import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';

const updateCardSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  year: z.number().optional(),
  manufacturer: z.string().optional(),
  grade: z.string().optional(),
  purchase_price: z.number().optional(),
  current_value: z.number().optional(),
  status: z.enum(['raw', 'submitted', 'graded', 'listed', 'sold']).optional(),
  image_url: z.string().url().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = updateCardSchema.parse(body);

    // Update card
    const { data: card, error } = await supabase
      .from('cards')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.cardId)
      .eq('owner_id', session.user.id) // Ensure user owns the card
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
      .single();

    if (error) {
      console.error('Error updating card:', error);
      return NextResponse.json(
        { error: 'Failed to update card' },
        { status: 500 }
      );
    }

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found or unauthorized' },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedCard = {
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
    };

    return NextResponse.json({ data: transformedCard });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error in card update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete card (RLS will ensure user owns the card)
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', params.cardId)
      .eq('owner_id', session.user.id);

    if (error) {
      console.error('Error deleting card:', error);
      return NextResponse.json(
        { error: 'Failed to delete card' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in card delete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 