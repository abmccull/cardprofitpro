import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@clerk/nextjs/server';
import ebayOAuth from 'ebay-oauth-nodejs-client';

// Cache for tokens
const tokenCache = new Map<string, { token: string, expiry: number }>();
const EBAY_API_URL = 'https://api.ebay.com';

// Create ebay auth client
const createEbayAuthClient = () => {
  // Handle different module formats with proper type casting
  // @ts-expect-error - eBay OAuth client has inconsistent typing between ESM/CJS
  const EbayAuthToken = ebayOAuth.EbayAuthToken || ebayOAuth.default?.EbayAuthToken || ebayOAuth;
  
  return new EbayAuthToken({
    clientId: process.env.EBAY_CLIENT_ID!,
    clientSecret: process.env.EBAY_CLIENT_SECRET!,
    redirectUri: process.env.EBAY_REDIRECT_URI!,
  });
};

const ebayAuthClient = createEbayAuthClient();

// Get application access token (no user context needed)
async function getAccessToken(): Promise<string> {
  const cacheKey = 'app_token';
  const cached = tokenCache.get(cacheKey);
  
  // Return cached token if valid
  if (cached && cached.expiry > Date.now()) {
    return cached.token;
  }
  
  // Get new token
  const response = await ebayAuthClient.getApplicationToken('PRODUCTION');
  const { access_token, expires_in } = JSON.parse(response);
  
  // Cache token
  const expiry = Date.now() + (expires_in * 1000) - (5 * 60 * 1000); // Token lifetime minus 5 minutes
  tokenCache.set(cacheKey, { token: access_token, expiry });
  
  return access_token;
}

// Validate search params
const searchParamsSchema = z.object({
  query: z.string(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  condition: z.string().optional().transform(val => val ? val.split(',') : undefined),
  sortOrder: z.string().optional(),
});

function buildFilterString(filters: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  sortOrder?: string;
}): string {
  const filterParts: string[] = [];

  if (filters.category) {
    filterParts.push(`categoryIds:{${filters.category}}`);
  }

  if (filters.minPrice || filters.maxPrice) {
    const priceRange = [
      filters.minPrice ? `[${filters.minPrice}` : '[0',
      filters.maxPrice ? `${filters.maxPrice}]` : '',
    ].join('..');
    filterParts.push(`price:${priceRange}`);
  }

  if (filters.condition?.length) {
    filterParts.push(`conditions:{${filters.condition.join(',')}}`);
  }

  return filterParts.join(',');
}

// Define interface for eBay item summary response
interface EbayItemSummary {
  itemId: string;
  title: string;
  price: {
    value: string | number;
    currency: string;
  };
  condition?: string;
  itemEndDate?: string;
  itemWebUrl: string;
  image?: {
    imageUrl: string;
  };
  buyingOptions?: string[];
}

export async function GET(request: Request) {
  try {
    // Get the current user (authenticated requests only)
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const validatedParams = searchParamsSchema.parse(Object.fromEntries(searchParams.entries()));
    
    // Get eBay access token
    const accessToken = await getAccessToken();
    
    // Build filter string for eBay API
    const filter = buildFilterString({
      category: validatedParams.category,
      minPrice: validatedParams.minPrice,
      maxPrice: validatedParams.maxPrice,
      condition: validatedParams.condition,
      sortOrder: validatedParams.sortOrder,
    });
    
    // Prepare request to eBay API
    const ebaySearchParams = new URLSearchParams({
      q: validatedParams.query,
      limit: '50',
    });
    
    if (filter) {
      ebaySearchParams.append('filter', filter);
    }
    
    // Sort order mapping
    if (validatedParams.sortOrder) {
      ebaySearchParams.append('sort', validatedParams.sortOrder);
    }

    // Call eBay API
    const response = await fetch(
      `${EBAY_API_URL}/buy/browse/v1/item_summary/search?${ebaySearchParams}`, 
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-EBAY-C-MARKPLACE-ID': 'EBAY_US',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay API error:', errorText);
      return NextResponse.json(
        { error: `eBay API error: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      );
    }

    // Parse and transform eBay response
    const data = await response.json();
    const results = data.itemSummaries?.map((item: EbayItemSummary) => ({
      itemId: item.itemId,
      title: item.title,
      price: {
        value: typeof item.price.value === 'number' ? item.price.value : parseFloat(item.price.value),
        currency: item.price.currency,
      },
      condition: item.condition || 'Not Specified',
      endTime: item.itemEndDate || '',
      listingUrl: item.itemWebUrl,
      imageUrl: item.image?.imageUrl || '/placeholder.png',
      isAuction: item.buyingOptions?.includes('AUCTION') || false,
    })) || [];

    return NextResponse.json({ results });
    
  } catch (error) {
    console.error('Error in eBay search API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 