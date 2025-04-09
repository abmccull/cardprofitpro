'use client';


import { useState } from 'react';
import { SearchForm } from '@/app/(dashboard)/card-discovery/components/search-form';
import { SearchResults } from '@/app/(dashboard)/card-discovery/components/search-results';


export default function CardDiscoveryPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});

  const handleSearch = (newQuery, newFilters) => {
    setQuery(newQuery);
    setFilters(newFilters);
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Card Discovery</h1>
      </div>

      <SearchForm onSearch={handleSearch} />
      <SearchResults query={query} filters={filters} />
    </div>
  );
}
