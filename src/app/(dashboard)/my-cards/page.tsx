'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { 
  Search, LayoutGrid, Table, Plus, ArrowUpDown, Loader2, 
  Check, X, Info, CalendarIcon, TrendingUp, TrendingDown, 
  DollarSign, Package, Clock, ArrowUp, ArrowDown, 
  AlertTriangle, Download, Filter, BarChart3, PlusCircle,
  GripVertical, SlidersHorizontal, ChevronDown, CheckSquare,
  Upload, Warehouse, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { updateCardField, uploadCardImage } from '@/app/actions/cards';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { getCardsByUserId } from '@/app/actions/cards';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { SavedViews } from '@/components/table/saved-views';
import { useTableConfig, TableColumnVisibility, TableFilterState } from '@/hooks/useTableConfig';

interface CardData {
  id: string;
  name: string;
  player?: string | null;
  year?: number | null;
  manufacturer?: string | null;
  grade?: string | null;
  purchase_price?: number | null;
  status?: string | null;
  current_value?: number | null;
  source?: string | null;
  sport?: string | null;
  created_at?: string | null;
  owner_id?: string | null;
  grading_cost?: number | null;
  taxes?: number | null;
  shipping?: number | null;
  all_in_cost?: number | null;
  sale_price?: number | null;
  selling_fees?: number | null;
  is_sold?: boolean;
  profit?: number | null;
  sales_date?: string | null;
  date_shipped_to_grade?: string | null;
  date_received_from_grade?: string | null;
  grading_submission_date?: string | null;
  grading_returned_date?: string | null;
  days_to_grade?: number | null;
  days_held?: number | null;
  roi?: number | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
}

// Simplified column definition interface to avoid TanStack React Table dependencies
interface ColumnDef {
  id: string;
  header?: string | ((props: any) => React.ReactNode);
}

const GRADE_OPTIONS = ['PSA 10', 'PSA 9', 'PSA 8', 'PSA 7', 'PSA 6', 'PSA 5', 'PSA 4', 'PSA 3', 'PSA 2', 'PSA 1', 
                      'BGS 10', 'BGS 9.5', 'BGS 9', 'BGS 8.5', 'BGS 8', 'Raw'];
const SPORT_OPTIONS = ['Soccer', 'Football', 'Basketball', 'Baseball', 'Hockey', 'Pokemon', 'WNBA'];
const SOURCE_OPTIONS = ['Facebook', 'Ebay', 'Instagram', 'TikTok', 'In-Person', 'Other', 'Other Auction'];
const STATUS_OPTIONS = ['Purchased', 'Sent for Grading', 'Listed', 'Sold'];

// Add filter type definitions
type FilterValue = string | number | boolean | null;

type ColumnFilter = {
  type: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 
        'greaterThan' | 'lessThan' | 'between' | 'in' | 'isEmpty';
  value: FilterValue | FilterValue[];
};

type FilterState = Record<string, ColumnFilter | null>;

function CurrencyInput({ value, onChange, onBlur, autoFocus }: { 
  value: number | null | undefined, 
  onChange: (value: number | null) => void,
  onBlur: () => void,
  autoFocus?: boolean 
}) {
  // Convert initial value to a string without the dollar sign for internal state
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  // Format the displayed value with proper currency formatting
  const displayValue = value !== null && value !== undefined 
    ? formatCurrency(value) 
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove currency formatting for editing (remove $ and commas)
    let rawValue = e.target.value.replace(/[$,]/g, '');
    
    // Handle empty or decimal point only cases
    if (rawValue === '' || rawValue === '.') {
      setInputValue(rawValue);
      onChange(null);
      return;
    }

    // Ensure we don't have multiple decimal points
    const decimalPoints = (rawValue.match(/\./g) || []).length;
    if (decimalPoints > 1) {
      return;
    }

    // Allow any number before decimal, and up to 2 digits after decimal
    const regex = /^\d*\.?\d{0,2}$/;
    if (!regex.test(rawValue)) {
      return;
    }

    setInputValue(rawValue);
    const numVal = parseFloat(rawValue);
    if (!isNaN(numVal)) {
      onChange(numVal);
    }
  };

  return (
    <Input
      type="text"
      value={isNaN(parseFloat(inputValue)) ? displayValue : inputValue}
      onChange={handleChange}
      onBlur={() => {
        if (inputValue) {
          const numVal = parseFloat(inputValue);
          if (!isNaN(numVal)) {
            setInputValue(numVal.toFixed(2));
            onChange(numVal);
          }
        }
        onBlur();
      }}
      onFocus={(e) => {
        e.target.value = inputValue;
        e.target.select();
      }}
      className="h-8"
      autoFocus={autoFocus}
      placeholder="$0.00"
    />
  );
}

