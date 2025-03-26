import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { searchEbayListings, getCompletedSales } from '@/lib/ebay/client';

export async function GET(
  request: Request,
  { params }: { params: { cardId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get card details to ensure ownership and get search query
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', params.cardId)
      .eq('owner_id', session.user.id)
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { error: 'Card not found or unauthorized' },
        { status: 404 }
      );
    }

    // Build search query
    const searchQuery = [
      card.name,
      card.year,
      card.manufacturer,
      card.grade,
    ].filter(Boolean).join(' ');

    // Fetch current listings and completed sales from eBay
    const [activeListings, completedSales] = await Promise.all([
      searchEbayListings(searchQuery),
      getCompletedSales(searchQuery),
    ]);

    // Store market data
    const marketData = [...activeListings, ...completedSales].map(listing => ({
      card_id: params.cardId,
      platform: 'ebay',
      sale_price: listing.price,
      condition: listing.condition || 'Not Specified',
      sale_date: listing.listingType === 'Auction' ? listing.endTime : new Date().toISOString(),
      listing_url: listing.listingUrl,
    }));

    if (marketData.length > 0) {
      const { error: insertError } = await supabase
        .from('market_data')
        .insert(marketData);

      if (insertError) {
        console.error('Error storing market data:', insertError);
        // Don't fail the request, just log the error
      }
    }

    // Calculate market insights
    const completedSalesPrices = completedSales.map(sale => sale.price);
    const marketInsights = completedSalesPrices.length > 0 ? {
      average_price: completedSalesPrices.reduce((a, b) => a + b, 0) / completedSalesPrices.length,
      min_price: Math.min(...completedSalesPrices),
      max_price: Math.max(...completedSalesPrices),
      total_sales: completedSalesPrices.length,
      active_listings: activeListings.length,
    } : null;

    return NextResponse.json({
      data: {
        active_listings: activeListings,
        completed_sales: completedSales,
        market_insights: marketInsights,
      },
    });
  } catch (error) {
    console.error('Error in market data route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 