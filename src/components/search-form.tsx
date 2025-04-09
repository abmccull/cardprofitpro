'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Input } from '@/components/ui-migrated/input';
import { Label } from '@/components/ui-migrated/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui-migrated/select';

interface SearchFormProps {
  onSearch: (query: string, filters: {
    sport?: string;
    product?: string;
    isRookie?: boolean;
    minPrice?: number;
    maxPrice?: number;
    condition?: string[];
    sortOrder?: string;
  }) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, {
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      condition: condition.length > 0 ? condition : undefined,
      sortOrder: sortOrder || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="search">Search</Label>
        <Input
          id="search"
          type="text"
          placeholder="Search for cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minPrice">Min Price</Label>
          <Input
            id="minPrice"
            type="number"
            placeholder="0.00"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="maxPrice">Max Price</Label>
          <Input
            id="maxPrice"
            type="number"
            placeholder="0.00"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="condition">Condition</Label>
        <Select value={condition[0]} onValueChange={(value) => setCondition([value])}>
          <SelectTrigger id="condition">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="like-new">Like New</SelectItem>
            <SelectItem value="good">Good</SelectItem>
            <SelectItem value="fair">Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="sortOrder">Sort By</Label>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger id="sortOrder">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full">Search</Button>
    </form>
  );
} 