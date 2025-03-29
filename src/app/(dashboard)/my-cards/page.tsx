'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Grid, List, Search, ChevronDown, ChevronUp, ChevronsUpDown, Check, X, Pencil, ImageIcon } from 'lucide-react';
import { Database } from '@/lib/supabase/types';
import { SportType, CardStatus, GradingCompany, CardGrade, PurchaseSource } from '@/lib/supabase/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from 'next/image';
import { GradeFilter } from '@/components/cards/grade-filter';
import { ColumnVisibility } from '@/components/cards/column-visibility';
import { cn } from '@/lib/utils';
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/auth-context';
import type { SupabaseClient } from '@supabase/supabase-js';

type CardItem = Database['public']['Tables']['cards']['Row'];
type ViewMode = 'grid' | 'table';

type SortConfig = {
  column: keyof CardItem | null;
  direction: 'asc' | 'desc';
};

type ColumnKey =
  | 'image_url'
  | 'name'
  | 'player'
  | 'sport'
  | 'status'
  | 'grading_company'
  | 'grade'
  | 'purchase_price'
  | 'fees'
  | 'sales_price'
  | 'net_profit'
  | 'roi'
  | 'source'
  | 'purchase_link';

interface TableColumn {
  key: ColumnKey;
  label: string;
  sortable?: boolean;
}

const GRADE_OPTIONS: CardGrade[] = [
  '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5',
  '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'
];

const GRADING_COMPANIES: GradingCompany[] = ['PSA', 'BGS', 'SGC', 'HGA', 'CSG'];

interface EditingCard extends CardItem {
  isEditing?: boolean;
}

