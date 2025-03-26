import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const searchSchema = z.object({
  query: z.string(),
  filters: z.object({
    sport: z.string().optional(),
    product: z.string().optional(),
    isRookie: z.boolean().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    condition: z.array(z.string()).optional(),
    sortOrder: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, filters } = searchSchema.parse(body);

    let queryBuilder = supabase
      .from('players')
      .select(`
        player_id,
        player_name,
        is_rookie,
        rookie_year,
        sports (
          sport_name
        )
      `);

    // Apply text search
    if (query) {
      queryBuilder = queryBuilder.ilike('player_name', `%${query}%`);
    }

    // Apply filters
    if (filters.sport) {
      queryBuilder = queryBuilder.eq('sports.sport_name', filters.sport);
    }

    if (filters.isRookie) {
      queryBuilder = queryBuilder.eq('is_rookie', true);
    }

    // Execute query
    const { data: players, error } = await queryBuilder;

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
} 