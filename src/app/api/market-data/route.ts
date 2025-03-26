import { NextResponse } from 'next/server';
import { searchCards, getCardPrices } from '@/lib/ebay/client';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardName = searchParams.get('cardName');
    
    if (!cardName) {
      return NextResponse.json(
        { error: 'cardName parameter is required' },
        { status: 400 }
      );
    }

    // Get current listings
    const listings = await searchCards(cardName);
    
    // Get historical sales data
    const salesData = await getCardPrices(cardName);

    // Calculate market insights
    const prices = salesData.sales.map((sale: any) => sale.price.value);
    const marketInsights = {
      averagePrice: prices.reduce((a: number, b: number) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalSales: prices.length,
      recentListings: listings.itemSummaries?.slice(0, 5) || []
    };

    // Store market data in Supabase for historical tracking
    const supabase = createClient();
    await supabase.from('market_data').insert([{
      card_name: cardName,
      average_price: marketInsights.averagePrice,
      min_price: marketInsights.minPrice,
      max_price: marketInsights.maxPrice,
      total_sales: marketInsights.totalSales,
      data_source: 'ebay'
    }]);

    return NextResponse.json({ data: marketInsights });
  } catch (error) {
    console.error('Error fetching market data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
} 