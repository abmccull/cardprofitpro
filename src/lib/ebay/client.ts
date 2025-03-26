import { EbayAuthToken } from 'ebay-oauth-nodejs-client';
import { Cache } from '@/lib/cache';
import { z } from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { refreshEbayToken } from './auth';

const cache = new Cache();
const CACHE_KEY = 'ebay_access_token';
const EBAY_API_URL = 'https://api.ebay.com';

const ebayAuthClient = new EbayAuthToken({
  clientId: process.env.EBAY_CLIENT_ID!,
  clientSecret: process.env.EBAY_CLIENT_SECRET!,
  redirectUri: process.env.EBAY_REDIRECT_URI!,
});

async function getAccessToken(): Promise<string> {
  const cachedToken = await cache.get(CACHE_KEY);
  if (cachedToken) {
    return cachedToken;
  }

  const response = await ebayAuthClient.getApplicationToken('PRODUCTION');
  const { access_token, expires_in } = JSON.parse(response);
  await cache.set(CACHE_KEY, access_token, expires_in - 300); // Cache for token lifetime minus 5 minutes
  return access_token;
}

const ebaySearchResponseSchema = z.object({
  findItemsAdvancedResponse: z.array(z.object({
    searchResult: z.array(z.object({
      item: z.array(z.object({
        itemId: z.array(z.string()),
        title: z.array(z.string()),
        sellingStatus: z.array(z.object({
          currentPrice: z.array(z.object({
            _value: z.string(),
            currencyId: z.string(),
          })),
        })),
        condition: z.array(z.object({
          conditionDisplayName: z.array(z.string()),
        })).optional(),
        listingInfo: z.array(z.object({
          endTime: z.array(z.string()),
          listingType: z.array(z.string()),
        })),
        viewItemURL: z.array(z.string()),
      })),
    })),
  })),
});

export type EbaySearchResult = {
  itemId: string;
  title: string;
  price: {
    value: number;
    currency: string;
  };
  condition: string;
  endTime: string;
  listingUrl: string;
  imageUrl: string;
  isAuction: boolean;
};

export interface SearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  sortOrder?: string;
}

