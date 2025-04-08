'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AlertCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Use the explicit interface instead of the Database type
interface CardAnalytic {
  id: number;
  sport: string;
  card_id: string;
  raw_avg: number;
  psa_9_avg: number | null;
  psa_10_avg: number;
  raw_count: number;
  psa_9_count: number;
  psa_10_count: number;
  psa_10_multiplier: number;
  psa_9_multiplier: number | null;
  potential_profit_psa_10: number;
  potential_profit_psa_9: number | null;
  created_at: string;
  updated_at: string;
}

interface CardProfitPulseClientProps {
  initialCards: CardAnalytic[];
  lastUpdated: Date | null;
  initialError: string | null;
}

type SortColumn = 
  | 'sport'
  | 'card_id'
  | 'raw_avg'
  | 'psa_9_avg'
  | 'psa_10_avg'
  | 'psa_10_multiplier'
  | 'psa_9_multiplier'
  | 'potential_profit_psa_10'
  | 'potential_profit_psa_9';

type SortDirection = 'asc' | 'desc';

// Format currency without cents and with commas
const formatCurrency = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return `$${Math.round(value).toLocaleString()}`;
};

// Format multiplier with 1 decimal place
const formatMultiplier = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}x`;
};

const sportOptions = [
  { value: 'All', label: 'All Sports' },
  { value: 'Basketball', label: 'Basketball' },
  { value: 'Football', label: 'Football' },
  { value: 'Baseball', label: 'Baseball' },
  { value: 'Hockey', label: 'Hockey' },
  { value: 'Pokemon', label: 'Pokemon' },
  { value: 'Soccer', label: 'Soccer' }
];

// Interface for column filters
interface ColumnFilters {
  sport: string[];
  card_id: string;
  raw_avg: { min: number | null; max: number | null };
  psa_9_avg: { min: number | null; max: number | null };
  psa_10_avg: { min: number | null; max: number | null };
  psa_9_multiplier: { min: number | null; max: number | null };
  psa_10_multiplier: { min: number | null; max: number | null };
  potential_profit_psa_9: { min: number | null; max: number | null };
  potential_profit_psa_10: { min: number | null; max: number | null };
}

// Type guards for column filters
const isRangeFilter = (filter: any): filter is { min: number | null; max: number | null } => {
  return filter && typeof filter === 'object' && ('min' in filter || 'max' in filter);
};

// Helper functions for min/max values
const safeMin = (values: number[]): number => {
  if (values.length === 0) return 0;
  return Math.min(...values);
};

const safeMax = (values: number[]): number => {
  if (values.length === 0) return 1000;
  return Math.max(...values);
};

export default function CardProfitPulseClient({ 
  initialCards, 
  lastUpdated, 
  initialError 
}: CardProfitPulseClientProps) {
  const [cards, setCards] = useState<CardAnalytic[]>(initialCards);
  const [filteredCards, setFilteredCards] = useState<CardAnalytic[]>(initialCards);
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(initialError);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTab, setSelectedTab] = useState<string>('table');
  const [sortColumn, setSortColumn] = useState<SortColumn>('psa_10_multiplier');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Add column filters state
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    sport: [],
    card_id: '',
    raw_avg: { min: null, max: null },
    psa_9_avg: { min: null, max: null },
    psa_10_avg: { min: null, max: null },
    psa_9_multiplier: { min: null, max: null },
    psa_10_multiplier: { min: null, max: null },
    potential_profit_psa_9: { min: null, max: null },
    potential_profit_psa_10: { min: null, max: null }
  });
  
  // Track if any filters are active
  const [hasActiveFilters, setHasActiveFilters] = useState<boolean>(false);
  
  // Calculate unique values for sports without using spread operator
  const uniqueSports = Array.from(new Set(cards.map(card => card.sport)));
  
  // Fixed min/max values for filters (to avoid TypeScript spread operator issues)
  const minMaxValues = {
    raw_avg: { min: 0, max: 50000 },
    psa_9_avg: { min: 0, max: 100000 },
    psa_10_avg: { min: 0, max: 250000 },
    psa_9_multiplier: { min: 0, max: 20 },
    psa_10_multiplier: { min: 0, max: 20 },
    potential_profit_psa_9: { min: 0, max: 100000 },
    potential_profit_psa_10: { min: 0, max: 200000 }
  };
  
  // Check if any filters are active
  useEffect(() => {
    const filtersActive = 
      columnFilters.sport.length > 0 ||
      columnFilters.card_id !== '' ||
      columnFilters.raw_avg.min !== null ||
      columnFilters.raw_avg.max !== null ||
      columnFilters.psa_9_avg.min !== null ||
      columnFilters.psa_9_avg.max !== null ||
      columnFilters.psa_10_avg.min !== null ||
      columnFilters.psa_10_avg.max !== null ||
      columnFilters.psa_9_multiplier.min !== null ||
      columnFilters.psa_9_multiplier.max !== null ||
      columnFilters.psa_10_multiplier.min !== null ||
      columnFilters.psa_10_multiplier.max !== null ||
      columnFilters.potential_profit_psa_9.min !== null ||
      columnFilters.potential_profit_psa_9.max !== null ||
      columnFilters.potential_profit_psa_10.min !== null ||
      columnFilters.potential_profit_psa_10.max !== null;
    
    setHasActiveFilters(filtersActive);
  }, [columnFilters]);
  
  // Helper to update number range filters
  const updateRangeFilter = (
    column: keyof ColumnFilters, 
    minOrMax: 'min' | 'max', 
    value: number | null
  ) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        [minOrMax]: value
      }
    }));
  };
  
  // Helper to update sports filter
  const updateSportFilter = (sport: string, checked: boolean) => {
    setColumnFilters(prev => ({
      ...prev,
      sport: checked 
        ? [...prev.sport, sport] 
        : prev.sport.filter(s => s !== sport)
    }));
  };
  
  // Helper to clear all filters
  const clearAllFilters = () => {
    setColumnFilters({
      sport: [],
      card_id: '',
      raw_avg: { min: null, max: null },
      psa_9_avg: { min: null, max: null },
      psa_10_avg: { min: null, max: null },
      psa_9_multiplier: { min: null, max: null },
      psa_10_multiplier: { min: null, max: null },
      potential_profit_psa_9: { min: null, max: null },
      potential_profit_psa_10: { min: null, max: null }
    });
    setSportFilter('All');
    setSearchQuery('');
  };
  
  // Add debugging information
  useEffect(() => {
    console.log("Client component received cards:", initialCards?.length || 0);
    console.log("Initial error:", initialError);
    console.log("Sample of first card:", initialCards && initialCards.length > 0 ? initialCards[0] : "No cards");
  }, [initialCards, initialError]);
  
  const cardsPerPage = 50;
  
  // Calculate summary statistics
  const avgPsa10Multiplier = filteredCards.length > 0 
    ? filteredCards.reduce((sum, card) => sum + card.psa_10_multiplier, 0) / filteredCards.length
    : 0;
  
  const avgPotentialProfit = filteredCards.length > 0
    ? filteredCards.reduce((sum, card) => sum + card.potential_profit_psa_10, 0) / filteredCards.length
    : 0;
  
  // Format the lastUpdated date
  const formattedDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'N/A';
    
  // Handle sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with default desc direction
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // Apply filters and sorting
  useEffect(() => {
    let result = [...cards];
    
    // Calculate PSA 9 Profit for each card
    result = result.map(card => ({
      ...card,
      potential_profit_psa_9: card.psa_9_avg !== null ? card.psa_9_avg - card.raw_avg : null
    }));
    
    // Apply sport filter (from main sport filter dropdown)
    if (sportFilter !== 'All') {
      result = result.filter(card => card.sport === sportFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(card => 
        card.card_id.toLowerCase().includes(query) ||
        card.sport.toLowerCase().includes(query)
      );
    }
    
    // Apply column filters
    if (columnFilters.sport.length > 0) {
      result = result.filter(card => columnFilters.sport.includes(card.sport));
    }
    
    if (columnFilters.card_id) {
      const cardIdQuery = columnFilters.card_id.toLowerCase();
      result = result.filter(card => card.card_id.toLowerCase().includes(cardIdQuery));
    }
    
    // Apply number range filters
    if (columnFilters.raw_avg.min !== null) {
      result = result.filter(card => card.raw_avg >= (columnFilters.raw_avg.min as number));
    }
    if (columnFilters.raw_avg.max !== null) {
      result = result.filter(card => card.raw_avg <= (columnFilters.raw_avg.max as number));
    }
    
    if (columnFilters.psa_9_avg.min !== null) {
      result = result.filter(card => 
        card.psa_9_avg !== null && card.psa_9_avg >= (columnFilters.psa_9_avg.min as number)
      );
    }
    if (columnFilters.psa_9_avg.max !== null) {
      result = result.filter(card => 
        card.psa_9_avg !== null && card.psa_9_avg <= (columnFilters.psa_9_avg.max as number)
      );
    }
    
    if (columnFilters.psa_10_avg.min !== null) {
      result = result.filter(card => card.psa_10_avg >= (columnFilters.psa_10_avg.min as number));
    }
    if (columnFilters.psa_10_avg.max !== null) {
      result = result.filter(card => card.psa_10_avg <= (columnFilters.psa_10_avg.max as number));
    }
    
    if (columnFilters.psa_9_multiplier.min !== null) {
      result = result.filter(card => 
        card.psa_9_multiplier !== null && 
        card.psa_9_multiplier >= (columnFilters.psa_9_multiplier.min as number)
      );
    }
    if (columnFilters.psa_9_multiplier.max !== null) {
      result = result.filter(card => 
        card.psa_9_multiplier !== null && 
        card.psa_9_multiplier <= (columnFilters.psa_9_multiplier.max as number)
      );
    }
    
    if (columnFilters.psa_10_multiplier.min !== null) {
      result = result.filter(card => 
        card.psa_10_multiplier >= (columnFilters.psa_10_multiplier.min as number)
      );
    }
    if (columnFilters.psa_10_multiplier.max !== null) {
      result = result.filter(card => 
        card.psa_10_multiplier <= (columnFilters.psa_10_multiplier.max as number)
      );
    }
    
    if (columnFilters.potential_profit_psa_9.min !== null) {
      result = result.filter(card => 
        card.potential_profit_psa_9 !== null && 
        card.potential_profit_psa_9 >= (columnFilters.potential_profit_psa_9.min as number)
      );
    }
    if (columnFilters.potential_profit_psa_9.max !== null) {
      result = result.filter(card => 
        card.potential_profit_psa_9 !== null && 
        card.potential_profit_psa_9 <= (columnFilters.potential_profit_psa_9.max as number)
      );
    }
    
    if (columnFilters.potential_profit_psa_10.min !== null) {
      result = result.filter(card => 
        card.potential_profit_psa_10 >= (columnFilters.potential_profit_psa_10.min as number)
      );
    }
    if (columnFilters.potential_profit_psa_10.max !== null) {
      result = result.filter(card => 
        card.potential_profit_psa_10 <= (columnFilters.potential_profit_psa_10.max as number)
      );
    }
    
    // Apply sorting
    result = result.sort((a, b) => {
      // Handle nulls for nullable columns
      if (sortColumn === 'psa_9_avg' || sortColumn === 'psa_9_multiplier') {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === null) return sortDirection === 'asc' ? 1 : -1;
      }
      
      // For string columns
      if (sortColumn === 'sport' || sortColumn === 'card_id') {
        const aValue = a[sortColumn].toLowerCase();
        const bValue = b[sortColumn].toLowerCase();
        
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // For number columns
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
    
    setFilteredCards(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [cards, sportFilter, searchQuery, sortColumn, sortDirection, columnFilters]);
  
  // Pagination logic
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = filteredCards.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(filteredCards.length / cardsPerPage);
  
  // Recharts scatter plot data prep - select top 100 for better performance
  const chartData = filteredCards
    .slice(0, Math.min(100, filteredCards.length))
    .map(card => ({
      x: card.psa_10_multiplier,
      y: card.potential_profit_psa_10,
      z: card.raw_avg,
      name: formatCardId(card.card_id),
      sport: card.sport
    }));
  
  // Format card ID for display
  function formatCardId(cardId: string): string {
    return cardId
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // Render sort icon for table headers
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4 inline" /> 
      : <ArrowDown className="ml-2 h-4 w-4 inline" />;
  };
  
  // Custom tooltip for the scatter plot
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 shadow-md bg-white border border-gray-200">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p>Sport: {payload[0].payload.sport}</p>
          <p>PSA 10 Multiplier: {payload[0].payload.x.toFixed(1)}x</p>
          <p>Potential Profit: {formatCurrency(payload[0].payload.y)}</p>
          <p>Raw Avg: {formatCurrency(payload[0].payload.z)}</p>
        </Card>
      );
    }
    return null;
  };
  
  // Handle sport filter change
  const handleSportChange = (value: string) => {
    setSportFilter(value);
  };
  
  // Handle search query change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle pagination
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
  };
  
  // Filter components
  const SportFilter = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-medium">Filter by Sport</h4>
          <div className="grid gap-2 max-h-[300px] overflow-auto">
            {uniqueSports.map(sport => (
              <div key={sport} className="flex items-center space-x-2">
                <Checkbox 
                  id={`sport-${sport}`}
                  checked={columnFilters.sport.includes(sport)}
                  onCheckedChange={(checked) => 
                    updateSportFilter(sport, checked as boolean)
                  }
                />
                <Label htmlFor={`sport-${sport}`}>{sport}</Label>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={() => setColumnFilters(prev => ({...prev, sport: []}))}
          >
            Clear Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
  
  const CardFilter = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <h4 className="font-medium">Filter by Card Name</h4>
          <Input 
            placeholder="Search card names..."
            value={columnFilters.card_id}
            onChange={(e) => setColumnFilters(prev => ({
              ...prev, 
              card_id: e.target.value
            }))}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2"
            onClick={() => setColumnFilters(prev => ({...prev, card_id: ''}))}
          >
            Clear Filter
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
  
  const NumberRangeFilter = ({ 
    column, 
    label,
    min,
    max,
    formatValue = (v: number) => v.toString()
  }: {
    column: keyof ColumnFilters;
    label: string;
    min: number;
    max: number;
    formatValue?: (value: number) => string;
  }) => {
    const filter = columnFilters[column] as { min: number | null; max: number | null };
    const [isOpen, setIsOpen] = useState(false);
    const [tempMin, setTempMin] = useState(filter.min ?? min);
    const [tempMax, setTempMax] = useState(filter.max ?? max);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [popoverPosition, setPopoverPosition] = useState<'left' | 'center' | 'right'>('center');
    
    // Update position on window resize
    useEffect(() => {
      const updatePosition = () => {
        if (buttonRef.current && isOpen) {
          const buttonRect = buttonRef.current.getBoundingClientRect();
          const buttonCenterX = buttonRect.left + buttonRect.width / 2;
          const viewportWidth = window.innerWidth;
          const popoverWidth = 320; // w-80 = 20rem = 320px
          
          // If button is near the right edge, align popover left
          if (buttonCenterX + popoverWidth / 2 > viewportWidth - 20) {
            setPopoverPosition('right');
          }
          // If button is near the left edge, align popover right
          else if (buttonCenterX - popoverWidth / 2 < 20) {
            setPopoverPosition('left');
          }
          // Otherwise center it
          else {
            setPopoverPosition('center');
          }
        }
      };
      
      // Update position when opening
      if (isOpen) {
        updatePosition();
      }
      
      // Add resize listener
      window.addEventListener('resize', updatePosition);
      return () => window.removeEventListener('resize', updatePosition);
    }, [isOpen]);
    
    // Reset values when filter changes or when opening
    useEffect(() => {
      setTempMin(filter.min ?? min);
      setTempMax(filter.max ?? max);
    }, [filter.min, filter.max, min, max]);
    
    // Close on escape and outside clicks
    useEffect(() => {
      if (!isOpen) return;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };
      
      const handleClickOutside = (e: MouseEvent) => {
        if (
          popoverRef.current && 
          buttonRef.current && 
          !popoverRef.current.contains(e.target as Node) && 
          !buttonRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      
      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      
      // Clean up
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);
    
    // Check if filter is active
    const isActive = filter.min !== null || filter.max !== null;
    
    // Handle slider change
    const handleSliderChange = (values: number[]) => {
      setTempMin(values[0]);
      setTempMax(values[1]);
    };
    
    // Apply filter
    const applyFilter = () => {
      const newMin = tempMin <= min * 1.01 ? null : tempMin;
      const newMax = tempMax >= max * 0.99 ? null : tempMax;
      
      updateRangeFilter(column, 'min', newMin);
      updateRangeFilter(column, 'max', newMax);
      setIsOpen(false);
    };
    
    // Clear filter
    const clearFilter = () => {
      updateRangeFilter(column, 'min', null);
      updateRangeFilter(column, 'max', null);
      setTempMin(min);
      setTempMax(max);
      setIsOpen(false);
    };
    
    // Toggle filter popover
    const toggleFilter = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
    };
    
    // Calculate positioning classes based on position
    const getPositionClasses = () => {
      switch (popoverPosition) {
        case 'left':
          return 'left-0';
        case 'right':
          return 'right-0';
        default:
          return 'left-1/2 -translate-x-1/2';
      }
    };
    
    return (
      <div className="relative inline-block">
        <button
          ref={buttonRef}
          type="button"
          className={`flex items-center justify-center h-8 w-8 p-0 ml-2 rounded-md ${
            isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50'
          }`}
          onClick={toggleFilter}
          aria-label={`Filter by ${label}`}
        >
          <Filter className="h-4 w-4" />
          {isActive && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full" />}
        </button>
        
        {isOpen && (
          <div
            ref={popoverRef}
            className={`fixed z-[9999] mt-2 w-80 rounded-md shadow-lg bg-popover border border-border p-4 ${getPositionClasses()}`}
            style={{
              top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + window.scrollY : 0,
              left: buttonRef.current && popoverPosition === 'center' ? 
                buttonRef.current.getBoundingClientRect().left + buttonRef.current.offsetWidth / 2 + window.scrollX : 
                undefined
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="font-medium text-lg">Filter by {label}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isActive ? (
                      <span className="text-primary font-medium">
                        Current: {formatValue(filter.min ?? min)} - {formatValue(filter.max ?? max)}
                      </span>
                    ) : (
                      "Select a range to filter cards"
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className="h-8 w-8 p-0 rounded-full hover:bg-muted flex items-center justify-center"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="pt-2 pb-2">
                <div className="flex justify-between mb-4">
                  <div className="text-sm">
                    <div className="font-medium">Min</div>
                    <div className="text-primary font-bold">{formatValue(tempMin)}</div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="font-medium">Max</div>
                    <div className="text-primary font-bold">{formatValue(tempMax)}</div>
                  </div>
                </div>
                
                <div className="py-6 px-4 border rounded-md bg-muted/20">
                  <div className="mb-4 text-sm text-center text-muted-foreground">
                    Drag handles to set range
                  </div>
                  <div className="py-3">
                    <Slider
                      defaultValue={[tempMin, tempMax]}
                      value={[tempMin, tempMax]}
                      min={min}
                      max={max}
                      step={(max - min) / 100}
                      onValueChange={handleSliderChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <button 
                  type="button"
                  className="w-1/2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium"
                  onClick={clearFilter}
                >
                  Clear
                </button>
                <button 
                  type="button"
                  className="w-1/2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
                  onClick={applyFilter}
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Loading state component
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  // Error state component
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Card Profit Pulse</h1>
          <p className="text-sm text-muted-foreground">
            Last updated: {formattedDate}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-8 w-full sm:w-64"
            />
          </div>
          
          <Select value={sportFilter} onValueChange={handleSportChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Sport" />
            </SelectTrigger>
            <SelectContent>
              {sportOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Cards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCards.length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              out of {cards.length.toLocaleString()} total cards
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg PSA 10 Multiplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgPsa10Multiplier.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Raw to PSA 10 price ratio
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Potential Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(avgPotentialProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average profit from Raw to PSA 10
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
        
        {/* Chart View */}
        <TabsContent value="chart" className="space-y-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle>PSA 10 Multiplier vs. Potential Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="PSA 10 Multiplier" 
                      unit="x"
                      domain={['auto', 'auto']}
                      label={{ value: 'PSA 10 Multiplier', position: 'bottom' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Potential Profit" 
                      unit="$"
                      label={{ value: 'Potential Profit ($)', angle: -90, position: 'left' }}
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[20, 200]} 
                      name="Raw Avg" 
                      unit="$" 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Legend />
                    <Scatter 
                      name="Cards" 
                      data={chartData} 
                      fill="#8884d8" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Cards for Flipping</CardTitle>
              {hasActiveFilters && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 px-2 text-xs flex items-center"
                  onClick={clearAllFilters}
                >
                  <X className="h-3 w-3 mr-1" /> Clear All Filters
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead 
                        onClick={() => handleSort('sport')}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span>Sport</span> {renderSortIcon('sport')}
                          </div>
                          <SportFilter />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('card_id')}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span>Card</span> {renderSortIcon('card_id')}
                          </div>
                          <CardFilter />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('raw_avg')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>Raw Avg</span> {renderSortIcon('raw_avg')}
                          </div>
                          <NumberRangeFilter 
                            column="raw_avg" 
                            label="Raw Avg Price" 
                            min={minMaxValues.raw_avg.min} 
                            max={minMaxValues.raw_avg.max}
                            formatValue={(value) => formatCurrency(value)}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('psa_9_avg')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>PSA 9 Avg</span> {renderSortIcon('psa_9_avg')}
                          </div>
                          <NumberRangeFilter 
                            column="psa_9_avg" 
                            label="PSA 9 Avg Price" 
                            min={minMaxValues.psa_9_avg.min} 
                            max={minMaxValues.psa_9_avg.max}
                            formatValue={(value) => formatCurrency(value)}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('psa_10_avg')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>PSA 10 Avg</span> {renderSortIcon('psa_10_avg')}
                          </div>
                          <NumberRangeFilter 
                            column="psa_10_avg" 
                            label="PSA 10 Avg Price" 
                            min={minMaxValues.psa_10_avg.min} 
                            max={minMaxValues.psa_10_avg.max}
                            formatValue={(value) => formatCurrency(value)}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('psa_10_multiplier')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>PSA 10 Multiplier</span> {renderSortIcon('psa_10_multiplier')}
                          </div>
                          <NumberRangeFilter 
                            column="psa_10_multiplier" 
                            label="PSA 10 Multiplier" 
                            min={minMaxValues.psa_10_multiplier.min} 
                            max={minMaxValues.psa_10_multiplier.max}
                            formatValue={(value) => `${value.toFixed(1)}x`}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('psa_9_multiplier')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>PSA 9 Multiplier</span> {renderSortIcon('psa_9_multiplier')}
                          </div>
                          <NumberRangeFilter 
                            column="psa_9_multiplier" 
                            label="PSA 9 Multiplier" 
                            min={minMaxValues.psa_9_multiplier.min} 
                            max={minMaxValues.psa_9_multiplier.max}
                            formatValue={(value) => `${value.toFixed(1)}x`}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('potential_profit_psa_9')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>PSA 9 Profit</span> {renderSortIcon('potential_profit_psa_9')}
                          </div>
                          <NumberRangeFilter 
                            column="potential_profit_psa_9" 
                            label="PSA 9 Potential Profit" 
                            min={minMaxValues.potential_profit_psa_9.min} 
                            max={minMaxValues.potential_profit_psa_9.max}
                            formatValue={(value) => formatCurrency(value)}
                          />
                        </div>
                      </TableHead>
                      <TableHead 
                        onClick={() => handleSort('potential_profit_psa_10')}
                        className="text-right cursor-pointer hover:bg-muted/50"
                      >
                        <div className="flex items-center justify-end">
                          <div className="flex items-center">
                            <span>PSA 10 Profit</span> {renderSortIcon('potential_profit_psa_10')}
                          </div>
                          <NumberRangeFilter 
                            column="potential_profit_psa_10" 
                            label="PSA 10 Potential Profit" 
                            min={minMaxValues.potential_profit_psa_10.min} 
                            max={minMaxValues.potential_profit_psa_10.max}
                            formatValue={(value) => formatCurrency(value)}
                          />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentCards.length > 0 ? (
                      currentCards.map((card) => (
                        <TableRow key={card.id} className={card.psa_10_multiplier >= 7 ? "bg-yellow-50" : ""}>
                          <TableCell>
                            <Badge variant="outline">{card.sport}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCardId(card.card_id)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(card.raw_avg)}
                          </TableCell>
                          <TableCell className="text-right">
                            {card.psa_9_avg ? formatCurrency(card.psa_9_avg) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(card.psa_10_avg)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatMultiplier(card.psa_10_multiplier)}
                          </TableCell>
                          <TableCell className="text-right">
                            {card.psa_9_multiplier ? formatMultiplier(card.psa_9_multiplier) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-blue-600">
                            {card.potential_profit_psa_9 !== null ? formatCurrency(card.potential_profit_psa_9) : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">
                            {formatCurrency(card.potential_profit_psa_10)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No cards match your filter criteria. Try adjusting your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show current page in middle when possible
                      let pageToShow = currentPage;
                      if (currentPage < 3) {
                        pageToShow = i + 1;
                      } else if (currentPage > totalPages - 2) {
                        pageToShow = totalPages - 4 + i;
                      } else {
                        pageToShow = currentPage - 2 + i;
                      }
                      
                      // Ensure page is in valid range
                      if (pageToShow > 0 && pageToShow <= totalPages) {
                        return (
                          <button
                            key={pageToShow}
                            onClick={() => paginate(pageToShow)}
                            className={`px-3 py-1 rounded border ${
                              currentPage === pageToShow
                                ? 'bg-primary text-primary-foreground'
                                : ''
                            }`}
                          >
                            {pageToShow}
                          </button>
                        );
                      }
                      return null;
                    }).filter(Boolean)}
                  </div>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 