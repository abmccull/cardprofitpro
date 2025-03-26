'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { searchEbayListings } from '@/lib/ebay/client';
import { addToWatchlist } from '@/lib/watchlist';
import { Loader2 } from 'lucide-react';

interface SearchResult {
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
}

interface SearchResultsProps {
  query: string;
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string[];
    sortOrder?: string;
  };
}

export function SearchResults({ query, filters }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query, filters]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await searchEbayListings(query, filters);
      setResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search eBay listings');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to search eBay listings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = async (item: SearchResult) => {
    try {
      await addToWatchlist(item);
      toast({
        title: 'Success',
        description: 'Item added to watchlist',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add item to watchlist',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <Card key={item.itemId} className="p-4">
              <div className="aspect-square relative mb-4">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="object-contain w-full h-full"
                />
              </div>
              <h3 className="font-medium line-clamp-2 mb-2">{item.title}</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-bold">
                    {item.price.value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: item.price.currency,
                    })}
                  </p>
                  <p className="text-sm text-gray-500">{item.condition}</p>
                </div>
                {item.isAuction && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                    Auction
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAddToWatchlist(item)}
                >
                  Add to Watchlist
                </Button>
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => window.open(item.listingUrl, '_blank')}
                >
                  View on eBay
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 text-gray-500">
          No results found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
} 