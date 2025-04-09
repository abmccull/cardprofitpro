'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Checkbox } from '@/components/ui-migrated/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui-migrated/select';
import { Label } from '@/components/ui-migrated/label';

interface SearchFiltersProps {
  onFiltersChange: (filters: {
    sport: string;
    isRookie: boolean;
    isTop100: boolean;
  }) => void;
}

export function SearchFilters({ onFiltersChange }: SearchFiltersProps) {
  const [sport, setSport] = useState<string>('');
  const [isRookie, setIsRookie] = useState(false);
  const [isTop100, setIsTop100] = useState(false);

  const handleSportChange = (value: string) => {
    setSport(value);
    onFiltersChange({ sport: value, isRookie, isTop100 });
  };

  const handleRookieChange = (checked: boolean) => {
    setIsRookie(checked);
    onFiltersChange({ sport, isRookie: checked, isTop100 });
  };

  const handleTop100Click = () => {
    const newIsTop100 = !isTop100;
    setIsTop100(newIsTop100);
    onFiltersChange({ sport, isRookie, isTop100: newIsTop100 });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
      <div className="space-y-2">
        <Label htmlFor="sport">Sport</Label>
        <Select value={sport || 'all'} onValueChange={handleSportChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            <SelectItem value="baseball">Baseball</SelectItem>
            <SelectItem value="basketball">Basketball</SelectItem>
            <SelectItem value="football">Football</SelectItem>
            <SelectItem value="hockey">Hockey</SelectItem>
            <SelectItem value="soccer">Soccer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="rookie"
          checked={isRookie}
          onCheckedChange={handleRookieChange}
        />
        <label
          htmlFor="rookie"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show only rookies
        </label>
      </div>

      <Button
        variant={isTop100 ? "default" : "outline"}
        onClick={handleTop100Click}
        className="w-full"
      >
        {isTop100 ? "Clear Top 100" : "Show Top 100"}
      </Button>
    </div>
  );
} 