'use client';

import { useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface SearchFormProps {
  onSearch: (query: string, filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    condition?: string[];
    sortOrder?: string;
  }) => void;
}

export function SearchForm({ onSearch }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const query = formData.get('query') as string;
    const minPrice = formData.get('minPrice') ? Number(formData.get('minPrice')) : undefined;
    const maxPrice = formData.get('maxPrice') ? Number(formData.get('maxPrice')) : undefined;
    const condition = formData.get('condition') as string | undefined;
    const sortOrder = formData.get('sortOrder') as string | undefined;

    // Update URL with search params
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (minPrice) params.set('minPrice', minPrice.toString());
    if (maxPrice) params.set('maxPrice', maxPrice.toString());
    if (condition) params.set('condition', condition);
    if (sortOrder) params.set('sortOrder', sortOrder);

    router.push(`?${params.toString()}`);

    // Trigger search
    onSearch(query, {
      minPrice,
      maxPrice,
      condition: condition ? [condition] : undefined,
      sortOrder,
    });
  };

  return (
    <Card className="p-6">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="query">Search</Label>
          <Input
            id="query"
            name="query"
            placeholder="Search for cards..."
            defaultValue={searchParams.get('query') || ''}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minPrice">Min Price</Label>
            <Input
              id="minPrice"
              name="minPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={searchParams.get('minPrice') || ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPrice">Max Price</Label>
            <Input
              id="maxPrice"
              name="maxPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              defaultValue={searchParams.get('maxPrice') || ''}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="condition">Condition</Label>
            <Select name="condition" defaultValue={searchParams.get('condition') || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Any condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any condition</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="not_specified">Not Specified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort By</Label>
            <Select name="sortOrder" defaultValue={searchParams.get('sortOrder') || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Best Match" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Best Match</SelectItem>
                <SelectItem value="StartTimeNewest">Newly Listed</SelectItem>
                <SelectItem value="CurrentPriceHighest">Highest Price</SelectItem>
                <SelectItem value="PricePlusShippingLowest">Lowest Price</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full">Search</Button>
      </form>
    </Card>
  );
} 