'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { CardGrade } from '@/lib/supabase/types';

interface GradeFilterProps {
  selectedGrades: CardGrade[];
  onGradesChange: (grades: CardGrade[]) => void;
  grades: CardGrade[];
}

export function GradeFilter({ selectedGrades, onGradesChange, grades }: GradeFilterProps) {
  const [open, setOpen] = React.useState(false);

  const handleGradeToggle = (grade: CardGrade) => {
    if (selectedGrades.includes(grade)) {
      onGradesChange(selectedGrades.filter(g => g !== grade));
    } else {
      onGradesChange([...selectedGrades, grade]);
    }
  };

  const clearAll = () => {
    onGradesChange([]);
    setOpen(false);
  };

  const selectAll = () => {
    onGradesChange([...grades]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between"
        >
          {selectedGrades.length === 0
            ? "Select Grades"
            : `${selectedGrades.length} selected`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0" align="start">
        <div className="p-2 grid gap-2">
          <div className="flex items-center justify-between px-2 py-1">
            <Button
              variant="ghost"
              className="px-2 py-1 h-auto text-sm"
              onClick={selectAll}
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              className="px-2 py-1 h-auto text-sm"
              onClick={clearAll}
            >
              Clear
            </Button>
          </div>
          <div className="max-h-[300px] overflow-auto">
            {grades.map((grade) => (
              <div
                key={grade}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  selectedGrades.includes(grade) ? "bg-muted" : "transparent"
                )}
              >
                <Checkbox
                  checked={selectedGrades.includes(grade)}
                  onCheckedChange={() => handleGradeToggle(grade)}
                />
                <span className="ml-2">{grade}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 