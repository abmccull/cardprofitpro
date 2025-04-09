'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui-migrated/card';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui-migrated/alert';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';
import { Button } from '@/components/ui-migrated/button';

interface Analytics {
  total_cards: number;
  total_investment: number;
  total_value: number;
  total_profit: number;
  best_performing_cards: Array<{
    id: string;
    name: string;
    profit_percentage: number;
    profit_amount: number;
  }>;
}

export default function AnalyticsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (isSignedIn && user) {
      loadAnalytics();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isSignedIn, user, isLoaded]);

  const syncUser = async () => {
    try {
      console.log("🔍 Analytics: Starting syncUser function call");
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
        }),
      });

      console.log("← Analytics API response status:", response.status);
      
      // Clone the response to inspect it without consuming it
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      
      if (!response.ok) {
        let errorData;
        try {
          // Try to parse as JSON if possible
          errorData = JSON.parse(rawResponseText);
        } catch (e) {
          errorData = { rawResponse: rawResponseText };
        }
        
        console.error('Error syncing user in analytics:', errorData);
        setDebugInfo({
          api: 'sync',
          status: response.status,
          error: errorData,
          timestamp: new Date().toISOString()
        });
        throw new Error(`API error: ${errorData.error || 'Unknown error'}`);
      }

      let userData;
      try {
        userData = JSON.parse(rawResponseText);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        throw new Error("Invalid JSON response from API");
      }
      
      console.log("✅ Analytics: User sync successful:", userData);
      return userData.user;
    } catch (error) {
      console.error('❌ Error in syncUser (analytics):', error);
      throw error;
    }
  };

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Starting analytics data load");
      
      // First sync the user via API to get Supabase user ID
      const supabaseUser = await syncUser();
      console.log("✅ Retrieved Supabase user:", supabaseUser);
      
      const supabase = createClientComponentClient<Database>();
      
      // Get all cards for the user using Supabase user ID, not Clerk ID
      const { data: cards, error: supabaseError } = await supabase
        .from('cards')
        .select(`
          id,
          name,
          purchase_price,
          current_value,
          created_at
        `)
        .eq('owner_id', supabaseUser.id)
        .order('created_at', { ascending: false });
      
      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        setError(supabaseError.message || 'Failed to load analytics');
        setDebugInfo({
          supabaseError,
          supabaseUser
        });
        return;
      }

      console.log(`✅ Retrieved ${cards?.length || 0} cards for analytics`);

      if (!cards || cards.length === 0) {
        setAnalytics({
          total_cards: 0,
          total_investment: 0,
          total_value: 0,
          total_profit: 0,
          best_performing_cards: []
        });
        return;
      }

      // Calculate analytics
      const analytics: Analytics = {
        total_cards: cards.length,
        total_investment: cards.reduce((sum, card) => sum + (Number(card.purchase_price) || 0), 0),
        total_value: cards.reduce((sum, card) => sum + (Number(card.current_value) || 0), 0),
        total_profit: cards.reduce((sum, card) => sum + ((Number(card.current_value) || 0) - (Number(card.purchase_price) || 0)), 0),
        best_performing_cards: cards
          .map(card => ({
            id: card.id,
            name: card.name,
            profit_amount: (Number(card.current_value) || 0) - (Number(card.purchase_price) || 0),
            profit_percentage: ((Number(card.current_value) || 0) - (Number(card.purchase_price) || 0)) / (Number(card.purchase_price) || 1) * 100
          }))
          .sort((a, b) => b.profit_percentage - a.profit_percentage)
          .slice(0, 5)
      };

      console.log("✅ Analytics calculated successfully");
      setAnalytics(analytics);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading analytics:', err);
      setError(err?.message || 'An unexpected error occurred while loading analytics');
      setDebugInfo(err);
    } finally {
      setIsLoading(false);
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
          <Button variant="outline" onClick={() => loadAnalytics()}>
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

  if (!analytics) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Data</AlertTitle>
          <AlertDescription>No analytics data available. Add some cards to your collection to see insights.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_cards}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.total_investment.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.total_value.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            {analytics.total_profit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${analytics.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(analytics.total_profit).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Best Performing Cards</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.best_performing_cards.length > 0 ? (
            <div className="space-y-4">
              {analytics.best_performing_cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium">{card.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Profit: ${card.profit_amount.toFixed(2)}
                    </p>
                  </div>
                  <div className={`text-sm font-medium ${card.profit_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {card.profit_percentage >= 0 ? '+' : ''}{card.profit_percentage.toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No cards found in your collection.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 