'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';

interface AutocompleteInputProps<T = string> {
  // Support both options object array and string array via suggestions
  options?: T[];
  suggestions?: string[];
  value: T | null;
  onChange: (value: T | null) => void;
  displayValue?: (item: T) => string;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
  disabled?: boolean;
  onBlur?: () => void;
}

export function AutocompleteInput<T = string>({
  options = [],
  suggestions = [],
  value,
  onChange,
  displayValue = (item: T) => typeof item === 'string' ? item : String(item),
  placeholder = 'Select an option...',
  className,
  emptyMessage = 'No options found.',
  disabled = false,
  onBlur
}: AutocompleteInputProps<T>) {
  // Combine options and suggestions (suggestions as strings take precedence)
  const allOptions = suggestions.length > 0 
    ? suggestions as unknown as T[] 
    : options;

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = allOptions.filter((option) =>
    displayValue(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (onBlur) onBlur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onBlur]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)} ref={inputRef}>
          <Input
            value={value ? displayValue(value) : searchTerm}
            placeholder={placeholder}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!open) setOpen(true);
              
              // If input is cleared, reset the value
              if (!e.target.value) {
                onChange(null);
              }
            }}
            disabled={disabled}
            onClick={() => !open && setOpen(true)}
            className="pr-8"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-2"
            onClick={() => setOpen(!open)}
            disabled={disabled}
          >
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option, index) => (
                <CommandItem
                  key={index}
                  onSelect={() => {
                    onChange(option);
                    setSearchTerm('');
                    setOpen(false);
                    if (onBlur) onBlur();
                  }}
                  className="cursor-pointer"
                >
                  {displayValue(option)}
                  {value === option && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 