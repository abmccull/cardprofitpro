'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Grid, List, Search, ArrowUpDown, ArrowUp, ArrowDown, ImageIcon, ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { Database, CardGrade, GradingCompany } from '@/lib/supabase/types';
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

type CardItem = Database['public']['Tables']['cards']['Row'];
type ViewMode = 'grid' | 'table';

type SortConfig = {
  column: keyof CardItem | null;
  direction: 'asc' | 'desc';
};

const GRADE_OPTIONS: CardGrade[] = [
  '1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5', '5.5',
  '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10'
];

const GRADING_COMPANIES: GradingCompany[] = ['PSA', 'BGS', 'SGC', 'HGA', 'CSG'];

export default function MyCardsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [filteredCards, setFilteredCards] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState({
    search: '',
    sport: 'all',
    status: 'all',
    grade: 'all',
    gradingCompany: 'all'
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: null,
    direction: 'asc'
  });

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

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
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

    if (currentFilters.grade && currentFilters.grade !== 'all') {
      filtered = filtered.filter(card => card.grade === currentFilters.grade);
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
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </div>
      <Select
        value={filters.sport}
        onValueChange={(value) => handleFilterChange('sport', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sport" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sports</SelectItem>
          <SelectItem value="Baseball">Baseball</SelectItem>
          <SelectItem value="Basketball">Basketball</SelectItem>
          <SelectItem value="Football">Football</SelectItem>
          <SelectItem value="Hockey">Hockey</SelectItem>
          <SelectItem value="Pokemon">Pokemon</SelectItem>
          <SelectItem value="WNBA">WNBA</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="Purchased">Purchased</SelectItem>
          <SelectItem value="Watchlist">Watchlist</SelectItem>
          <SelectItem value="Sent for Grading">Sent for Grading</SelectItem>
          <SelectItem value="Listed">Listed</SelectItem>
          <SelectItem value="Sold">Sold</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.gradingCompany}
        onValueChange={(value) => handleFilterChange('gradingCompany', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Grading Company" />
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
      <Select
        value={filters.grade}
        onValueChange={(value) => handleFilterChange('grade', value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Grade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Grades</SelectItem>
          {GRADE_OPTIONS.map((grade) => (
            <SelectItem key={grade} value={grade}>
              {grade}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead 
              className="min-w-[200px] cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Name
                <SortIndicator column="name" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[120px] cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('sport')}
            >
              <div className="flex items-center">
                Sport
                <SortIndicator column="sport" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[120px] cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center">
                Status
                <SortIndicator column="status" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[120px] cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('grading_company')}
            >
              <div className="flex items-center whitespace-nowrap">
                Grading Co.
                <SortIndicator column="grading_company" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[100px] cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('grade')}
            >
              <div className="flex items-center">
                Grade
                <SortIndicator column="grade" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[120px] cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => handleSort('purchase_price')}
            >
              <div className="flex items-center justify-end">
                Purchase Price
                <SortIndicator column="purchase_price" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[100px] cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => handleSort('fees')}
            >
              <div className="flex items-center justify-end">
                Fees
                <SortIndicator column="fees" />
              </div>
            </TableHead>
            <TableHead 
              className="min-w-[120px] cursor-pointer hover:bg-muted/50 text-right"
              onClick={() => handleSort('sales_price')}
            >
              <div className="flex items-center justify-end">
                Sales Price
                <SortIndicator column="sales_price" />
              </div>
            </TableHead>
            <TableHead className="min-w-[120px] text-right">Net Profit</TableHead>
            <TableHead className="min-w-[100px] text-right">ROI</TableHead>
            <TableHead className="min-w-[100px] text-center">Purchase Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCards.map((card) => (
            <TableRow key={card.id}>
              <TableCell className="w-[100px]">
                {card.image_url ? (
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
                )}
              </TableCell>
              <TableCell className="min-w-[200px] font-medium">{card.name}</TableCell>
              <TableCell className="min-w-[120px]">{card.sport}</TableCell>
              <TableCell className="min-w-[120px]">{card.status}</TableCell>
              <TableCell className="min-w-[120px]">{card.grading_company || 'N/A'}</TableCell>
              <TableCell className="min-w-[100px]">{card.grade || 'N/A'}</TableCell>
              <TableCell className="min-w-[120px] text-right">
                {card.purchase_price ? `$${card.purchase_price.toFixed(2)}` : 'N/A'}
              </TableCell>
              <TableCell className="min-w-[100px] text-right">
                {card.fees ? `$${card.fees.toFixed(2)}` : '$0.00'}
              </TableCell>
              <TableCell className="min-w-[120px] text-right">
                {card.sales_price ? `$${card.sales_price.toFixed(2)}` : 'N/A'}
              </TableCell>
              <TableCell className="min-w-[120px] text-right">
                {card.sales_price && card.purchase_price ? (
                  <span className={
                    (card.sales_price - card.purchase_price - (card.fees || 0)) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    ${(card.sales_price - card.purchase_price - (card.fees || 0)).toFixed(2)}
                  </span>
                ) : 'N/A'}
              </TableCell>
              <TableCell className="min-w-[100px] text-right">
                {card.sales_price && card.purchase_price ? (
                  <span className={
                    (card.sales_price - card.purchase_price - (card.fees || 0)) >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }>
                    {(((card.sales_price - card.purchase_price - (card.fees || 0)) / card.purchase_price) * 100).toFixed(2)}%
                  </span>
                ) : 'N/A'}
              </TableCell>
              <TableCell className="min-w-[100px] text-center">
                {card.purchase_link ? (
                  <a 
                    href={card.purchase_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    View
                  </a>
                ) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Cards</h1>
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

      {filteredCards.length === 0 ? (
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <Card key={card.id}>
              {card.image_url && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={card.image_url}
                    alt={card.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{card.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {card.grade && <p>Grade: {card.grade}</p>}
                  {card.sport && <p>Sport: {card.sport}</p>}
                  {card.status && <p>Status: {card.status}</p>}
                  {card.purchase_price && <p>Purchase Price: ${card.purchase_price.toFixed(2)}</p>}
                  {card.fees && <p>Fees: ${card.fees.toFixed(2)}</p>}
                  {card.sales_price && <p>Sales Price: ${card.sales_price.toFixed(2)}</p>}
                  {card.sales_price && card.purchase_price && (
                    <>
                      <p>
                        Net Profit: ${(card.sales_price - card.purchase_price - (card.fees || 0)).toFixed(2)}
                      </p>
                      <p className={card.sales_price >= card.purchase_price ? 'text-green-600' : 'text-red-600'}>
                        ROI: {(((card.sales_price - card.purchase_price - (card.fees || 0)) / card.purchase_price) * 100).toFixed(2)}%
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 