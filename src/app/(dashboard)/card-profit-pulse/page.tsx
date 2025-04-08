import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import CardProfitPulseClient from './components/card-profit-pulse-client';

interface CardAnalytic {
  id: number;
  sport: string;
  card_id: string;
  raw_avg: number;
  psa_9_avg: number | null;
  psa_10_avg: number;
  raw_count: number;
  psa_9_count: number;
  psa_10_count: number;
  psa_10_multiplier: number;
  psa_9_multiplier: number | null;
  potential_profit_psa_10: number;
  potential_profit_psa_9: number | null;
  created_at: string;
  updated_at: string;
}

async function getCardAnalytics() {
  try {
    // Create Supabase client directly - simpler approach without cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    console.log("Fetching card analytics data...");
    
    // Fetch card analytics data
    const { data, error } = await supabase
      .from('ebay_card_analytics')
      .select('*')
      .order('psa_10_multiplier', { ascending: false })
      .limit(500);
      
    console.log("Data fetched:", data ? data.length : 0, "records");
    console.log("Error:", error);
    
    if (error) {
      console.error('Error fetching card analytics:', error.message);
      return {
        cards: [] as CardAnalytic[],
        lastUpdated: null,
        error: 'Failed to load card data: ' + error.message
      };
    }
    
    // Get the most recent updated_at timestamp
    const lastUpdated = data && data.length > 0 
      ? data.reduce((latest: Date, card: CardAnalytic) => {
          const updatedAt = new Date(card.updated_at);
          return updatedAt > latest ? updatedAt : latest;
        }, new Date(0))
      : null;
    
    return {
      cards: data as CardAnalytic[] || [],
      lastUpdated,
      error: null
    };
    
  } catch (err) {
    console.error('Server Error fetching card analytics:', err);
    return {
      cards: [] as CardAnalytic[],
      lastUpdated: null,
      error: 'An unexpected error occurred: ' + (err instanceof Error ? err.message : String(err))
    };
  }
}

export default async function CardProfitPulsePage() {
  // Check authentication
  const { userId } = await auth();
  console.log("Auth userId:", userId);
  
  if (!userId) {
    // Should be handled by middleware, but good practice to check
    return <div>Not authenticated</div>;
  }
  
  const { cards, lastUpdated, error } = await getCardAnalytics();
  console.log("Cards count:", cards.length);
  
  return (
    <CardProfitPulseClient 
      initialCards={cards} 
      lastUpdated={lastUpdated} 
      initialError={error} 
    />
  );
} 