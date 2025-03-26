'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
        <label className="text-sm font-medium">Sport</label>
        <Select value={sport} onValueChange={handleSportChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sports</SelectItem>
            <SelectItem value="Baseball">Baseball</SelectItem>
            <SelectItem value="Football">Football</SelectItem>
            <SelectItem value="Basketball">Basketball</SelectItem>
            <SelectItem value="Hockey">Hockey</SelectItem>
            <SelectItem value="Women's Basketball">Women's Basketball</SelectItem>
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