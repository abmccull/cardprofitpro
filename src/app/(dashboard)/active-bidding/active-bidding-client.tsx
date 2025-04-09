'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui-migrated/card';
import { Button } from '@/components/ui-migrated/button';
import type { Database } from '@/lib/supabase/types';

type Snipe = Database['public']['Tables']['snipes']['Row'];

interface ActiveBiddingClientProps {
  initialSnipes: Snipe[];
}

export function ActiveBiddingClient({ initialSnipes }: ActiveBiddingClientProps) {
  const [snipes, setSnipes] = useState<Snipe[]>(initialSnipes);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Subscribe to real-time updates
    const channel = supabase
      .channel('snipes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'snipes',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSnipes((current) => [...current, payload.new as Snipe]);
          } else if (payload.eventType === 'UPDATE') {
            setSnipes((current) =>
              current.map((snipe) =>
                snipe.id === payload.new.id ? (payload.new as Snipe) : snipe
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSnipes((current) =>
              current.filter((snipe) => snipe.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const formatTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleCancelSnipe = async (snipeId: string) => {
    try {
      const { error } = await supabase
        .from('snipes')
        .update({ status: 'cancelled' })
        .eq('id', snipeId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling snipe:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-blue-600';
      case 'queued':
        return 'text-yellow-600';
      case 'placed':
        return 'text-green-600';
      case 'won':
        return 'text-green-700';
      case 'lost':
        return 'text-red-600';
      case 'failed':
        return 'text-red-700';
      case 'cancelled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!snipes.length) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">
          No active bids. Start by setting up a snipe from the Card Discovery page.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {snipes.map((snipe) => (
        <Card key={snipe.id} className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-medium">{snipe.card_title}</h3>
              <div className="text-sm text-gray-500">
                Current Bid: ${snipe.current_bid?.toFixed(2) || '0.00'} |
                Max Bid: ${snipe.max_bid.toFixed(2)}
              </div>
              <div className="flex space-x-4 text-sm">
                <span className={getStatusColor(snipe.status)}>
                  {snipe.status.charAt(0).toUpperCase() + snipe.status.slice(1)}
                </span>
                <span>{formatTimeLeft(snipe.end_time)}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href={snipe.ebay_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View on eBay
              </a>
              {['pending', 'queued'].includes(snipe.status) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancelSnipe(snipe.id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
} 