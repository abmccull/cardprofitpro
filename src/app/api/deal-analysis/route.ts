import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    const cardId = formData.get('cardId') as string;

    if (!image || !userId) {
      return NextResponse.json(
        { error: 'Image and userId are required' },
        { status: 400 }
      );
    }

    // TODO: Implement image analysis with TensorFlow.js or Google Cloud Vision
    // For now, return mock analysis data
    const mockAnalysis = {
      predicted_grade: 8.5,
      confidence_score: 0.85,
      estimated_value: 250.00,
      potential_profit: 100.00,
      roi: 0.67,
      user_id: userId,
      card_id: cardId,
    };

    const { data, error } = await supabase
      .from('deal_analyses')
      .insert([mockAnalysis])
      .select()
      .single();

    if (error) {
      console.error('Error creating deal analysis:', error);
      return NextResponse.json(
        { error: 'Failed to create deal analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('deal_analyses')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching deal analysis:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deal analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 