import { NextResponse } from 'next/server';
import { getGradingData, getPopulationReport } from '@/lib/psa/client';
import { createClient } from '@/lib/supabase/server';

type PopulationData = {
  population: Record<string, number>;
};

type PSACard = {
  psaId: string;
  lastSalePrice?: number;
  lowPrice?: number;
  highPrice?: number;
  totalSales?: number;
};

type GradingData = {
  cards: PSACard[];
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cardName = searchParams.get('cardName');
    const psaId = searchParams.get('psaId');
    
    if (!cardName && !psaId) {
      return NextResponse.json(
        { error: 'Either cardName or psaId parameter is required' },
        { status: 400 }
      );
    }

    let data: GradingData | PopulationData | undefined;
    
    if (cardName) {
      // Search for card grading data
      data = await getGradingData(cardName) as GradingData;
    } else if (psaId) {
      // Get population report for specific card
      data = await getPopulationReport(psaId) as PopulationData;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No data found' },
        { status: 404 }
      );
    }

    // Store grading data in market_data table
    if (cardName && 'cards' in data && data.cards?.length > 0) {
      const supabase = createClient();
      const card = data.cards[0];
      const populationData = await getPopulationReport(card.psaId) as PopulationData;
      
      // Calculate average grade and total population
      const totalPop = Object.entries(populationData.population).reduce(
        (sum, [grade, count]) => sum + (parseInt(grade) * count),
        0
      );
      const totalCards = Object.values(populationData.population).reduce(
        (sum, count) => sum + count,
        0
      );
      const averageGrade = totalCards > 0 ? totalPop / totalCards : 0;

      await supabase.from('market_data').insert([{
        card_name: cardName,
        average_price: card.lastSalePrice || 0,
        min_price: card.lowPrice || 0,
        max_price: card.highPrice || 0,
        total_sales: card.totalSales || 0,
        data_source: 'psa'
      }]);
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching grading data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grading data' },
      { status: 500 }
    );
  }
} 