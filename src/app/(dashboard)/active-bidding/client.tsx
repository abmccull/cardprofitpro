'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock, ExternalLink, TimerOff, Check, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/loading-spinner';
import { formatDistanceToNow, isPast } from 'date-fns';
import type { Database } from '@/lib/supabase/types';

type Snipe = Database['public']['Tables']['snipes']['Row'];

export default function ActiveBiddingClient() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [snipes, setSnipes] = useState<Snipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn && user) {
      loadSnipes();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isSignedIn, user, isLoaded]);

  const loadSnipes = async () => {
    try {
      setIsLoading(true);
      const supabase = createClientComponentClient<Database>();
      
      const { data, error } = await supabase
        .from('snipes')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSnipes(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error loading snipes:', err);
      setError(err.message || 'Failed to load active bids');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSnipe = async (snipeId: string) => {
    try {
      const supabase = createClientComponentClient<Database>();
      
      const { error } = await supabase
        .from('snipes')
        .update({ status: 'cancelled' })
        .eq('id', snipeId)
        .eq('user_id', user!.id);
      
      if (error) throw error;
      
      // Refresh the list
      loadSnipes();
    } catch (err: any) {
      console.error('Error cancelling snipe:', err);
      setError(err.message || 'Failed to cancel bid');
    }
  };

  const getStatusBadge = (status: string, endTime: string) => {
    const isEnded = isPast(new Date(endTime));
    
    if (status === 'active' && !isEnded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Clock className="mr-1 h-3 w-3" />
          Active
        </span>
      );
    } else if (status === 'active' && isEnded) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Pending Result
        </span>
      );
    } else if (status === 'processing') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <LoadingSpinner size="sm" className="mr-1" />
          Processing
        </span>
      );
    } else if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <Check className="mr-1 h-3 w-3" />
          Bid Placed
        </span>
      );
    } else if (status === 'error') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="mr-1 h-3 w-3" />
          Error
        </span>
      );
    } else if (status === 'cancelled') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <TimerOff className="mr-1 h-3 w-3" />
          Cancelled
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Alert className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication required</AlertTitle>
          <AlertDescription>
            Please sign in to view your active bids.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner className="py-12" />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {snipes.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No active bids</AlertTitle>
          <AlertDescription>
            You don't have any active bids or snipes set up yet.
            <div className="mt-2">
              <Button asChild size="sm" variant="outline">
                <a href="/card-discovery">Discover Cards</a>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snipes.map((snipe) => (
            <Card key={snipe.id} className="overflow-hidden">
              {snipe.image_url && (
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={snipe.image_url}
                    alt={snipe.item_title || 'Auction item'}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(snipe.status, snipe.end_time)}
                  </div>
                </div>
              )}
              <CardHeader className="p-4">
                <CardTitle className="text-sm line-clamp-2">
                  {snipe.item_title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {!snipe.image_url && (
                  <div className="mb-2">
                    {getStatusBadge(snipe.status, snipe.end_time)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div className="text-muted-foreground">Current Price:</div>
                  <div className="font-medium">${snipe.current_price.toFixed(2)}</div>
                  
                  <div className="text-muted-foreground">Your Max Bid:</div>
                  <div className="font-medium">${snipe.max_bid.toFixed(2)}</div>
                  
                  <div className="text-muted-foreground">End Time:</div>
                  <div className="font-medium">
                    {isPast(new Date(snipe.end_time))
                      ? 'Ended'
                      : formatDistanceToNow(new Date(snipe.end_time), { addSuffix: true })}
                  </div>
                  
                  <div className="text-muted-foreground">Strategy:</div>
                  <div className="font-medium capitalize">
                    {snipe.bid_strategy === 'last' 
                      ? `Snipe (${snipe.snipe_time_seconds}s)` 
                      : 'Bid Early'}
                  </div>
                </div>
                
                {snipe.error_message && (
                  <div className="mt-2 text-xs text-red-500">
                    Error: {snipe.error_message}
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 gap-2">
                {snipe.item_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a href={snipe.item_url} target="_blank" rel="noopener noreferrer">
                      View <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                )}
                
                {snipe.status === 'active' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCancelSnipe(snipe.id)}
                  >
                    Cancel
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 