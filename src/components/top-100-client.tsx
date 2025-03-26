'use client';

import { SearchFilters } from '@/components/search-filters';
import { SearchResults } from '@/components/search-results';
import { useState } from 'react';

interface Top100ClientProps {
  initialSports: string[];
  initialProducts: Array<{
    product_id: number;
    product_name: string;
  }>;
}

export function Top100Client({ initialSports, initialProducts }: Top100ClientProps) {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = async (filters: {
    sport: string | null;
    product: string | null;
    isRookie: boolean;
  }) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      if (filters.sport) params.append('sport', filters.sport);
      if (filters.product) params.append('product', filters.product);
      if (filters.isRookie) params.append('isRookie', 'true');

      const response = await fetch(`/api/top-100?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch players');
      }

      setPlayers(data.players);
    } catch (error) {
      console.error('Error fetching players:', error);
      // You could add a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <SearchFilters
        sports={initialSports}
        products={initialProducts}
        onFilterChange={handleFilterChange}
      />
      <SearchResults
        players={players}
        isLoading={isLoading}
      />
    </div>
  );
}