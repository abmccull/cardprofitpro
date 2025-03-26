'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

interface SearchFiltersProps {
  sports: string[];
  products: Array<{
    product_id: number;
    product_name: string;
  }>;
  onFilterChange: (filters: {
    sport: string | null;
    product: string | null;
    isRookie: boolean;
  }) => void;
}

export function SearchFilters({ sports, products, onFilterChange }: SearchFiltersProps) {
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isRookie, setIsRookie] = useState(false);

  const handleSportChange = (value: string) => {
    setSelectedSport(value);
    setSelectedProduct(null); // Reset product when sport changes
    onFilterChange({
      sport: value,
      product: null,
      isRookie
    });
  };

  const handleProductChange = (value: string) => {
    setSelectedProduct(value);
    onFilterChange({
      sport: selectedSport,
      product: value,
      isRookie
    });
  };

  const handleRookieChange = (checked: boolean) => {
    setIsRookie(checked);
    onFilterChange({
      sport: selectedSport,
      product: selectedProduct,
      isRookie: checked
    });
  };

  const handleClearFilters = () => {
    setSelectedSport(null);
    setSelectedProduct(null);
    setIsRookie(false);
    onFilterChange({
      sport: null,
      product: null,
      isRookie: false
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <Label htmlFor="sport">Sport</Label>
        <Select
          value={selectedSport || ''}
          onValueChange={handleSportChange}
        >
          <SelectTrigger id="sport">
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            {sports.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">Product</Label>
        <Select
          value={selectedProduct || ''}
          onValueChange={handleProductChange}
          disabled={!selectedSport}
        >
          <SelectTrigger id="product">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.product_id} value={product.product_name}>
                {product.product_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="rookie"
          checked={isRookie}
          onCheckedChange={handleRookieChange}
        />
        <Label htmlFor="rookie">Rookie cards only</Label>
      </div>

      <Button
        variant="outline"
        onClick={handleClearFilters}
        className="w-full"
      >
        Clear Filters
      </Button>
    </div>
  );
} 