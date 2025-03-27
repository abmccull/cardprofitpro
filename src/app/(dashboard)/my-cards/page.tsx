'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Grid, List, Search, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon, ChevronDown, ChevronUp, ChevronsUpDown, Check, X, Pencil } from 'lucide-react';
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
import { ColumnVisibility, type Column } from '@/components/cards/column-visibility';
import { cn } from '@/lib/utils';
import { createClientSideClient } from "@/lib/supabase/client-side";
import { toast } from "@/components/ui/use-toast";

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
  const { user, isLoaded, isSignedIn } = useUser();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
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
  const supabase = createClientSideClient();

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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadCards();
    }
  }, [isLoaded, isSignedIn]);

  const syncUser = async () => {
    try {
      console.log("🔄 Starting user sync");
      
      if (!user?.id) {
        throw new Error("No authenticated user");
      }
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sync'
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      let rawResponseText;
      try {
        rawResponseText = await response.text();
      } catch (e) {
        console.error("Failed to get response text:", e);
        throw new Error("Failed to read API response");
      }
      
      let userData;
      try {
        userData = JSON.parse(rawResponseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid JSON response from API");
      }
      
      console.log("✅ User sync successful:", userData);
      return userData.user;
    } catch (error) {
      console.error('❌ Error in syncUser:', error);
      throw error;
    }
  };

  const loadCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting card loading process');

      // First sync the user to get the correct Supabase UUID
      const syncResponse = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerkId: user?.id })
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync user account');
      }

      const syncData = await syncResponse.json();
      const supabaseUserId = syncData.data?.id;

      if (!supabaseUserId) {
        throw new Error('Failed to get Supabase user ID');
      }

      console.log('Got Supabase user ID:', supabaseUserId);

      // Get Clerk token for Supabase
      const tokenResponse = await fetch('/api/auth/token');
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Token response error:', errorText);
        throw new Error(`Failed to get authentication token: ${tokenResponse.status}`);
      }
      
      const { token } = await tokenResponse.json();
      if (!token) {
        throw new Error('Authentication token is missing');
      }

      console.log('Got auth token, setting up Supabase client');
      
      // Initialize Supabase client with auth headers
      const supabase = createClientComponentClient<Database>({
        options: {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      });

      // Fetch cards with the correct Supabase UUID
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('owner_id', supabaseUserId);
      
      console.log('Cards query result:', {
        data: cardsData,
        error: cardsError,
        count: cardsData?.length || 0,
        userId: supabaseUserId
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
      
      if (!cardsData || cardsData.length === 0) {
        console.log('No cards found for user:', supabaseUserId);
        
        // Try a raw query to see all cards
        const { data: allCards, error: allCardsError } = await supabase
          .from('cards')
          .select('owner_id, id');
        
        console.log('All cards:', {
          cards: allCards,
          error: allCardsError,
          requestedUserId: supabaseUserId
        });
      }
      
      setCards(cardsData || []);
      setFilteredCards(cardsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err?.message || 'An unexpected error occurred');
      setDebugInfo(err);
    } finally {
      setIsLoading(false);
    }
  };

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

  const applyFilters = (cards: CardItem[], currentFilters = filters) => {
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
  };

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
  }, [cards]);

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

  const handleEditChange = (cardId: string, field: keyof CardItem, value: any) => {
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

      const { error } = await supabase
        .from('cards')
        .update({
          name: editedCard.name,
          sport: editedCard.sport,
          status: editedCard.status,
          grading_company: editedCard.grading_company,
          grade: editedCard.grade,
          purchase_price: editedCard.purchase_price,
          fees: editedCard.fees,
          sales_price: editedCard.sales_price,
          source: editedCard.source,
          purchase_link: editedCard.purchase_link
        })
        .eq('id', cardId);

      if (error) throw error;

      // Update the cards state with the edited values
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, ...editedCard } : card
      ));

      // Clear editing state
      cancelEditing(cardId);

      toast({
        title: "Success",
        description: "Card updated successfully",
      });
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Error",
        description: "Failed to update card",
        variant: "destructive",
      });
    }
  };

  const renderEditableCell = (card: CardItem, key: ColumnKey) => {
    const editingCard = editingCards[card.id];
    if (!editingCard?.isEditing) {
      return (
        <div className="flex items-center justify-between gap-2">
          {renderCellContent(card, key)}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => startEditing(card)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    switch (key) {
      case 'name':
        return (
          <Input
            value={editingCard.name}
            onChange={(e) => handleEditChange(card.id, 'name', e.target.value)}
            className="h-8"
          />
        );
      case 'sport':
        return (
          <Select
            value={editingCard.sport || ''}
            onValueChange={(value) => handleEditChange(card.id, 'sport', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SportType).map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {sport}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'status':
        return (
          <Select
            value={editingCard.status || ''}
            onValueChange={(value) => handleEditChange(card.id, 'status', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CardStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'grading_company':
        return (
          <Select
            value={editingCard.grading_company || ''}
            onValueChange={(value) => handleEditChange(card.id, 'grading_company', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(GradingCompany).map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'grade':
        return (
          <Select
            value={editingCard.grade || ''}
            onValueChange={(value) => handleEditChange(card.id, 'grade', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CardGrade).map((grade) => (
                <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'purchase_price':
      case 'fees':
      case 'sales_price':
        return (
          <Input
            type="number"
            step="0.01"
            value={editingCard[key] || ''}
            onChange={(e) => handleEditChange(card.id, key, parseFloat(e.target.value) || null)}
            className="h-8"
          />
        );
      case 'source':
        return (
          <Select
            value={editingCard.source || ''}
            onValueChange={(value) => handleEditChange(card.id, 'source', value)}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PurchaseSource).map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'purchase_link':
        return (
          <Input
            value={editingCard.purchase_link || ''}
            onChange={(e) => handleEditChange(card.id, 'purchase_link', e.target.value)}
            className="h-8"
          />
        );
      default:
        return renderCellContent(card, key);
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
        
        {debugInfo && (
          <Card className="overflow-auto max-h-96">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
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
                      {renderEditableCell(card, column.key)}
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
          <div className="relative pt-[56.25%] overflow-hidden">
            {card.image_url ? (
              <Image
                src={card.image_url}
                alt={card.name}
                fill
                className="object-cover"
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
                You haven't added any cards to your collection yet.
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

const renderCellContent = (card: CardItem, key: ColumnKey) => {
  switch (key) {
    case 'image_url':
      return card.image_url ? (
        <Image
          src={card.image_url}
          alt={card.name}
          width={50}
          height={70}
          className="rounded-sm object-cover"
        />
      ) : (
        <div className="w-[50px] h-[70px] bg-muted rounded-sm flex items-center justify-center">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    case 'name':
      return card.name;
    case 'player':
      return card.player;
    case 'sport':
      return card.sport;
    case 'status':
      return card.status;
    case 'grading_company':
      return card.grading_company || 'N/A';
    case 'grade':
      return card.grade || 'N/A';
    case 'purchase_price':
      return card.purchase_price != null ? `$${card.purchase_price.toFixed(2)}` : 'N/A';
    case 'fees':
      return card.fees ? `$${card.fees.toFixed(2)}` : '$0.00';
    case 'sales_price':
      return card.sales_price ? `$${card.sales_price.toFixed(2)}` : 'N/A';
    case 'net_profit':
      if (!card.sales_price || card.purchase_price == null) return 'N/A';
      const profit = card.sales_price - card.purchase_price - (card.fees || 0);
      return (
        <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
          ${profit.toFixed(2)}
        </span>
      );
    case 'roi':
      if (!card.sales_price || card.purchase_price == null) return 'N/A';
      const roi = ((card.sales_price - card.purchase_price - (card.fees || 0)) / card.purchase_price) * 100;
      return (
        <span className={roi >= 0 ? 'text-green-600' : 'text-red-600'}>
          {roi.toFixed(2)}%
        </span>
      );
    case 'source':
      return card.source || 'N/A';
    case 'purchase_link':
      return card.purchase_link ? (
        <a 
          href={card.purchase_link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          View
        </a>
      ) : 'N/A';
    default:
      return null;
  }
}; 