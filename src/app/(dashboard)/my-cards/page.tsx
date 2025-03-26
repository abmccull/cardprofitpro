'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';

type CardItem = Database['public']['Tables']['cards']['Row'];

export default function MyCardsPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [cards, setCards] = useState<CardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    if (isSignedIn && user) {
      console.log('User is signed in, clerk user ID:', user.id);
      loadCards();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
      console.log('User is not signed in');
    }
  }, [isSignedIn, user, isLoaded]);

  const syncUser = async () => {
    try {
      console.log("🔍 Starting syncUser function call");
      console.log("→ Clerk user state:", { 
        isSignedIn, 
        userId: user?.id,
        userEmail: user?.emailAddresses?.[0]?.emailAddress
      });
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
        }),
      });

      console.log("← API response status:", response.status);
      
      // Clone the response to inspect it without consuming it
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();
      console.log("← Raw API response:", rawResponseText);
      
      if (!response.ok) {
        let errorData;
        try {
          // Try to parse as JSON if possible
          errorData = JSON.parse(rawResponseText);
        } catch (e) {
          errorData = { rawResponse: rawResponseText };
        }
        
        console.error('Error syncing user:', errorData);
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
      
      console.log('Starting user sync and card loading process');
      
      // First sync the user via API
      const supabaseUser = await syncUser();
      
      // Now get cards using the Supabase client
      const supabase = createClientComponentClient<Database>();
      
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select()
        .eq('owner_id', supabaseUser.id)
        .order('created_at', { ascending: false });
      
      if (cardsError) {
        console.error('Error loading cards:', cardsError);
        setError(`Failed to load cards: ${cardsError.message}`);
        setDebugInfo({
          supabaseUser,
          cardsError
        });
        return;
      }
      
      console.log(`Loaded ${cardsData?.length || 0} cards for user ${supabaseUser.id}`);
      setCards(cardsData || []);
      setError(null);
    } catch (err: any) {
      console.error('Unexpected error:', err);
      setError(err?.message || 'An unexpected error occurred');
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Cards</h1>
        <Button asChild>
          <a href="/card-discovery">Add Cards</a>
        </Button>
      </div>

      {cards.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No cards found</AlertTitle>
          <AlertDescription>
            You haven't added any cards to your collection yet.
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <a href="/card-discovery">Discover Cards</a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
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
                  {card.purchase_price && <p>Purchase Price: ${Number(card.purchase_price).toFixed(2)}</p>}
                  {card.current_value && <p>Current Value: ${Number(card.current_value).toFixed(2)}</p>}
                  {card.purchase_price && card.current_value && (
                    <p className={Number(card.current_value) >= Number(card.purchase_price) ? 'text-green-600' : 'text-red-600'}>
                      ROI: {(((Number(card.current_value) - Number(card.purchase_price)) / Number(card.purchase_price)) * 100).toFixed(2)}%
                    </p>
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