export default function MyCardsPage() {
  const { isSignedIn } = useUser();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<unknown>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<{
    search: string;
    sport: string;
    selectedGrades: CardGrade[];
    status: string;
    gradingCompany: string;
  }>({
    search: "",
    sport: "all",
    selectedGrades: [],
    status: "all",
    gradingCompany: "all",
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: 'asc'
  });
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>([
    'image_url',
    'name',
    'player',
    'sport',
    'status',
    'grading_company',
    'grade',
    'purchase_price',
    'fees',
    'sales_price',
    'net_profit',
    'roi',
    'source',
    'purchase_link'
  ]);
  const [editingCards, setEditingCards] = useState<{ [key: string]: EditingCard }>({});
  const { isSyncedWithDatabase, syncUser, supabaseUserId } = useAuth();

  const columns: TableColumn[] = [
    { key: 'image_url', label: 'Image', sortable: false },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'player', label: 'Player', sortable: true },
    { key: 'sport', label: 'Sport', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'grading_company', label: 'Grading Co.', sortable: true },
    { key: 'grade', label: 'Grade', sortable: true },
    { key: 'purchase_price', label: 'Purchase Price', sortable: true },
    { key: 'fees', label: 'Fees', sortable: true },
    { key: 'sales_price', label: 'Sales Price', sortable: true },
    { key: 'net_profit', label: 'Net Profit', sortable: true },
    { key: 'roi', label: 'ROI', sortable: true },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'purchase_link', label: 'Purchase Link', sortable: false }
  ];

  const loadCards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting card loading process');

      // Make sure user is synced first
      if (!isSyncedWithDatabase) {
        const syncSuccess = await syncUser();
        if (!syncSuccess) {
          throw new Error('Failed to sync user account');
        }
      }

      if (!supabaseUserId) {
        throw new Error('User ID is not available');
      }

      // Import the singleton client
      const { createClient } = await import('@/lib/supabase/client-singleton');
      
      // Get the token for authentication
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get authentication token: ${tokenResponse.status}`);
      }
      
      const { token } = await tokenResponse.json();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Initialize Supabase client with auth headers
      const supabase = createClient({
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      // Add null check
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      // Fetch cards with the correct Supabase UUID
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('owner_id', supabaseUserId);
      
      console.log('Cards query result:', {
        count: cardsData?.length || 0,
        userId: supabaseUserId,
        error: cardsError ? cardsError.message : null
      });
      
      if (cardsError) {
        console.error('Error loading cards:', cardsError);
        setError(`Failed to load cards: ${cardsError.message}`);
        setDebugInfo({
          cardsError,
          userId: supabaseUserId
        });
        return;
      }
      
      setCards(cardsData || []);
      setFilteredCards(cardsData || []);
      setError(null);
    } catch (err: unknown) {
      console.error('Unexpected error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setDebugInfo(err);
    } finally {
      setIsLoading(false);
    }
  }, [isSyncedWithDatabase, supabaseUserId, syncUser]);

  useEffect(() => {
    if (isSignedIn) {
      loadCards();
    }
  }, [isSignedIn, isSyncedWithDatabase, loadCards]);

  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | CardGrade[]
  ) => {
    const newFilters = {
      ...filters,
      [key]: value
    };
    setFilters(newFilters);
    applyFilters(cards, newFilters);
  };

  const applyFilters = useCallback((cards: CardItem[], currentFilters = filters) => {
    let filtered = [...cards];

    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      filtered = filtered.filter(card => 
        card.name.toLowerCase().includes(searchTerm)
      );
    }

    if (currentFilters.sport && currentFilters.sport !== 'all') {
      filtered = filtered.filter(card => card.sport === currentFilters.sport);
    }

    if (currentFilters.status && currentFilters.status !== 'all') {
      filtered = filtered.filter(card => card.status === currentFilters.status);
    }

    if (currentFilters.selectedGrades.length > 0) {
      filtered = filtered.filter(card => 
        card.grade && currentFilters.selectedGrades.includes(card.grade)
      );
    }

    if (currentFilters.gradingCompany && currentFilters.gradingCompany !== 'all') {
      filtered = filtered.filter(card => card.grading_company === currentFilters.gradingCompany);
    }

    filtered = sortData(filtered, sortConfig);
    setFilteredCards(filtered);
  }, [filters, sortConfig]);

  // Add sorting function
  const sortData = (data: CardItem[], config: SortConfig) => {
    if (!config.column) return data;

    return [...data].sort((a, b) => {
      if (config.column === null) return 0;
      
      const aValue = a[config.column];
      const bValue = b[config.column];

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return config.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Handle string fields
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return config.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Add sort handler
  const handleSort = (key: keyof CardItem) => {
    const sortableColumns: (keyof CardItem)[] = [
      'name',
      'sport',
      'status',
      'grade',
      'grading_company',
      'purchase_price',
      'fees',
      'sales_price'
    ];

    if (!sortableColumns.includes(key)) return;

    setSortConfig(current => {
      const newConfig: SortConfig = {
        column: key,
        direction: current.column === key && current.direction === 'asc' ? 'desc' : 'asc'
      };

      const newFilteredCards = sortData(filteredCards, newConfig);
      setFilteredCards(newFilteredCards);
      return newConfig;
    });
  };

  // Add sort indicator component
  const SortIndicator = ({ column }: { column: keyof CardItem }) => {
    if (sortConfig.column !== column) {
      return <ChevronsUpDown className="ml-2 h-3 w-3 text-muted-foreground/50" />;
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="ml-2 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-2 h-3 w-3" />
    );
  };

  useEffect(() => {
    if (cards.length > 0) {
      applyFilters(cards);
    }
  }, [cards, applyFilters]);

  const startEditing = (card: CardItem) => {
    setEditingCards(prev => ({
      ...prev,
      [card.id]: { ...card, isEditing: true }
    }));
  };

  const cancelEditing = (cardId: string) => {
    setEditingCards(prev => {
      const newState = { ...prev };
      delete newState[cardId];
      return newState;
    });
  };

  const handleEditChange = (cardId: string, field: keyof CardItem, value: unknown) => {
    setEditingCards(prev => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        [field]: value
      }
    }));
  };

  const saveChanges = async (cardId: string) => {
    try {
      const editedCard = editingCards[cardId];
      if (!editedCard) return;
      
      // Clone the card and remove the isEditing flag
      const { isEditing: _isEditing, ...cardUpdate } = editedCard;

      // Import the singleton client
      const { createClient } = await import('@/lib/supabase/client-singleton');
      
      // Get the token for authentication
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        throw new Error(`Failed to get authentication token: ${tokenResponse.status}`);
      }
      
      const { token } = await tokenResponse.json();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      // Initialize Supabase client with auth headers
      const supabase = createClient({
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      // Add null check
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      const { error } = await supabase
        .from('cards')
        .update(cardUpdate)
        .eq('id', cardId);
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to save changes: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Card updated successfully",
      });
      
      // Update local state
      const updatedCard = { ...cardUpdate, id: cardId };
      setCards(prevCards => 
        prevCards.map(card => card.id === cardId ? updatedCard as CardItem : card)
      );
      
      // Remove from editing state
      cancelEditing(cardId);
    } catch (err) {
      console.error('Error saving changes:', err);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderPurchaseLink = (link: string | null) => {
    if (!link) {
      return 'N/A';
    }
    return (
      <a 
        href={link} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-500 hover:text-blue-700 underline"
      >
        View
      </a>
    );
  };

  // Add a renderCellContent function to handle different column types
  const renderCellContent = (card: CardItem, columnKey: ColumnKey): React.ReactNode => {
    const value = card[columnKey as keyof CardItem];
    
    switch (columnKey) {
      case 'purchase_link':
        return renderPurchaseLink(card.purchase_link);
      case 'purchase_price':
      case 'sales_price':
      case 'fees':
        return value != null ? `$${Number(value).toFixed(2)}` : 'N/A';
      case 'net_profit':
        if (card.sales_price != null && card.purchase_price != null) {
          const profit = card.sales_price - card.purchase_price - (card.fees || 0);
          return `$${profit.toFixed(2)}`;
        }
        return 'N/A';
      case 'roi':
        if (card.sales_price != null && card.purchase_price != null && card.purchase_price > 0) {
          const profit = card.sales_price - card.purchase_price - (card.fees || 0);
          const roi = (profit / card.purchase_price) * 100;
          return `${roi.toFixed(2)}%`;
        }
        return 'N/A';
      case 'image_url':
        return value ? 'Image' : 'No Image';
      default:
        return value?.toString() || 'N/A';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()} className="mr-2">
            Refresh Page
          </Button>
          <Button variant="outline" onClick={() => loadCards()}>
            Retry
          </Button>
        </div>
        
        {!!debugInfo && (
          <Card className="overflow-auto max-h-96">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs">{typeof debugInfo === 'string' 
                ? debugInfo 
                : JSON.stringify(debugInfo, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>
            Please sign in to view your cards.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const renderFilters = () => (
    <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cards..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-8"
        />
      </div>

      <Select
        value={filters.sport}
        onValueChange={(value) => handleFilterChange('sport', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select sport" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sports</SelectItem>
          {Object.values(SportType).map((sport) => (
            <SelectItem key={sport} value={sport}>
              {sport}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <GradeFilter
        selectedGrades={filters.selectedGrades}
        onGradesChange={(grades) => handleFilterChange('selectedGrades', grades)}
        grades={GRADE_OPTIONS}
      />

      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.values(CardStatus).map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.gradingCompany}
        onValueChange={(value) => handleFilterChange('gradingCompany', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select grading company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Companies</SelectItem>
          {GRADING_COMPANIES.map((company) => (
            <SelectItem key={company} value={company}>
              {company}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderTableView = () => (
    <div className="rounded-md border overflow-hidden">
      <div className="flex justify-end p-2 bg-white sticky top-0 z-10">
        <ColumnVisibility
          columns={columns}
          visibleColumns={visibleColumns}
          onVisibilityChange={(newColumns) => setVisibleColumns(newColumns as ColumnKey[])}
          onOrderChange={(newOrder) => setVisibleColumns(newOrder as ColumnKey[])}
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((columnKey) => {
                const column = columns.find(col => col.key === columnKey);
                if (!column) return null;

                const commonClasses = cn(
                  "whitespace-nowrap",
                  column.key === 'name' && "min-w-[200px]",
                  column.key === 'image_url' && "min-w-[80px]",
                  column.key !== 'image_url' && "cursor-pointer hover:bg-muted/50",
                  ['purchase_price', 'fees', 'sales_price', 'net_profit', 'roi'].includes(column.key) && "text-right min-w-[100px]",
                  column.key === 'purchase_link' && "text-center min-w-[100px]"
                );

                return (
                  <TableHead
                    key={column.key}
                    className={commonClasses}
                    onClick={() => column.sortable ? handleSort(column.key as keyof CardItem) : undefined}
                  >
                    <div className={cn(
                      "flex items-center",
                      ['purchase_price', 'fees', 'sales_price', 'net_profit', 'roi'].includes(column.key) && "justify-end",
                      column.key === 'purchase_link' && "justify-center"
                    )}>
                      {column.label}
                      {column.sortable && <SortIndicator column={column.key as keyof CardItem} />}
                    </div>
                  </TableHead>
                );
              })}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCards.map((card) => (
              <TableRow key={card.id} className="group">
                {visibleColumns.map((columnKey) => {
                  const column = columns.find(col => col.key === columnKey);
                  if (!column) return null;

                  return (
                    <TableCell key={column.key} className="p-2">
                      {renderCellContent(card, columnKey)}
                    </TableCell>
                  );
                })}
                <TableCell className="p-2">
                  {editingCards[card.id]?.isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => saveChanges(card.id)}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => cancelEditing(card.id)}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredCards.map((card) => (
        <Card key={card.id} className="flex flex-col h-full">
          <div className="relative pt-[75%] overflow-hidden">
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={card.name}
                fill
                className="object-contain"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{card.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sport:</dt>
                <dd>{card.sport}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status:</dt>
                <dd>{card.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Grade:</dt>
                <dd>{card.grade || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Purchase Price:</dt>
                <dd>{card.purchase_price != null ? `$${card.purchase_price.toFixed(2)}` : 'N/A'}</dd>
              </div>
              {card.sales_price && card.purchase_price != null && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Sales Price:</dt>
                    <dd>${card.sales_price.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between font-medium">
                    <dt className="text-muted-foreground">Profit:</dt>
                    <dd className={card.sales_price - card.purchase_price - (card.fees || 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${(card.sales_price - card.purchase_price - (card.fees || 0)).toFixed(2)}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">My Cards</h1>
        <div className="flex gap-4">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild>
            <a href="/card-discovery">Add Cards</a>
          </Button>
        </div>
      </div>

      {renderFilters()}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredCards.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No cards found</AlertTitle>
          <AlertDescription>
            {cards.length === 0 ? (
              <>
                You haven&apos;t added any cards to your collection yet.
                <div className="mt-2">
                  <Button asChild size="sm" variant="outline">
                    <a href="/card-discovery">Discover Cards</a>
                  </Button>
                </div>
              </>
            ) : (
              'No cards match your current filters.'
            )}
          </AlertDescription>
        </Alert>
      ) : viewMode === 'table' ? (
        renderTableView()
      ) : (
        renderGridView()
      )}
    </div>
  );
} 