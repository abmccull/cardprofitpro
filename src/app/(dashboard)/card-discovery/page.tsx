'use client';

import { useState } from 'react';
import { SearchForm } from '@/components/search-form';
import { SearchResults } from '@/components/search-results';
import type { Player } from '@/types/player';

interface SearchFilters {
  sport?: string;
  product?: string;
  isRookie?: boolean;
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  sortOrder?: string;
}

export default function CardDiscoveryPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (newQuery: string, newFilters: SearchFilters) => {
    setQuery(newQuery);
    setFilters(newFilters);
    setIsLoading(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newQuery, filters: newFilters }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setPlayers(data.players);
    } catch (error) {
      console.error('Search error:', error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Card Discovery</h1>
      </div>

      <SearchForm onSearch={handleSearch} />
      <SearchResults players={players} isLoading={isLoading} />
    </div>
  );
} 