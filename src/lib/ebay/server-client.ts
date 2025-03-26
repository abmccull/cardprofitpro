'use server';

import { z } from 'zod';
import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database, SportType, BuyingFormat, LocationType } from '@/lib/supabase/types';

const ebaySearchResultSchema = z.object({
  itemId: z.string(),
  title: z.string(),
  price: z.number(),
  condition: z.string().optional(),
  endTime: z.string(),
  listingType: z.string(),
  listingUrl: z.string(),
  imageUrl: z.string().optional(),
});

export type EbaySearchResult = z.infer<typeof ebaySearchResultSchema>;

export interface EbaySearchFilters {
  query?: string;
  sport?: SportType;
  isGraded?: boolean;
  features?: string[];
  buyingFormat?: BuyingFormat;
  location?: LocationType;
  minPrice?: number;
  maxPrice?: number;
  showSold?: boolean;
}

export async function searchEbayWithFilters(filters: EbaySearchFilters): Promise<EbaySearchResult[]> {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    // Build eBay API query parameters
    const searchParams = new URLSearchParams();
    
    // Base query
    if (filters.query) {
      searchParams.append('q', filters.query);
    }

    // Sport category mapping
    const sportCategoryIds: Record<SportType, string> = {
      'Baseball': '213',
      'Basketball': '214',
      'Football': '215',
      'Hockey': '216',
      'Soccer': '217'
    };
    
    if (filters.sport) {
      searchParams.append('category_ids', sportCategoryIds[filters.sport]);
    }

    // Price filters
    if (filters.minPrice) {
      searchParams.append('price_min', filters.minPrice.toString());
    }
    if (filters.maxPrice) {
      searchParams.append('price_max', filters.maxPrice.toString());
    }

    // Location filter
    if (filters.location) {
      const locationFilter = filters.location === 'US' ? 'US' : 
        filters.location === 'North_America' ? 'North America' : 'Worldwide';
      searchParams.append('itemLocation', locationFilter);
    }

    // Buying format
    if (filters.buyingFormat) {
      const listingType = filters.buyingFormat === 'Auction' ? 'Auction' :
        filters.buyingFormat === 'Buy_It_Now' ? 'FixedPrice' :
        filters.buyingFormat === 'Accepts_Offers' ? 'All' : undefined;
      
      if (listingType) {
        searchParams.append('listingType', listingType);
      }
    }

    // Graded condition
    if (filters.isGraded) {
      searchParams.append('conditions', 'Graded');
    }

    // Sold items
    if (filters.showSold) {
      searchParams.append('soldItems', 'true');
    }

    // Features as keywords
    if (filters.features && filters.features.length > 0) {
      const featureKeywords = filters.features.join(' ');
      const currentQuery = searchParams.get('q') || '';
      searchParams.set('q', `${currentQuery} ${featureKeywords}`.trim());
    }

    // Call eBay API
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${searchParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.EBAY_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`eBay API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.itemSummaries || [];

  } catch (error) {
    console.error('Error searching eBay:', error);
    throw error;
  }
}

export async function getSavedSearches(userId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  const { data: searches, error } = await supabase
    .from('saved_searches')
    .select(`
      *,
      saved_searches_features (
        feature_id,
        card_features (
          name
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved searches:', error);
    throw error;
  }

  return searches;
}

export async function saveSearch(
  userId: string,
  name: string,
  filters: EbaySearchFilters,
  autoPopulate: boolean = false
) {
  const supabase = createServerComponentClient<Database>({ cookies });
  
  try {
    const { data: savedSearch, error: saveError } = await supabase
      .from('saved_searches')
      .insert({
        user_id: userId,
        name,
        query: filters.query,
        sport: filters.sport,
        is_graded: filters.isGraded,
        buying_format: filters.buyingFormat,
        location: filters.location,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        show_sold: filters.showSold,
        auto_populate: autoPopulate
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Save features if any
    if (filters.features && filters.features.length > 0) {
      const { data: features } = await supabase
        .from('card_features')
        .select('id')
        .in('name', filters.features);

      if (features && features.length > 0) {
        const featureMappings = features.map(feature => ({
          saved_search_id: savedSearch.id,
          feature_id: feature.id
        }));

        const { error: featureError } = await supabase
          .from('saved_searches_features')
          .insert(featureMappings);

        if (featureError) throw featureError;
      }
    }

    return savedSearch;
  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
} 