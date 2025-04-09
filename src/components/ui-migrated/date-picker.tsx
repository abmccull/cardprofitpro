'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui-migrated/button';
import { Calendar } from '@/components/ui-migrated/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui-migrated/popover';

interface DatePickerProps {
  selected?: Date | null;
  onSelect?: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  selected,
  onSelect,
  minDate,
  maxDate,
}: DatePickerProps) {
  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      onSelect?.(date || null);
    },
    [onSelect]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(selected, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={handleSelect}
          initialFocus
          fromDate={minDate}
          toDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
} 