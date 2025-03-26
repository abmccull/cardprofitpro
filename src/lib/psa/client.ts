import { Cache } from '@/lib/cache';
import { z } from 'zod';

const cache = new Cache();
const CACHE_KEY_PREFIX = 'psa_data_';
const PSA_API_URL = process.env.PSA_API_URL;
const PSA_API_KEY = process.env.PSA_API_KEY;

if (!PSA_API_URL || !PSA_API_KEY) {
  throw new Error('Missing PSA API configuration');
}

const psaSearchResponseSchema = z.object({
  items: z.array(z.object({
    cert_number: z.string(),
    grade: z.string(),
    description: z.string(),
    brand: z.string().optional(),
    year: z.string().optional(),
    player: z.string().optional(),
    card_number: z.string().optional(),
    pop: z.number().optional(),
    higher_pop: z.number().optional(),
  })),
  total: z.number(),
});

export type PSASearchResult = {
  certNumber: string;
  grade: string;
  description: string;
  brand?: string;
  year?: string;
  player?: string;
  cardNumber?: string;
  population?: number;
  higherPopulation?: number;
};

export async function searchPSADatabase(query: string): Promise<PSASearchResult[]> {
  if (!process.env.PSA_API_KEY) {
    throw new Error('PSA_API_KEY is not configured');
  }

  const baseUrl = 'https://api.psacard.com/publicapi/v1/cert';
  const params = new URLSearchParams({
    q: query,
    page: '1',
    pageSize: '10',
  });

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PSA_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`PSA API error: ${response.statusText}`);
    }

    const data = await response.json();
    const validated = psaSearchResponseSchema.parse(data);

    return validated.items.map(item => ({
      certNumber: item.cert_number,
      grade: item.grade,
      description: item.description,
      brand: item.brand,
      year: item.year,
      player: item.player,
      cardNumber: item.card_number,
      population: item.pop,
      higherPopulation: item.higher_pop,
    }));
  } catch (error) {
    console.error('Error searching PSA database:', error);
    throw error;
  }
}

export async function getPopulationReport(certNumber: string): Promise<PSASearchResult | null> {
  if (!process.env.PSA_API_KEY) {
    throw new Error('PSA_API_KEY is not configured');
  }

  const baseUrl = `https://api.psacard.com/publicapi/v1/cert/${certNumber}`;

  try {
    const response = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.PSA_API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`PSA API error: ${response.statusText}`);
    }

    const data = await response.json();
    const validated = psaSearchResponseSchema.parse({ items: [data], total: 1 });
    const item = validated.items[0];

    return {
      certNumber: item.cert_number,
      grade: item.grade,
      description: item.description,
      brand: item.brand,
      year: item.year,
      player: item.player,
      cardNumber: item.card_number,
      population: item.pop,
      higherPopulation: item.higher_pop,
    };
  } catch (error) {
    console.error('Error fetching PSA population report:', error);
    throw error;
  }
}

export async function getGradingData(cardName: string) {
  const cacheKey = `${CACHE_KEY_PREFIX}${cardName}`;
  const cachedData = await cache.get(cacheKey);
  
  if (cachedData) {
    return JSON.parse(cachedData);
  }

  const response = await fetch(`${PSA_API_URL}/cards/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PSA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: cardName,
      limit: 10
    })
  });

  if (!response.ok) {
    throw new Error(`PSA API error: ${response.statusText}`);
  }

  const data = await response.json();
  await cache.set(cacheKey, JSON.stringify(data), 3600); // Cache for 1 hour
  return data;
}

export async function getGradingStatus(submissionId: string) {
  const response = await fetch(`${PSA_API_URL}/submissions/${submissionId}`, {
    headers: {
      'Authorization': `Bearer ${PSA_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`PSA API error: ${response.statusText}`);
  }

  return response.json();
} 