function YearInput({ value, onChange, onBlur, autoFocus }: {
  value: number | null | undefined,
  onChange: (value: number | null) => void,
  onBlur: () => void,
  autoFocus?: boolean
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(parseInt(val))}
      onOpenChange={(open) => !open && onBlur()}
    >
      <SelectTrigger className="h-8">
        <SelectValue placeholder="Select year" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DateInput({ value, onChange, onBlur }: { 
  value: string | null | undefined, 
  onChange: (value: string | null) => void,
  onBlur: () => void
}) {
  // Format the date for the input field (yyyy-MM-dd)
  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const [inputValue, setInputValue] = useState(formatDateForInput(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    // Update the parent component with the ISO string value
    if (val) {
      try {
        const dateObj = new Date(val);
        if (!isNaN(dateObj.getTime())) {
          onChange(dateObj.toISOString());
        }
      } catch (err) {
        console.error('Invalid date:', err);
      }
    } else {
      onChange(null);
    }
  };

  return (
    <Input
      type="date"
      value={inputValue}
      onChange={handleChange}
      onBlur={onBlur}
      className="h-8"
    />
  );
}

// Add a helper function for consistent currency formatting
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Helper for profit display that properly color-codes values
function formatProfit(value: number | null | undefined): JSX.Element | string {
  if (value === null || value === undefined) return '-';
  return value >= 0 
    ? <span className="text-green-600">{formatCurrency(value)}</span>
    : <span className="text-red-600">{formatCurrency(value)}</span>;
}

// Create a ThumbnailImage component to display card thumbnails
function ThumbnailImage({ 
  cardId, 
  imageUrl 
}: { 
  cardId: string | number | null;
  imageUrl: string | null | undefined;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const placeholderUrl = '/images/card-placeholder.png'; // Default placeholder

  return (
    <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted flex items-center justify-center mx-auto">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="Card thumbnail"
          fill
          sizes="40px"
          className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setError(true);
            setIsLoading(false);
          }}
        />
      ) : (
        <div className="text-muted-foreground text-[0.6rem]">No image</div>
      )}
      
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// Define a simplified columns array with ALL fields from CardData
const columns: ColumnDef[] = [
  { id: "thumbnail", header: "Image" },
  { id: "name", header: "Name" },
  { id: "player", header: "Player" },
  { id: "year", header: "Year" },
  { id: "manufacturer", header: "Brand" },
  { id: "grade", header: "Grade" },
  { id: "purchase_price", header: "Purchase Price" },
  { id: "current_value", header: "Current Value" },
  { id: "status", header: "Status" },
  { id: "sport", header: "Sport" },
  { id: "source", header: "Source" },
  { id: "created_at", header: "Purchase Date" },
  { id: "sale_price", header: "Sale Price" },
  { id: "profit", header: "Profit" },
  { id: "roi", header: "ROI %" },
  { id: "grading_cost", header: "Grading Cost" },
  { id: "shipping", header: "Shipping" },
  { id: "selling_fees", header: "Selling Fees" },
  { id: "taxes", header: "Taxes" },
  { id: "all_in_cost", header: "All-In Cost" },
  { id: "days_to_grade", header: "Days to Grade" },
  { id: "days_held", header: "Days Held" },
  { id: "sales_date", header: "Sale Date" },
  { id: "date_shipped_to_grade", header: "Date Shipped to Grade" },
  { id: "date_received_from_grade", header: "Date Received from Grade" }
  // Removed "is_sold" as it's a backend field that shouldn't be visible in the UI
];

// Add a verbose logging helper function after the CardData interface
function logDebug(message: string, data?: any) {
  const DEBUG = true; // Set to false in production
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`, data !== undefined ? data : '');
  }
}

// Add after logDebug function to inspect schema
const inspectSchema = async (supabaseClient: any) => {
  if (!supabaseClient) return;
  
  try {
    // Use direct table query since we've standardized on Clerk IDs
    const { data, error } = await (supabaseClient as any)
      .from('cards')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Error inspecting schema:', error);
      return;
    }
    
    // Log the structure of the first card
    if (data && data.length > 0) {
      console.log('Card table schema inspection:');
      
      // Log each field and its type
      Object.entries(data[0]).forEach(([key, value]) => {
        console.log(`Field: ${key}, Type: ${typeof value}, Value:`, value);
      });
    } else {
      console.log('No card found for schema inspection');
    }
  } catch (err) {
    console.error('Schema inspection failed:', err);
  }
};

// Add the enhanced dashboard component after the EditableCell component
function TableSummary({ 
  data, 
  totalCardCount,
  onExport 
}: { 
  data: CardData[], 
  totalCardCount: number,
  onExport: () => void 
}) {
  // Calculate inventory stats
  const soldCards = data.filter(card => 
    card.sale_price || card.sales_date
  ).length;
  
  const inInventory = data.filter(card => 
    (card.status === 'Purchased' || card.status === 'Listed' || card.status === 'Sent for Grading') && 
    !card.sale_price && !card.sales_date
  ).length;
  
  const awaitingGrade = data.filter(card => 
    card.status === 'Sent for Grading' && 
    card.date_shipped_to_grade && 
    !card.date_received_from_grade
  ).length;
  
  // Inventory and sold cards for calculations
  const inventoryCards = data.filter(card => !card.sale_price && !card.sales_date);
  const soldCardsArray = data.filter(card => card.sale_price || card.sales_date);
  
  // Calculate financial totals
  const totalAllInCost = data.reduce((sum, card) => sum + (card.all_in_cost || 0), 0);
  const totalTaxes = data.reduce((sum, card) => sum + (card.taxes || 0), 0);
  const totalGradingFees = data.reduce((sum, card) => sum + (card.grading_cost || 0), 0);
  const totalPurchasePrice = data.reduce((sum, card) => sum + (card.purchase_price || 0), 0);
  const totalCurrentValue = inventoryCards.reduce((sum, card) => sum + (card.current_value || 0), 0);
  const totalShippingCost = data.reduce((sum, card) => sum + (card.shipping || 0), 0);
  const totalSellingFees = data.reduce((sum, card) => sum + (card.selling_fees || 0), 0);
  const totalSalesPrice = soldCardsArray.reduce((sum, card) => sum + (card.sale_price || 0), 0);
  const totalProfit = data.reduce((sum, card) => sum + (card.profit || 0), 0);
  
  // Calculate ROI for all displayed cards
  const overallROI = totalAllInCost > 0 
    ? (totalProfit / totalAllInCost) * 100
    : 0;
  
  // Calculate averages
  const cardsWithDaysToGrade = data.filter(card => card.days_to_grade !== null && card.days_to_grade !== undefined);
  const avgDaysToGrade = cardsWithDaysToGrade.length > 0 
    ? cardsWithDaysToGrade.reduce((sum, card) => sum + (card.days_to_grade || 0), 0) / cardsWithDaysToGrade.length
    : 0;
    
  const cardsWithDaysHeld = data.filter(card => card.days_held !== null && card.days_held !== undefined);
  const avgDaysHeld = cardsWithDaysHeld.length > 0 
    ? cardsWithDaysHeld.reduce((sum, card) => sum + (card.days_held || 0), 0) / cardsWithDaysHeld.length
    : 0;
  
  // Data for inventory status donut chart
  const inventoryStatusData = [
    { name: 'In Inventory', value: inInventory, color: '#3B82F6' },
    { name: 'Sold Cards', value: soldCards, color: '#10B981' },
    { name: 'Awaiting Grade', value: awaitingGrade, color: '#F59E0B' }
  ].filter(item => item.value > 0); // Only show segments with values > 0

  // Data for cost breakdown pie chart
  const costBreakdownData = [
    { name: 'Purchase Price', value: totalPurchasePrice, color: '#F97316' },
    { name: 'Grading Fees', value: totalGradingFees, color: '#8B5CF6' },
    { name: 'Taxes', value: totalTaxes, color: '#EC4899' },
    { name: 'Shipping', value: totalShippingCost, color: '#6366F1' },
    { name: 'Selling Fees', value: totalSellingFees, color: '#14B8A6' }
  ].filter(item => item.value > 0); // Only show segments with values > 0

  // Data for timeline bar chart
  const timelineData = [
    { name: 'Days to Grade', value: avgDaysToGrade },
    { name: 'Days Held', value: avgDaysHeld }
  ];

  // Create mock data for profit trend (since we don't have historical data)
  // In a real implementation, this would come from actual historical data
  const profitTrendData = [
    { date: '1/1', profit: totalProfit * 0.2, roi: overallROI * 0.2 },
    { date: '1/8', profit: totalProfit * 0.4, roi: overallROI * 0.4 },
    { date: '1/15', profit: totalProfit * 0.6, roi: overallROI * 0.6 },
    { date: '1/22', profit: totalProfit * 0.8, roi: overallROI * 0.8 },
    { date: '1/29', profit: totalProfit, roi: overallROI }
  ];

  // Helper function to determine if a trend is positive
  const isPositiveTrend = (value: number) => value >= 0;

  // Custom formatter for currency values in charts
  const currencyFormatter = (value: number) => formatCurrency(value);
  
  // Custom formatter for percentage values in charts
  const percentFormatter = (value: number) => `${value.toFixed(2)}%`;

  const handleExportCSV = () => {
    // Create CSV content
    const csvContent = [
      // Header row
      ['Metric', 'Value'],
      ['Total Cards', data.length],
      ['In Inventory', inInventory],
      ['Sold Cards', soldCards],
      ['Awaiting Grade', awaitingGrade],
      ['Total Profit', totalProfit],
      ['Overall ROI', `${overallROI.toFixed(1)}%`],
      ['Total Purchase Price', totalPurchasePrice],
      ['Total Inventory Value', totalCurrentValue],
      ['Total All-In Cost', totalAllInCost],
      ['Total Sales Price', totalSalesPrice],
      ['Total Taxes', totalTaxes],
      ['Total Grading Fees', totalGradingFees],
      ['Total Shipping Cost', totalShippingCost],
      ['Total Selling Fees', totalSellingFees],
      ['Avg Days to Grade', avgDaysToGrade],
      ['Avg Days Held', avgDaysHeld]
    ].map(row => row.join(',')).join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `card-summary-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-sports text-sports-blue tracking-tight">Sports Card Inventory Summary</h2>
            {data.length < totalCardCount && (
              <div className="text-sm text-sports-blue mt-1 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                <span>Displaying summary for {data.length} filtered cards</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={onExport}
            className="flex items-center gap-2 border-2 border-foil-silver hover:border-sports-blue rounded-full shadow-sm hover:shadow-button-hover"
          >
            <Download className="h-4 w-4 text-sports-blue" />
            <span className="font-medium">Export CSV</span>
          </Button>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Total Profit and ROI Card */}
          <div className="bg-white dark:bg-neutral-dark border-2 border-foil-silver dark:border-neutral-gray rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200">
            <div className="grid grid-cols-2 gap-6">
              {/* Total Profit Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-sports-red text-white p-1.5 rounded-md">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <h3 className="font-sports text-xl text-neutral-dark dark:text-neutral-gray">Total Profit</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-neutral-gray" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-60">Total profit = Sales Price ({formatCurrency(totalSalesPrice)}) - All-In Cost ({formatCurrency(totalAllInCost)})</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-sports ${totalProfit >= 0 ? 'text-field-green' : 'text-sports-red'}`}>
                    {formatCurrency(totalProfit)}
                  </span>
                  {isPositiveTrend(totalProfit) ? (
                    <span className="flex items-center text-field-green text-sm font-medium">
                      <TrendingUp className="h-4 w-4 mr-1" /> Profitable
                    </span>
                  ) : (
                    <span className="flex items-center text-sports-red text-sm font-medium">
                      <TrendingDown className="h-4 w-4 mr-1" /> Loss
                    </span>
                  )}
                </div>
              </div>

              {/* ROI Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-field-green text-white p-1.5 rounded-md">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="font-sports text-xl text-neutral-dark dark:text-neutral-gray">ROI</h3>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-neutral-gray" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-60">Return on Investment = (Total Profit / Total Cost) × 100</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-end gap-3">
                  <span className={`text-4xl font-sports ${overallROI >= 0 ? 'text-field-green' : 'text-sports-red'}`}>
                    {overallROI.toFixed(1)}%
                  </span>
                  <span className="flex items-center text-field-green text-sm font-medium">
                    <ArrowUp className="h-4 w-4 mr-1" /> Market +15%
                  </span>
                </div>
              </div>
            </div>

            {!isPositiveTrend(totalProfit) && (
              <div className="flex items-center text-sm bg-red-50 dark:bg-red-950/30 text-sports-red dark:text-red-400 p-3 rounded-md mt-4 border border-red-200 dark:border-red-900">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Significant losses detected. Consider adjusting your pricing strategy.</span>
              </div>
            )}
          </div>

          {/* Grading and Inventory Metrics Card */}
          <div className="bg-white dark:bg-neutral-dark border-2 border-foil-silver dark:border-neutral-gray rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all duration-200">
            <div className="grid grid-cols-2 gap-6">
              {/* Grading Time Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-foil-gold text-white p-1.5 rounded-md">
                      <Clock className="h-5 w-5" />
                    </div>
                    <h3 className="font-sports text-xl text-neutral-dark dark:text-neutral-gray">Average Grading Time</h3>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-sports text-foil-gold mr-1">
                      {Math.round(avgDaysToGrade)}
                    </span>
                    <span className="text-sm text-neutral-gray">days</span>
                  </div>
                </div>
              </div>

              {/* Inventory Days Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-sports-blue text-white p-1.5 rounded-md">
                      <Package className="h-5 w-5" />
                    </div>
                    <h3 className="font-sports text-xl text-neutral-dark dark:text-neutral-gray">Average Days in Inventory</h3>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-sports text-sports-blue mr-1">
                      {Math.round(avgDaysHeld)}
                    </span>
                    <span className="text-sm text-neutral-gray">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Bar Chart */}
            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis dataKey="name" hide={true} />
                  <YAxis hide />
                  <RechartsTooltip
                    formatter={(value) => [`${value} days`, 'Duration']}
                    contentStyle={{
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      backgroundColor: '#fff'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {timelineData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#F59E0B' : '#3B82F6'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Three Column Cards - Inventory, Financial, Timing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Inventory Status */}
          <div className="bg-white dark:bg-neutral-dark border-2 border-foil-silver dark:border-neutral-gray rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-sports-blue text-white p-1.5 rounded-md">
                <Package className="h-5 w-5" />
              </div>
              <h3 className="font-sports text-xl text-neutral-dark dark:text-white font-bold">Inventory Status</h3>
            </div>
            
            {inventoryStatusData.length > 0 && (
              <>
                {/* Card Count Headers - Match the Financial Breakdown styling */}
                <div className="flex justify-around text-center mb-5">
                  <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 w-full mx-1">
                    <div className="text-sm text-neutral-gray font-medium">In Inventory</div>
                    <div className="text-lg font-sports text-sports-blue mt-1">{inInventory}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 w-full mx-1">
                    <div className="text-sm text-neutral-gray font-medium">Grading</div>
                    <div className="text-lg font-sports text-foil-gold mt-1">{awaitingGrade}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 w-full mx-1">
                    <div className="text-sm text-neutral-gray font-medium">Sold</div>
                    <div className="text-lg font-sports text-field-green mt-1">{soldCards}</div>
                  </div>
                </div>

                {/* Chart Area - Match height and structure with Financial Breakdown */}
                <div className="h-[220px] grid grid-rows-[1fr_auto]">
                  {/* Chart Area */}
                  <div className="relative">
                    <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                      <PieChart>
                        <Pie
                          data={inventoryStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={false}
                          labelLine={false}
                        >
                          {inventoryStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend - Match style with Financial Breakdown */}
                  <div className="pt-2 pb-1 flex justify-center">
                    <div className="flex items-center flex-wrap justify-center gap-2">
                      {inventoryStatusData.map((entry, index) => (
                        <div key={`legend-${index}`} className="flex items-center">
                          <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs">{entry.name} ({((entry.value / (inInventory + soldCards + awaitingGrade)) * 100).toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Financial Breakdown Card */}
          <div className="bg-white dark:bg-neutral-dark border-2 border-foil-silver dark:border-neutral-gray rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-500 text-white p-1.5 rounded-md">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="font-sports text-xl text-neutral-dark dark:text-white font-bold">Financial Breakdown</h3>
            </div>

            {/* Cost Metrics */}
            <div className="flex justify-around text-center mb-5">
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 w-full mx-1">
                <div className="text-sm text-neutral-gray font-medium">Purchase Cost</div>
                <div className="text-lg font-sports text-sports-red mt-1">{formatCurrency(totalPurchasePrice)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 w-full mx-1">
                <div className="text-sm text-neutral-gray font-medium">Inventory Value</div>
                <div className="text-lg font-sports text-emerald-500 mt-1">{formatCurrency(totalCurrentValue)}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/20 rounded-lg p-3 w-full mx-1">
                <div className="text-sm text-neutral-gray font-medium">Sales Revenue</div>
                <div className="text-lg font-sports text-amber-500 mt-1">{formatCurrency(totalSalesPrice)}</div>
              </div>
            </div>

            {/* Cost Breakdown Pie Chart */}
            <div className="h-[220px] grid grid-rows-[1fr_auto]">
              {/* Chart Area */}
              <div className="relative">
                <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
                  <PieChart>
                    <Pie
                      data={costBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={false}
                      labelLine={false}
                    >
                      {costBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="pt-2 pb-1 flex justify-center">
                <div className="flex items-center flex-wrap justify-center gap-2">
                  {costBreakdownData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center">
                      <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs">{entry.name} ({((entry.value / totalAllInCost) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Profit Trend */}
          <div className="bg-white dark:bg-neutral-dark border-2 border-foil-silver dark:border-neutral-gray rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-field-green text-white p-1.5 rounded-md">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="font-sports text-xl text-neutral-dark dark:text-white font-bold">Profit Trend</h3>
              </div>
              
              {/* Current period indicators */}
              <div className="flex items-center gap-6 text-base">
                <div className="flex flex-col items-end">
                  <span className="text-neutral-gray font-bold">Current Period</span>
                  <span className={`font-sports text-lg ${totalProfit >= 0 ? 'text-field-green' : 'text-sports-red'}`}>
                    {formatCurrency(totalProfit)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-neutral-gray font-bold">ROI</span>
                  <span className={`font-sports text-lg ${overallROI >= 0 ? 'text-field-green' : 'text-sports-red'}`}>
                    {overallROI.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={[
                    { date: '1/1', profit: totalProfit * 0.2, roi: overallROI * 0.2 },
                    { date: '1/8', profit: totalProfit * 0.35, roi: overallROI * 0.35 },
                    { date: '1/15', profit: totalProfit * 0.45, roi: overallROI * 0.45 },
                    { date: '1/22', profit: totalProfit * 0.6, roi: overallROI * 0.6 },
                    { date: '1/29', profit: totalProfit * 0.75, roi: overallROI * 0.75 },
                    { date: '2/5', profit: totalProfit * 0.85, roi: overallROI * 0.85 },
                    { date: '2/12', profit: totalProfit * 0.95, roi: overallROI * 0.95 },
                    { date: '2/19', profit: totalProfit, roi: overallROI }
                  ]}
                  margin={{ top: 20, right: 20, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 14 }}
                  />
                  <YAxis 
                    yAxisId="profit"
                    orientation="left"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 14 }}
                    tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value/1000).toFixed(1)}k` : value}`}
                    domain={[(dataMin: number) => Math.floor(dataMin * 1.1), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                    padding={{ top: 20, bottom: 20 }}
                    width={50}
                  />
                  <YAxis 
                    yAxisId="roi"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#666', fontSize: 14 }}
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    domain={[(dataMin: number) => Math.floor(dataMin * 1.1), (dataMax: number) => Math.ceil(dataMax * 1.1)]}
                    padding={{ top: 20, bottom: 20 }}
                    width={35}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36}
                    iconSize={14}
                    iconType="circle"
                    align="center"
                    formatter={(value) => <span className="text-base font-bold">{value}</span>}
                  />
                  <Line 
                    yAxisId="profit"
                    type="monotone" 
                    dataKey="profit" 
                    name="Profit"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#EF4444", strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: "#EF4444" }}
                  />
                  <Line 
                    yAxisId="roi"
                    type="monotone" 
                    dataKey="roi" 
                    name="ROI"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 6, fill: "#3B82F6", strokeWidth: 0 }}
                    activeDot={{ r: 8, fill: "#3B82F6" }}
                  />
                  <RechartsTooltip 
                    formatter={(value: number, name: string) => [
                      name === 'profit' ? formatCurrency(value) : `${value.toFixed(1)}%`,
                      name === 'profit' ? 'Profit' : 'ROI'
                    ]}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Update the EditableCell component to use AutocompleteInput for specific fields
function EditableCell({
  value: initialValue,
  row,
  column,
  updateData,
  uniqueValues,
}: {
  value: any;
  row: any;
  column: any;
  updateData: (rowIndex: number, columnId: string, value: any) => void;
  uniqueValues?: Record<string, any[]>;
}) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);
  
  // Identify calculated fields that shouldn't be editable
  const isCalculatedField = ['days_to_grade', 'days_held', 'profit', 'roi', 'all_in_cost'].includes(column.id);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      updateData(row.index, column.id, value);
    }
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Format the display value based on column type
  const getFormattedValue = () => {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // For date fields
    if (['date_shipped_to_grade', 'date_received_from_grade', 'sales_date', 
         'created_at', 'grading_submission_date', 'grading_returned_date'].includes(column.id)) {
      try {
        return new Date(value).toLocaleDateString('en-US', {
          month: '2-digit', 
          day: '2-digit', 
          year: '2-digit'
        });
      } catch (err) {
        return value;
      }
    }

    // For currency fields
    if (['purchase_price', 'current_value', 'grading_cost', 'taxes', 
         'shipping', 'selling_fees', 'sale_price', 'all_in_cost', 'profit'].includes(column.id) && 
        typeof value === 'number') {
      return formatCurrency(value);
    }
    
    // For percentage fields
    if (column.id === 'roi' && typeof value === 'number') {
      return `${value.toFixed(1)}%`;
    }

    return value;
  };

  // Determine text color class based on the column and value
  const getTextColorClass = () => {
    if (value === null || value === undefined) return '';
    
    // Positive values for profit, current value, and sale price - green
    if ((column.id === 'current_value' || column.id === 'profit' || column.id === 'sale_price') && 
        typeof value === 'number' && value > 0) {
      return 'text-green-600';
    }
    
    // Negative values for profit - red
    if (column.id === 'profit' && typeof value === 'number' && value < 0) {
      return 'text-red-600';
    }
    
    // Expense values - red
    if (['taxes', 'shipping', 'selling_fees', 'grading_cost'].includes(column.id) && 
        typeof value === 'number' && value > 0) {
      return 'text-red-600';
    }
    
    return '';
  };

  // Don't allow editing for calculated fields
  if (isEditing && !isCalculatedField) {
    switch (column.id) {
      case 'grade':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => {
              setValue(val);
              updateData(row.index, column.id, val);
              setIsEditing(false);
            }}
            onOpenChange={(open) => !open && setIsEditing(false)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'sport':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => {
              setValue(val);
              updateData(row.index, column.id, val);
              setIsEditing(false);
            }}
            onOpenChange={(open) => !open && setIsEditing(false)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORT_OPTIONS.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'source':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => {
              setValue(val);
              updateData(row.index, column.id, val);
              setIsEditing(false);
            }}
            onOpenChange={(open) => !open && setIsEditing(false)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'status':
        return (
          <Select
            value={value || ''}
            onValueChange={(val) => {
              setValue(val);
              updateData(row.index, column.id, val);
              setIsEditing(false);
            }}
            onOpenChange={(open) => !open && setIsEditing(false)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'purchase_price':
      case 'current_value':
      case 'grading_cost':
      case 'taxes':
      case 'shipping':
      case 'selling_fees':
      case 'sale_price':
        return (
          <CurrencyInput
            value={typeof value === 'number' ? value : null}
            onChange={(newValue) => {
              setValue(newValue);
              if (newValue !== null) {
                updateData(row.index, column.id, newValue);
              }
            }}
            onBlur={onBlur}
            autoFocus
          />
        );

      case 'year':
        return (
          <YearInput
            value={value}
            onChange={setValue}
            onBlur={onBlur}
            autoFocus
          />
        );

      case 'created_at':
      case 'sales_date':
      case 'date_shipped_to_grade':
      case 'date_received_from_grade':
      case 'grading_submission_date':
      case 'grading_returned_date':
        return (
          <DateInput
            value={value}
            onChange={setValue}
            onBlur={onBlur}
          />
        );

      // Use autocomplete for certain fields
      case 'player':
        return (
          <AutocompleteInput
            value={value as string}
            onChange={setValue}
            onBlur={onBlur}
            suggestions={uniqueValues?.player?.map(v => String(v)).filter(Boolean) || []}
            placeholder="Enter player name"
          />
        );

      case 'manufacturer':
        return (
          <AutocompleteInput
            value={value as string}
            onChange={setValue}
            onBlur={onBlur}
            suggestions={uniqueValues?.manufacturer?.map(v => String(v)).filter(Boolean) || []}
            placeholder="Enter brand name"
          />
        );

      // Free text fields (name)
      default:
        return (
          <Input
            value={value || ''}
            onChange={e => setValue(e.target.value)}
            onBlur={onBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                onBlur();
              }
              if (e.key === 'Escape') {
                setIsEditing(false);
                setValue(initialValue);
              }
            }}
            className="h-8 w-full"
            autoFocus
          />
        );
    }
  }

  return (
    <div
      className={`${isCalculatedField ? 'cursor-default' : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'} p-1 rounded-sm min-h-[1.75rem] flex items-center justify-center ${getTextColorClass()}`}
      onClick={() => !isCalculatedField && setIsEditing(true)}
      title={isCalculatedField ? "Calculated field (not editable)" : "Click to edit"}
    >
      <span className="text-sm font-medium">{getFormattedValue()}</span>
    </div>
  );
}

// Add a sortable item component for column reordering
function SortableColumnItem({ 
  id, 
  column, 
  isVisible, 
  onToggleVisibility 
}: { 
  id: string, 
  column: ColumnDef, 
  isVisible: boolean,
  onToggleVisibility: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-1 mb-1 bg-gray-50 dark:bg-gray-800 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <div className="flex items-center flex-1">
        <div 
          className="h-4 w-4 mr-2 text-gray-400 cursor-move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <Checkbox 
          id={id} 
          checked={isVisible}
          onCheckedChange={onToggleVisibility}
        />
        <label htmlFor={id} className="ml-2 text-sm cursor-pointer">
          {typeof column.header === 'string' ? column.header : column.id}
        </label>
      </div>
    </div>
  );
}

// Add filter components for different data types
function TextFilter({ 
  columnId, 
  currentFilter, 
  onApplyFilter, 
  onClearFilter 
}: { 
  columnId: string;
  currentFilter: ColumnFilter | null;
  onApplyFilter: (filter: ColumnFilter) => void;
  onClearFilter: () => void;
}) {
  const [filterType, setFilterType] = useState<ColumnFilter['type']>(
    currentFilter?.type || 'contains'
  );
  const [filterValue, setFilterValue] = useState<string>(
    (currentFilter?.value as string) || ''
  );

  return (
    <div className="p-2 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Filter type</label>
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as ColumnFilter['type'])}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="startsWith">Starts with</SelectItem>
            <SelectItem value="endsWith">Ends with</SelectItem>
            <SelectItem value="isEmpty">Is empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterType !== 'isEmpty' && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Filter value</label>
          <Input 
            value={filterValue} 
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder="Enter filter value"
            className="h-8"
          />
        </div>
      )}

      <div className="flex justify-between pt-2">
      <Button
          variant="outline" 
          size="sm"
          className="border-2 border-foil-silver hover:border-sports-blue rounded-full"
          onClick={onClearFilter}
      >
          Clear
      </Button>
      <Button
          variant="secondary" 
          size="sm"
          className="bg-sports-blue hover:bg-sports-blue-hover text-white rounded-full"
          onClick={() => onApplyFilter({
            type: filterType,
            value: filterType === 'isEmpty' ? null : filterValue
          })}
        >
          Apply Filter
      </Button>
      </div>
    </div>
  );
}

function NumberFilter({ 
  columnId, 
  currentFilter, 
  onApplyFilter, 
  onClearFilter 
}: { 
  columnId: string;
  currentFilter: ColumnFilter | null;
  onApplyFilter: (filter: ColumnFilter) => void;
  onClearFilter: () => void;
}) {
  const [filterType, setFilterType] = useState<ColumnFilter['type']>(
    currentFilter?.type || 'equals'
  );
  const [filterValue, setFilterValue] = useState<string>(
    currentFilter?.value !== null && currentFilter?.value !== undefined
      ? String(currentFilter.value)
      : ''
  );
  const [filterValueMax, setFilterValueMax] = useState<string>(
    Array.isArray(currentFilter?.value) && currentFilter.value.length > 1
      ? String(currentFilter.value[1])
      : ''
  );

  return (
    <div className="p-2 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Filter type</label>
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as ColumnFilter['type'])}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="greaterThan">Greater than</SelectItem>
            <SelectItem value="lessThan">Less than</SelectItem>
            <SelectItem value="between">Between</SelectItem>
            <SelectItem value="isEmpty">Is empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterType !== 'isEmpty' && (
        <div className="space-y-1">
          <label className="text-xs font-medium">
            {filterType === 'between' ? 'Minimum value' : 'Filter value'}
          </label>
          <Input 
            type="number"
            value={filterValue} 
            onChange={(e) => setFilterValue(e.target.value)}
            placeholder={filterType === 'between' ? "Min value" : "Enter value"}
            className="h-8"
          />
        </div>
      )}

      {filterType === 'between' && (
        <div className="space-y-1">
          <label className="text-xs font-medium">Maximum value</label>
          <Input 
            type="number"
            value={filterValueMax} 
            onChange={(e) => setFilterValueMax(e.target.value)}
            placeholder="Max value"
            className="h-8"
          />
        </div>
      )}

      <div className="flex justify-between pt-2">
      <Button
          variant="outline" 
          size="sm"
          className="border-2 border-foil-silver hover:border-sports-blue rounded-full"
          onClick={onClearFilter}
      >
          Clear
      </Button>
      <Button
          variant="secondary" 
          size="sm"
          className="bg-sports-blue hover:bg-sports-blue-hover text-white rounded-full"
          onClick={() => {
            if (filterType === 'isEmpty') {
              onApplyFilter({ type: filterType, value: null });
            } else if (filterType === 'between') {
              const min = parseFloat(filterValue);
              const max = parseFloat(filterValueMax);
              if (!isNaN(min) && !isNaN(max)) {
                onApplyFilter({ type: filterType, value: [min, max] });
              }
            } else {
              const numValue = parseFloat(filterValue);
              if (!isNaN(numValue)) {
                onApplyFilter({ type: filterType, value: numValue });
              }
            }
          }}
        >
          Apply Filter
      </Button>
      </div>
    </div>
  );
}

function DateFilter({ 
  columnId, 
  currentFilter, 
  onApplyFilter, 
  onClearFilter 
}: { 
  columnId: string;
  currentFilter: ColumnFilter | null;
  onApplyFilter: (filter: ColumnFilter) => void;
  onClearFilter: () => void;
}) {
  const [filterType, setFilterType] = useState<ColumnFilter['type']>(
    currentFilter?.type || 'equals'
  );
  const [date, setDate] = useState<Date | undefined>(
    currentFilter?.value ? new Date(currentFilter.value as string) : undefined
  );
  const [dateMax, setDateMax] = useState<Date | undefined>(
    Array.isArray(currentFilter?.value) && currentFilter.value.length > 1
      ? new Date(currentFilter.value[1] as string)
      : undefined
  );

  return (
    <div className="p-2 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Filter type</label>
        <Select
          value={filterType}
          onValueChange={(value) => setFilterType(value as ColumnFilter['type'])}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">On date</SelectItem>
            <SelectItem value="greaterThan">After date</SelectItem>
            <SelectItem value="lessThan">Before date</SelectItem>
            <SelectItem value="between">Between dates</SelectItem>
            <SelectItem value="isEmpty">Is empty</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterType !== 'isEmpty' && (
        <div className="space-y-1">
          <label className="text-xs font-medium">
            {filterType === 'between' ? 'Start date' : 'Date'}
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-8 border-foil-silver hover:border-sports-blue"
              >
                {date ? (
                  format(date, "MM/dd/yyyy")
                ) : (
                  <span className="text-muted-foreground">Select date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {filterType === 'between' && (
        <div className="space-y-1">
          <label className="text-xs font-medium">End date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal h-8 border-foil-silver hover:border-sports-blue"
              >
                {dateMax ? (
                  format(dateMax, "MM/dd/yyyy")
                ) : (
                  <span className="text-muted-foreground">Select date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateMax}
                onSelect={setDateMax}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex justify-between pt-2">
      <Button
          variant="outline" 
          size="sm"
          className="border-2 border-foil-silver hover:border-sports-blue rounded-full"
          onClick={onClearFilter}
      >
          Clear
      </Button>
      <Button
          variant="secondary" 
          size="sm"
          className="bg-sports-blue hover:bg-sports-blue-hover text-white rounded-full"
          onClick={() => {
            if (filterType === 'isEmpty') {
              onApplyFilter({ type: filterType, value: null });
            } else if (filterType === 'between') {
              if (date && dateMax) {
                onApplyFilter({ 
                  type: filterType, 
                  value: [date.toISOString(), dateMax.toISOString()] 
                });
              }
            } else if (date) {
              onApplyFilter({ type: filterType, value: date.toISOString() });
            }
          }}
        >
          Apply Filter
      </Button>
      </div>
    </div>
  );
}

function SelectFilter({ 
  columnId, 
  options,
  currentFilter, 
  onApplyFilter, 
  onClearFilter 
}: { 
  columnId: string;
  options: string[];
  currentFilter: ColumnFilter | null;
  onApplyFilter: (filter: ColumnFilter) => void;
  onClearFilter: () => void;
}) {
  const [selectedValues, setSelectedValues] = useState<string[]>(
    Array.isArray(currentFilter?.value) 
      ? currentFilter.value.map(v => String(v))
      : currentFilter?.value !== null && currentFilter?.value !== undefined
        ? [String(currentFilter.value)]
        : []
  );

  const toggleOption = (option: string) => {
    setSelectedValues(prev => 
      prev.includes(option)
        ? prev.filter(v => v !== option)
        : [...prev, option]
    );
  };

  return (
    <div className="p-2 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Select values</label>
        <div className="max-h-[200px] overflow-y-auto border rounded-md p-1">
          {options.map((option) => (
            <div key={option} className="flex items-center space-x-2 py-1 px-2 hover:bg-accent rounded-sm">
              <Checkbox
                id={`${columnId}-${option}`}
                checked={selectedValues.includes(option)}
                onCheckedChange={() => toggleOption(option)}
              />
              <label 
                htmlFor={`${columnId}-${option}`}
                className="text-sm flex-grow cursor-pointer"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium">Also match empty values</label>
        <Checkbox
          id={`${columnId}-empty`}
          checked={selectedValues.includes('null')}
          onCheckedChange={() => toggleOption('null')}
        />
      </div>

      <div className="flex justify-between pt-2">
      <Button
          variant="outline" 
          size="sm"
          className="border-2 border-foil-silver hover:border-sports-blue rounded-full"
          onClick={onClearFilter}
      >
          Clear
      </Button>
      <Button
          variant="secondary" 
          size="sm"
          className="bg-sports-blue hover:bg-sports-blue-hover text-white rounded-full"
          onClick={() => {
            if (selectedValues.length === 0) {
              onClearFilter();
            } else {
              onApplyFilter({ 
                type: 'in', 
                value: selectedValues 
              });
            }
          }}
        >
          Apply Filter ({selectedValues.length})
      </Button>
      </div>
    </div>
  );
}

function ColumnFilterPopover({ 
  column, 
  currentFilter,
  uniqueValues,
  onApplyFilter,
  onClearFilter,
  isSorted,
  sortDirection,
  onSort
}: { 
  column: ColumnDef;
  currentFilter: ColumnFilter | null;
  uniqueValues: any[];
  onApplyFilter: (filter: ColumnFilter) => void;
  onClearFilter: () => void;
  isSorted: boolean;
  sortDirection: 'asc' | 'desc';
  onSort: (direction: 'asc' | 'desc') => void;
}) {
  // Determine the type of filter to display based on column id
  const getFilterComponent = () => {
    // Enumerated fields with known values
    if (['grade', 'sport', 'source', 'status'].includes(column.id)) {
      const options = column.id === 'grade' ? GRADE_OPTIONS
        : column.id === 'sport' ? SPORT_OPTIONS
        : column.id === 'source' ? SOURCE_OPTIONS
        : column.id === 'status' ? STATUS_OPTIONS
        : uniqueValues.map(v => String(v)).filter(Boolean);
      
      return (
        <SelectFilter
          columnId={column.id}
          options={options}
          currentFilter={currentFilter}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      );
    }
    
    // Numeric fields
    if (['purchase_price', 'current_value', 'grading_cost', 'taxes', 
         'shipping', 'selling_fees', 'sale_price', 'all_in_cost', 'profit',
         'year', 'days_to_grade', 'days_held', 'roi'].includes(column.id)) {
  return (
        <NumberFilter
          columnId={column.id}
          currentFilter={currentFilter}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      );
    }
    
    // Date fields
    if (['created_at', 'sales_date', 'date_shipped_to_grade', 
         'date_received_from_grade', 'grading_submission_date', 
         'grading_returned_date'].includes(column.id)) {
      return (
        <DateFilter
          columnId={column.id}
          currentFilter={currentFilter}
          onApplyFilter={onApplyFilter}
          onClearFilter={onClearFilter}
        />
      );
    }
    
    // Boolean fields
    if (['is_sold'].includes(column.id)) {
      return (
        <SelectFilter
          columnId={column.id}
          options={['Yes', 'No']}
          currentFilter={currentFilter}
          onApplyFilter={(filter) => {
            // Convert Yes/No to true/false
            if (filter.type === 'in' && Array.isArray(filter.value)) {
              const boolValues = filter.value.map(v => 
                v === 'Yes' ? true : v === 'No' ? false : v === 'null' ? null : v
              );
              onApplyFilter({ ...filter, value: boolValues });
            } else {
              onApplyFilter(filter);
            }
          }}
          onClearFilter={onClearFilter}
        />
      );
    }
    
    // Default to text filter for all other fields
    return (
      <TextFilter
        columnId={column.id}
        currentFilter={currentFilter}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
      />
    );
  };
  
  const getIconColor = () => {
    if (isSorted && currentFilter) return "text-primary font-medium";
    if (isSorted) return "text-blue-500";
    if (currentFilter) return "text-primary";
    return "";
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`h-6 w-6 p-0 relative ${getIconColor()}`}
        >
          <SlidersHorizontal className="h-3 w-3" />
          {(currentFilter || isSorted) && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2 items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <div className="p-2 border-b">
          <h4 className="font-medium text-sm">
            {typeof column.header === 'string' ? column.header : column.id}
          </h4>
          
          <div className="flex mt-2 border rounded-md overflow-hidden">
          <Button
              variant={isSorted && sortDirection === 'asc' ? "default" : "ghost"} 
              size="sm"
              className="flex-1 rounded-none h-7 text-xs" 
              onClick={() => onSort('asc')}
          >
              <ArrowUp className="h-3 w-3 mr-1" />
              <span className="text-xs">A-Z</span>
          </Button>
          <Button
              variant={isSorted && sortDirection === 'desc' ? "default" : "ghost"} 
              size="sm"
              className="flex-1 rounded-none h-7 text-xs border-l" 
              onClick={() => onSort('desc')}
          >
              <ArrowDown className="h-3 w-3 mr-1" />
              <span className="text-xs">Z-A</span>
          </Button>
        </div>
      </div>
        
        <div className="border-b py-1 px-3">
          <h4 className="text-[0.7rem] font-medium text-muted-foreground">FILTER OPTIONS</h4>
        </div>
        
        <div>
          {getFilterComponent()}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Create an image upload component for the thumbnail cell
function ImageUploadCell({
  cardId,
  currentImageUrl,
  onImageUploaded
}: {
  cardId: string;
  currentImageUrl?: string | null;
  onImageUploaded: (imageUrl: string, thumbnailUrl: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Image must be less than 5MB"
      });
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Only image files are allowed"
      });
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('cardId', cardId);
      formData.append('image', file);
      
      // Upload the image using the server action
      const response = await uploadCardImage(formData);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.imageUrl && response.thumbnailUrl) {
        onImageUploaded(response.imageUrl, response.thumbnailUrl);
        
        toast({
          title: "Image uploaded",
          description: "Card image has been updated"
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image. Please try again.');
      
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not upload image. Please try again."
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {currentImageUrl ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-md border">
          <Image
            src={currentImageUrl}
            alt="Card thumbnail"
            fill
            sizes="64px"
            className="object-cover"
          />
          
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-all group">
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 h-8 w-8" 
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="h-16 w-16 flex flex-col gap-1 p-1"
          onClick={triggerFileInput}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span className="text-xs">Upload</span>
            </>
          )}
        </Button>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading}
      />
      
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function MyCardsPage() {
  const { isLoaded, isSignedIn, userId, supabase } = useAuth();
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('card-view-mode');
      return (saved === 'grid' || saved === 'table') ? saved as ('grid' | 'table') : 'table';
    }
    return 'table';
  });
  const [showSummary, setShowSummary] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('card-show-summary') === 'true';
    }
    return true;
  });
  
  // Add state for date picker visibility
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const { toast } = useToast();
  
  // Use the table config hook for managing table state
  const tableConfig = useTableConfig({
    tableId: 'my-cards-table',
    defaultColumns: columns.map(col => col.id),
  });
  
  // Use the values from the hook
  const {
    views,
    currentView,
    createView,
    applyView,
    updateView,
    deleteView,
    renameView,
    resetToDefault,
    columnVisibility, 
    setColumnVisibility,
    columnOrder,
    setColumnOrder,
    sortState,
    setSortState,
    filterState,
    setFilterState,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
  } = tableConfig;
  
  // Derived state
  const sortColumn = sortState.column;
  const sortDirection = sortState.direction;
  const columnFilters = filterState;
  
  // Add state for unique values in each column (for select filters)
  const [uniqueColumnValues, setUniqueColumnValues] = useState<Record<string, any[]>>({});
  
  // Add sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sort columns based on the order - ensure this useMemo is in the same order in every render
  const orderedColumns = useMemo(() => {
    return columnOrder
      .map(id => columns.find(col => col.id === id))
      .filter((col): col is ColumnDef => col !== undefined);
  }, [columnOrder]);

  // Save view preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('card-view-mode', viewMode);
      localStorage.setItem('card-show-summary', showSummary.toString());
    }
  }, [viewMode, showSummary]);

  // Update the handleDragEnd function for column reordering with proper type annotations
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldColumnOrder = [...columnOrder];
      const oldIndex = oldColumnOrder.findIndex(id => id === active.id);
      const newIndex = oldColumnOrder.findIndex(id => id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumnOrder = arrayMove(oldColumnOrder, oldIndex, newIndex);
        setColumnOrder(newColumnOrder);
      }
    }
  }, [columnOrder, setColumnOrder]);

  // Add a function to handle column filtering with proper type annotations
  const handleApplyFilter = useCallback((columnId: string, filter: ColumnFilter | null) => {
    const updatedFilters: TableFilterState = { ...filterState };
    if (filter) {
      updatedFilters[columnId] = filter;
    } else {
      delete updatedFilters[columnId];
    }
    setFilterState(updatedFilters);
  }, [filterState, setFilterState]);
  
  // Add a function to clear a specific column filter with proper type annotations
  const handleClearFilter = useCallback((columnId: string) => {
    const updatedFilters: TableFilterState = { ...filterState };
    delete updatedFilters[columnId];
    setFilterState(updatedFilters);
  }, [filterState, setFilterState]);
  
  // Add a function to clear all filters
  const clearAllFilters = useCallback(() => {
    console.log("Clearing all filters and search query");
    setFilterState({});
    setSearchQuery('');
  }, [setFilterState, setSearchQuery]);

  // Update the toggleColumnVisibility function to use hook with proper type annotations
  const toggleColumnVisibility = useCallback((columnId: string) => {
    const updatedVisibility: TableColumnVisibility = { ...columnVisibility };
    updatedVisibility[columnId] = !columnVisibility[columnId];
    setColumnVisibility(updatedVisibility);
  }, [columnVisibility, setColumnVisibility]);

  // Update the handleSort function to use sortState
  const handleSort = useCallback((columnId: string, direction?: 'asc' | 'desc') => {
    if (sortState.column === columnId && !direction) {
      // Toggle direction if same column and no direction specified
      setSortState({
        column: columnId,
        direction: sortState.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Set new sort column and use specified direction or default to ascending
      setSortState({
        column: columnId,
        direction: direction || 'asc'
      });
    }
  }, [sortState, setSortState]);

  // Extract unique values for select filters
  useEffect(() => {
    if (cards.length > 0) {
      const uniqueValues: Record<string, Set<any>> = {};
      
      // Initialize sets for each column
      columns.forEach(col => {
        uniqueValues[col.id] = new Set();
      });
      
      // Populate sets with unique values from cards
      cards.forEach(card => {
        columns.forEach(col => {
          const value = card[col.id as keyof CardData];
          if (value !== undefined && value !== null) {
            uniqueValues[col.id].add(value);
          }
        });
      });
      
      // Convert sets to arrays and update state
      const uniqueValuesArrays: Record<string, any[]> = {};
      Object.entries(uniqueValues).forEach(([columnId, valueSet]) => {
        uniqueValuesArrays[columnId] = Array.from(valueSet);
      });
      
      setUniqueColumnValues(uniqueValuesArrays);
    }
  }, [cards]);

  // Filter and sort cards based on search query and column filters
  const filteredAndSortedCards = useMemo(() => {
    // First apply search query
    let filtered = cards;
    
    if (searchQuery && searchQuery.trim()) {
      console.log("Filtering by search query:", searchQuery);
      const lowerQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(card => {
        // Search through all text fields
        return Object.entries(card).some(([key, value]) => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }
          if (value !== null && value !== undefined) {
            return String(value).toLowerCase().includes(lowerQuery);
          }
          return false;
        });
      });
    }
    
    // Apply date filters based on purchase date (created_at)
    if (dateFilter !== 'all') {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0); // Start of yesterday
      
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999); // End of yesterday
      
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      last7Days.setHours(0, 0, 0, 0); // Start of 7 days ago
      
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      last30Days.setHours(0, 0, 0, 0); // Start of 30 days ago
      
      const last90Days = new Date();
      last90Days.setDate(last90Days.getDate() - 90);
      last90Days.setHours(0, 0, 0, 0); // Start of 90 days ago
      
      const last6Months = new Date();
      last6Months.setMonth(last6Months.getMonth() - 6);
      last6Months.setHours(0, 0, 0, 0); // Start of 6 months ago
      
      const last12Months = new Date();
      last12Months.setMonth(last12Months.getMonth() - 12);
      last12Months.setHours(0, 0, 0, 0); // Start of 12 months ago
      
      const startOfYear = new Date(today.getFullYear(), 0, 1); // January 1st of current year
      startOfYear.setHours(0, 0, 0, 0);
      
      const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1); // January 1st of last year
      startOfLastYear.setHours(0, 0, 0, 0);
      
      const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31); // December 31st of last year
      endOfLastYear.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(card => {
        const purchaseDate = card.created_at ? new Date(card.created_at) : null;
        if (!purchaseDate) return false;
        
        switch (dateFilter) {
          case 'yesterday':
            return purchaseDate >= yesterday && purchaseDate <= yesterdayEnd;
          case 'last7':
            return purchaseDate >= last7Days && purchaseDate <= today;
          case 'last30':
            return purchaseDate >= last30Days && purchaseDate <= today;
          case 'last90':
            return purchaseDate >= last90Days && purchaseDate <= today;
          case 'last6months':
            return purchaseDate >= last6Months && purchaseDate <= today;
          case 'last12months':
            return purchaseDate >= last12Months && purchaseDate <= today;
          case 'ytd':
            return purchaseDate >= startOfYear && purchaseDate <= today;
          case 'lastyear':
            return purchaseDate >= startOfLastYear && purchaseDate <= endOfLastYear;
          case 'custom':
            const fromDate = customDateRange.from ? new Date(customDateRange.from) : null;
            let toDate = customDateRange.to ? new Date(customDateRange.to) : null;
            
            if (fromDate) {
              fromDate.setHours(0, 0, 0, 0); // Start of from date
              if (toDate) {
                toDate.setHours(23, 59, 59, 999); // End of to date
                return purchaseDate >= fromDate && purchaseDate <= toDate;
              }
              // If only from date is set, filter cards from that date onwards
              return purchaseDate >= fromDate;
            }
            return true; // If no dates selected in custom range, don't filter
          default:
            return true;
        }
      });
    }
    
    // Then apply column filters
    if (Object.keys(columnFilters).length > 0) {
      filtered = filtered.filter(card => {
        // Card passes if it matches ALL column filters
        return Object.entries(columnFilters).every(([columnId, filter]) => {
          if (!filter) return true;
          
          const value = card[columnId as keyof CardData];
          
          switch (filter.type) {
            case 'equals':
              return value === filter.value;
            case 'contains':
              return typeof value === 'string' && 
                value.toLowerCase().includes(String(filter.value).toLowerCase());
            case 'startsWith':
              return typeof value === 'string' && 
                value.toLowerCase().startsWith(String(filter.value).toLowerCase());
            case 'endsWith':
              return typeof value === 'string' && 
                value.toLowerCase().endsWith(String(filter.value).toLowerCase());
            case 'greaterThan':
              return typeof value === 'number' && value > Number(filter.value);
            case 'lessThan':
              return typeof value === 'number' && value < Number(filter.value);
            case 'between':
              if (Array.isArray(filter.value) && filter.value.length === 2) {
                if (typeof value === 'number') {
                  return value >= Number(filter.value[0]) && value <= Number(filter.value[1]);
                }
                // Handle date comparisons
                if (typeof value === 'string') {
                  try {
                    const dateValue = new Date(value);
                    const startDate = new Date(filter.value[0] as string);
                    const endDate = new Date(filter.value[1] as string);
                    return dateValue >= startDate && dateValue <= endDate;
                  } catch (e) {
                    return false;
                  }
                }
              }
              return false;
            case 'in':
              if (Array.isArray(filter.value)) {
                // Special handling for null values
                if (filter.value.includes('null') && (value === null || value === undefined)) {
                  return true;
                }
                
                // Handle boolean conversion for is_sold
                if (columnId === 'is_sold') {
                  if (value === true && filter.value.includes(true)) return true;
                  if (value === false && filter.value.includes(false)) return true;
                  return false;
                }
                
                return filter.value.includes(value as FilterValue);
              }
              return false;
            case 'isEmpty':
              return value === null || value === undefined || value === '';
            default:
              return true;
          }
        });
      });
    }
    
    // Finally sort based on sort column and direction
    if (sortColumn) {
      return [...filtered].sort((a, b) => {
        const aValue = a[sortColumn as keyof CardData];
        const bValue = b[sortColumn as keyof CardData];
        
        // Handle undefined or null values
        if (aValue === undefined || aValue === null) return sortDirection === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortDirection === 'asc' ? 1 : -1;
        
        // Compare based on value type
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // String comparison
        const aString = String(aValue);
        const bString = String(bValue);
        return sortDirection === 'asc' 
          ? aString.localeCompare(bString) 
          : bString.localeCompare(aString);
      });
    }
    
    return filtered;
  }, [cards, searchQuery, columnFilters, sortColumn, sortDirection, dateFilter, customDateRange]);

  // First update the loadCards function to use state callbacks for safer state updates
  const loadCards = useCallback(async () => {
    if (!userId) return;
    
    try {
      logDebug('Loading cards...');
      logDebug(`Using Clerk user ID: ${userId}`);
      // Set loading state at the beginning
      setLoading(true);
      setError(null);
      
      // Use server action to fetch cards
      const { data, error } = await getCardsByUserId(userId);
      
      if (error) {
        console.error('Error loading cards:', error);
        setError(`Failed to load cards: ${error}`);
        setLoading(false);
        return;
      }
      
      if (data) {
        logDebug(`Loaded ${data.length} cards`);
        // Update the cards state
        setCards(data);
        // Explicitly set loading to false after data is loaded
        setLoading(false);
      } else {
        setCards([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error in loadCards:', err);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
    }
  }, [userId]);

  // Next update the useEffect to simplify dependencies and be more explicit
  useEffect(() => {
    // Only run this effect when necessary components are available
    if (isLoaded && isSignedIn && userId) {
      // Load cards
      loadCards();
      
      // Add a safety timeout in case loadCards gets stuck
      const timeout = setTimeout(() => {
        setLoading((current) => {
          if (current) {
            console.warn("Loading timeout reached, forcing state update");
            setError("Loading cards timed out. Your Supabase connection might be inactive.");
            return false;
          }
          return current;
        });
      }, 10000); // Increase timeout to 10 seconds
      
      return () => clearTimeout(timeout);
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userId, loadCards]);

  if (!isLoaded || loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="text-center py-8">
        <p>You need to be signed in to view your cards.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Add explicit message for empty cards array
  if (cards.length === 0) {
  return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="bg-white dark:bg-neutral-dark rounded-xl p-8 border-2 border-foil-silver text-center">
          <h2 className="text-2xl font-sports text-sports-blue mb-4">No Cards Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have any cards in your collection yet. Add your first card to get started.
          </p>
          <Button 
            asChild
            variant="default"
            className="bg-sports-gradient hover:opacity-90 px-6"
          >
        <Link href="/my-cards/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Card
            </Link>
          </Button>
              </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full px-4 py-6 space-y-6">
        {/* Header with action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-neutral-dark rounded-xl p-4 border-2 border-foil-silver shadow-sm">
          <div className="flex-1">
            <h1 className="text-2xl font-sports text-sports-blue mb-1">My Card Collection</h1>
            <p className="text-neutral-gray text-sm">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'} in your collection
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View toggle buttons */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 mr-2 border border-foil-silver">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-sports-blue font-medium' : 'text-neutral-gray hover:text-sports-blue'} rounded-full`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                <span>Cards</span>
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-sports-blue font-medium' : 'text-neutral-gray hover:text-sports-blue'} rounded-full`}
                onClick={() => setViewMode('table')}
              >
                <Table className="h-4 w-4 mr-2" />
                <span>Table</span>
              </Button>
            </div>
            
            {/* Summary toggle */}
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-2 border-2 ${showSummary ? 'border-sports-blue text-sports-blue' : 'border-foil-silver hover:border-sports-blue'} rounded-full shadow-sm hover:shadow-button-hover`}
              onClick={() => setShowSummary(!showSummary)}
            >
              <BarChart3 className="h-4 w-4" />
              <span>{showSummary ? 'Hide Summary' : 'Show Summary'}</span>
            </Button>
            
            {/* Refresh button (circular) */}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-2 border-foil-silver hover:border-sports-blue rounded-full shadow-sm hover:shadow-button-hover flex items-center justify-center"
              onClick={() => loadCards()}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-sports-blue hover:animate-spin transition-all" />
            </Button>
            
            <Button
              asChild
              variant="default"
              size="sm"
              className="bg-sports-gradient hover:opacity-90 rounded-full shadow-button hover:shadow-button-hover"
            >
              <Link href="/my-cards/new">
                <Plus className="h-4 w-4 mr-1" />
                <span>Add Card</span>
              </Link>
            </Button>
          </div>
      </div>
      
        {/* Search and filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-neutral-dark rounded-xl p-4 border-2 border-foil-silver shadow-sm">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => {
                console.log("Search query changed:", e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="pl-8"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={dateFilter}
              onValueChange={(value) => {
                setDateFilter(value);
                if (value === "custom") {
                  setShowCustomDatePicker(true);
                } else {
                  setShowCustomDatePicker(false);
                }
              }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Filter by purchase date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 Days</SelectItem>
                <SelectItem value="last30">Last 30 Days</SelectItem>
                <SelectItem value="last90">Last 90 Days</SelectItem>
                <SelectItem value="last6months">Last 6 Months</SelectItem>
                <SelectItem value="last12months">Last 12 Months</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="lastyear">Last Year</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            
            {showCustomDatePicker && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-9 w-auto justify-start text-left font-normal"
                  >
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "MM/dd/yyyy")} - {format(customDateRange.to, "MM/dd/yyyy")}
                        </>
                      ) : (
                        format(customDateRange.from, "MM/dd/yyyy")
                      )
                    ) : (
                      <span>Pick date range</span>
                    )}
                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to,
                    }}
                    onSelect={(range) => {
                      setCustomDateRange(range ? 
                        { from: range.from, to: range.to || range.from } : 
                        { from: undefined, to: undefined });
                    }}
                    initialFocus
                    className="rounded-md border shadow-md p-3"
                    classNames={{
                      head_row: "flex w-full justify-between",
                      head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        
        {/* Summary Component */}
        {showSummary && (
          <TableSummary 
            data={filteredAndSortedCards} 
            totalCardCount={cards.length}
            onExport={() => {
              // Create CSV content from visible/filtered cards
              const headers = orderedColumns
                .filter(column => columnVisibility[column.id])
                .map(column => typeof column.header === 'string' ? column.header : column.id);
              
              const rows = filteredAndSortedCards.map(cardData => 
                orderedColumns
                  .filter(column => columnVisibility[column.id])
                  .map(column => {
                    const value = cardData[column.id as keyof CardData];
                    if (value === null || value === undefined) return '';
                    if (typeof value === 'object') return JSON.stringify(value);
                    return String(value);
                  })
              );
              
              const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
              ].join('\n');
              
              // Create a blob and download link
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              
              // Save export timestamp in filename and store preferences
              const timestamp = new Date().toISOString().split('T')[0];
              link.setAttribute('download', `sports-cards-export-${timestamp}.csv`);
              
              // Save current view preferences in localStorage for later exports
              if (typeof window !== 'undefined') {
                localStorage.setItem('card-last-export-date', timestamp);
                localStorage.setItem('card-export-columns', JSON.stringify(
                  orderedColumns
                    .filter(column => columnVisibility[column.id])
                    .map((column: ColumnDef) => column.id)
                ));
              }
              
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              toast({
                title: "Export Complete",
                description: `Exported ${filteredAndSortedCards.length} cards to CSV`,
              });
            }} 
          />
        )}
        
        {/* Force grid view for now to avoid table issues */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-neutral-dark rounded-xl p-3 border-2 border-foil-silver shadow-sm overflow-hidden">
            <div className="space-y-3">
              {/* Table controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-2 border-foil-silver hover:border-sports-blue rounded-full shadow-sm hover:shadow-button-hover flex items-center justify-center"
                    onClick={() => {
                      // Reset all filters and column order
                      resetToDefault();
                      toast({
                        title: "Filters Reset",
                        description: "All filters and columns have been reset to default."
                      });
                    }}
                    title="Reset filters"
                  >
                    <X className="h-4 w-4 text-sports-blue" />
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-2 border-foil-silver hover:border-sports-blue rounded-full shadow-sm hover:shadow-button-hover"
                      >
                        <Filter className="h-4 w-4 mr-1 text-sports-blue" />
                        <span className="text-sports-blue">Columns</span>
                        {Object.keys(columnFilters).length > 0 && (
                          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-sports-blue text-[0.625rem] font-medium text-white">
                            {Object.keys(columnFilters).length}
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <div className="p-2">
                        <p className="text-sm font-medium mb-2">Column Settings</p>
                        <div className="max-h-[300px] overflow-y-auto pr-1">
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                          >
                            <SortableContext
                              items={columnOrder}
                              strategy={verticalListSortingStrategy}
                            >
                              {columnOrder.map((columnId) => {
                                const column = columns.find(c => c.id === columnId);
                                if (!column) return null;
                                return (
                                  <SortableColumnItem 
                                    key={columnId} 
                                    id={columnId} 
                                    column={column} 
                                    isVisible={columnVisibility[columnId]}
                                    onToggleVisibility={() => toggleColumnVisibility(columnId)}
                                  />
                                );
                              })}
                            </SortableContext>
                          </DndContext>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  <SavedViews
                    views={views}
                    currentView={currentView}
                    onCreateView={createView}
                    onApplyView={applyView}
                    onUpdateView={updateView}
                    onDeleteView={deleteView}
                    onRenameView={renameView}
                  />
                </div>
              </div>
              
              {/* Active Filters Section */}
              {Object.keys(columnFilters).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <div className="text-xs text-muted-foreground mr-1 pt-1">Active Filters:</div>
                  {Object.entries(columnFilters).map(([columnId, filter]) => {
                    // Find the column name
                    const column = columns.find(c => c.id === columnId);
                    const columnName = column && typeof column.header === 'string' 
                      ? column.header 
                      : columnId;
                      
                    // Format the filter value for display
                    let filterDisplay = '';
                    if (filter) {
                      switch (filter.type) {
                        case 'equals':
                          filterDisplay = `= ${filter.value}`;
                          break;
                        case 'contains':
                          filterDisplay = `contains "${filter.value}"`;
                          break;
                        case 'startsWith':
                          filterDisplay = `starts with "${filter.value}"`;
                          break;
                        case 'endsWith':
                          filterDisplay = `ends with "${filter.value}"`;
                          break;
                        case 'greaterThan':
                          filterDisplay = `> ${filter.value}`;
                          break;
                        case 'lessThan':
                          filterDisplay = `< ${filter.value}`;
                          break;
                        case 'between':
                          if (Array.isArray(filter.value) && filter.value.length === 2) {
                            filterDisplay = `${filter.value[0]} - ${filter.value[1]}`;
                          }
                          break;
                        case 'in':
                          if (Array.isArray(filter.value)) {
                            const hasNull = filter.value.includes('null');
                            const values = filter.value
                              .filter((v: any) => v !== 'null')
                              .join(', ');
                            filterDisplay = hasNull 
                              ? `is ${values || 'empty'}` 
                              : `is ${values}`;
                          }
                          break;
                        case 'isEmpty':
                          filterDisplay = 'is empty';
                          break;
                      }
                    }
                        
                    return (
                      <div 
                        key={columnId}
                        className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md"
                      >
                        <span className="font-medium">{columnName}:</span>
                        <span>{filterDisplay}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:text-sports-red"
                          onClick={() => handleClearFilter(columnId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs border border-foil-silver hover:border-sports-blue hover:text-sports-blue rounded-full"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </Button>
                </div>
              )}

              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <div className="rounded-md border overflow-hidden">
                    <UITable className="w-full text-sm border-collapse table-fixed">
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800">
                          {orderedColumns
                            .filter(column => columnVisibility[column.id])
                            .map((column) => (
                              <TableHead 
                                key={column.id} 
                                className="whitespace-normal text-center p-2 font-medium text-xs"
                                style={{ 
                                  height: '65px',
                                  width: column.id === 'thumbnail' ? '50px' : 
                                         (column.id === 'name' || column.id === 'player') ? '150px' : 
                                         (column.id === 'purchase_price' || column.id === 'current_value' || 
                                         column.id === 'grading_cost' || column.id === 'all_in_cost' || 
                                         column.id === 'sale_price') ? '90px' :
                                         (column.id === 'created_at' || column.id === 'sales_date' || 
                                         column.id === 'date_shipped_to_grade' || column.id === 'date_received_from_grade') ? '80px' :
                                         (column.id === 'manufacturer' || column.id === 'status') ? '85px' :
                                         (column.id === 'days_to_grade' || column.id === 'days_held' || 
                                         column.id === 'year' || column.id === 'sport' || 
                                         column.id === 'source' || column.id === 'grade') ? '70px' :
                                         '100px',
                                  verticalAlign: 'middle'
                                }}
                              >
                                {column.id === 'thumbnail' ? (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-center text-sports-blue text-[0.8rem] font-medium leading-tight">
                                      {typeof column.header === 'string' ? column.header : column.id}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center h-full justify-between py-1">
                                    <ColumnFilterPopover
                                      column={column}
                                      currentFilter={columnFilters[column.id]}
                                      uniqueValues={uniqueColumnValues[column.id] || []}
                                      onApplyFilter={(filter) => handleApplyFilter(column.id, filter)}
                                      onClearFilter={() => handleClearFilter(column.id)}
                                      isSorted={column.id === sortColumn}
                                      sortDirection={sortDirection}
                                      onSort={(direction) => handleSort(column.id, direction)}
                                    />
                                    
                                    <span className="w-full text-center break-words text-sports-blue text-[0.8rem] font-medium leading-tight flex-1 flex items-center justify-center px-1">
                                      {typeof column.header === 'string' ? column.header : column.id}
                                    </span>
                                  </div>
                                )}
                              </TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody className="text-sm">
                        {filteredAndSortedCards.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={orderedColumns.filter(col => columnVisibility[col.id]).length} className="h-16 text-center">
                              No results found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAndSortedCards.map((card, index) => (
                            <TableRow 
                              key={card.id || `card-${index}`} 
                              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b last:border-b-0"
                              style={{ minHeight: '50px' }}
                            >
                              {orderedColumns
                                .filter(column => columnVisibility[column.id])
                                .map((column) => {
                                  const columnId = column.id as string;
                                  
                                  // Special case for thumbnail column
                                  if (columnId === 'thumbnail') {
                                    return (
                                      <TableCell key={`${card.id}-${column.id}`} className="p-2 text-center">
                                        <ThumbnailImage 
                                          cardId={card.id}
                                          imageUrl={card.thumbnail_url || card.image_url}
                                        />
                                      </TableCell>
                                    );
                                  }
                                  
                                  // Use the EditableCell component for true inline editing
                                  return (
                                    <TableCell 
                                      key={`${card.id}-${column.id}`} 
                                      className="p-2 text-center"
                                      style={{ 
                                        maxWidth: (columnId === 'name' || columnId === 'player') ? '150px' : '100px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}
                                    >
                                      <EditableCell
                                        value={card[columnId as keyof CardData]}
                                        row={{ index }}
                                        column={{ id: columnId }}
                                        uniqueValues={uniqueColumnValues}
                                        updateData={async (rowIndex: number, columnId: string, value: any) => {
                                          try {
                                            // Create FormData to pass to server action
                                            const formData = new FormData();
                                            formData.append('cardId', card.id);
                                            formData.append('field', columnId);
                                            formData.append('value', value !== null && value !== undefined ? String(value) : '');
                                            
                                            // Update in database using server action
                                            const result = await updateCardField(formData);
                                            
                                            if (result.error) {
                                              throw new Error(result.error);
                                            }
                                            
                                            // Update local state
                                            setCards(cards.map((c, i) => 
                                              i === rowIndex 
                                                ? { ...c, [columnId]: value }
                                                : c
                                            ));
                                            
                                            toast({
                                              description: "Card updated successfully",
                                            });
                                          } catch (error) {
                                            console.error('Error updating card:', error);
                                            toast({
                                              variant: "destructive",
                                              title: "Error updating card",
                                              description: "The update could not be saved",
                                            });
                                          }
                                        }}
                                      />
                                    </TableCell>
                                  );
                                })}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </UITable>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {cards.map((card) => (
              <Card key={card.id} className="overflow-hidden border-2 border-foil-silver hover:border-sports-blue hover:shadow-card-hover transition-all duration-200">
                <div className="p-5 space-y-3">
                  <div className="flex justify-between">
                    <h3 className="font-sports text-lg text-sports-blue truncate">{card.name}</h3>
                    <div className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800">
                      {card.grade || 'Ungraded'}
                    </div>
                  </div>
                  
                  {card.player && (
                    <p className="text-neutral-dark dark:text-neutral-gray text-sm">
                      Player: <span className="font-medium">{card.player}</span>
                    </p>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-gray">
                      {card.year && card.manufacturer 
                        ? `${card.year} ${card.manufacturer}`
                        : card.year 
                          ? `${card.year}`
                          : card.manufacturer 
                            ? card.manufacturer
                            : 'Unknown year/brand'}
                    </span>
                    <span className="text-neutral-gray">
                      {card.sport || 'No sport'}
                    </span>
                  </div>
                  
                  <div className="pt-2 flex justify-between border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="text-xs text-neutral-gray">Purchase Price</div>
                      <div className="font-medium">{card.purchase_price ? formatCurrency(card.purchase_price) : 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-gray">Current Value</div>
                      <div className="font-medium text-green-600">
                        {card.current_value ? formatCurrency(card.current_value) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-neutral-gray">Status</div>
                      <div className="font-medium">{card.status || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      )}
    </div>
    </TooltipProvider>
  );
} 