function buildFilterString(filters: SearchFilters): string {
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

interface EbayTransaction {
  itemId: string;
  title: string;
  price: {
    value: number;
    currency: string;
  };
  transactionDate: string;
  type: 'purchase' | 'sale';
  status: string;
}

export async function searchEbayListings(query: string, filters: SearchFilters = {}) {
  const accessToken = await getAccessToken();
  const searchParams = new URLSearchParams({
    q: query,
    limit: '50',
    filter: buildFilterString(filters),
  });

  const response = await fetch(`${EBAY_API_URL}/buy/browse/v1/item_summary/search?${searchParams}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
  });

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.itemSummaries?.map((item: any) => ({
    itemId: item.itemId,
    title: item.title,
    price: {
      value: typeof item.price === 'number' ? item.price : parseFloat(item.price.value),
      currency: typeof item.price === 'number' ? 'USD' : item.price.currency,
    },
    condition: item.condition,
    endTime: item.itemEndDate,
    listingUrl: item.itemWebUrl,
    imageUrl: item.image?.imageUrl || '/placeholder.png',
    isAuction: item.buyingOptions?.includes('AUCTION') || false,
  })) || [];
}

export async function getEbayTransactions(): Promise<EbayTransaction[]> {
  const supabase = createClientComponentClient();
  
  // Get user's eBay token
  const { data: connection } = await supabase
    .from('user_connections')
    .select('*')
    .eq('provider', 'ebay')
    .single();

  if (!connection) {
    throw new Error('eBay account not connected');
  }

  // Check if token needs refresh (same as above)
  if (new Date(connection.expires_at) <= new Date()) {
    const { access_token, refresh_token, expires_in } = await refreshEbayToken(connection.refresh_token);
    await supabase
      .from('user_connections')
      .update({
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);
  }

  // Get purchases
  const purchasesResponse = await fetch(
    'https://api.ebay.com/buy/order/v1/orders?limit=50&offset=0&filter=orders.orderfulfillmentstatus:{FULFILLED}',
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKPLACE-ID': 'EBAY_US',
      },
    }
  );

  // Get sales (using Fulfillment API)
  const salesResponse = await fetch(
    'https://api.ebay.com/sell/fulfillment/v1/order?limit=50&offset=0&filter=orderfulfillmentstatus:{FULFILLED}',
    {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
        'X-EBAY-C-MARKPLACE-ID': 'EBAY_US',
      },
    }
  );

  const [purchasesData, salesData] = await Promise.all([
    purchasesResponse.json(),
    salesResponse.json(),
  ]);

  // Transform and combine transactions
  const purchases = purchasesData.orders.map((order: any) => ({
    itemId: order.lineItems[0].itemId,
    title: order.lineItems[0].title,
    price: {
      value: parseFloat(order.lineItems[0].total.value),
      currency: order.lineItems[0].total.currency,
    },
    transactionDate: order.creationDate,
    type: 'purchase' as const,
    status: order.orderFulfillmentStatus,
  }));

  const sales = salesData.orders.map((order: any) => ({
    itemId: order.lineItems[0].itemId,
    title: order.lineItems[0].title,
    price: {
      value: parseFloat(order.lineItems[0].total.value),
      currency: order.lineItems[0].total.currency,
    },
    transactionDate: order.creationDate,
    type: 'sale' as const,
    status: order.orderFulfillmentStatus,
  }));

  return [...purchases, ...sales].sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  );
}

export async function getCompletedSales(query: string): Promise<EbaySearchResult[]> {
  if (!process.env.EBAY_APP_ID) {
    throw new Error('EBAY_APP_ID is not configured');
  }

  const baseUrl = 'https://svcs.ebay.com/services/search/FindingService/v1';
  const params = new URLSearchParams({
    'OPERATION-NAME': 'findCompletedItems',
    'SERVICE-VERSION': '1.0.0',
    'SECURITY-APPNAME': process.env.EBAY_APP_ID,
    'RESPONSE-DATA-FORMAT': 'JSON',
    'REST-PAYLOAD': '',
    'keywords': query,
    'itemFilter(0).name': 'SoldItemsOnly',
    'itemFilter(0).value': 'true',
    'sortOrder': 'EndTimeSoonest',
  });

  const response = await fetch(`${baseUrl}?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch completed sales');
  }

  const data = await response.json();
  const items = data.findCompletedItemsResponse[0].searchResult[0].item || [];

  return items.map((item: any) => ({
    itemId: item.itemId[0],
    title: item.title[0],
    price: {
      value: parseFloat(item.sellingStatus[0].currentPrice[0]._value),
      currency: item.sellingStatus[0].currentPrice[0].currencyId,
    },
    condition: item.condition?.[0]?.conditionDisplayName?.[0] || 'Not Specified',
    endTime: item.listingInfo[0].endTime[0],
    listingUrl: item.viewItemURL[0],
    imageUrl: item.galleryURL?.[0] || '/placeholder.png',
    isAuction: item.listingInfo[0].listingType[0] === 'Auction',
  }));
}

export async function searchCards(query: string) {
  const token = await getAccessToken();
  const response = await fetch(
    `${process.env.EBAY_API_URL}/buy/browse/v1/item_summary/search?` +
    new URLSearchParams({
      q: query,
      category_ids: '213', // Sports Trading Cards category
      limit: '10'
    }), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKPLACE-ID': 'EBAY_US'
    }
  });

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.statusText}`);
  }

  return response.json();
}

export async function getCardPrices(cardName: string) {
  const token = await getAccessToken();
  const response = await fetch(
    `${process.env.EBAY_API_URL}/buy/marketplace_insights/v1/item_sales/search?` +
    new URLSearchParams({
      q: cardName,
      category_ids: '213',
      limit: '100'
    }), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKPLACE-ID': 'EBAY_US'
    }
  });

  if (!response.ok) {
    throw new Error(`eBay API error: ${response.statusText}`);
  }

  return response.json();
} 