'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/types';
import { Trash2, Bell, BellOff } from 'lucide-react';

type WatchlistItem = Database['public']['Tables']['watchlist']['Row'];

interface WatchlistItemsProps {
  initialItems: WatchlistItem[];
}

export function WatchlistItems({ initialItems }: WatchlistItemsProps) {
  const [items, setItems] = useState(initialItems);
  const [notificationEnabled, setNotificationEnabled] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    // Check for items ending soon and show notifications
    const checkEndingSoon = () => {
      const now = new Date();
      items.forEach(item => {
        const endTime = new Date(item.end_time);
        const minutesLeft = (endTime.getTime() - now.getTime()) / (1000 * 60);
        
        if (minutesLeft <= 60 && minutesLeft > 0 && notificationEnabled.has(item.id)) {
          const formattedTime = minutesLeft < 2 
            ? 'ending in 1 minute!'
            : minutesLeft < 60 
              ? `ending in ${Math.round(minutesLeft)} minutes!`
              : 'ending in 1 hour!';

          toast({
            title: '🚨 Auction Ending Alert!',
            description: `${item.title} is ${formattedTime}`,
            variant: 'destructive',
          });
        }
      });
    };

    // Check every minute when items are close to ending
    const interval = setInterval(checkEndingSoon, 1000 * 60); // Check every minute
    return () => clearInterval(interval);
  }, [items, notificationEnabled, toast]);

  const handleRemove = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: 'Item Removed',
        description: 'Item has been removed from your watchlist.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item from watchlist.',
        variant: 'destructive',
      });
    }
  };

  const toggleNotification = (itemId: string) => {
    setNotificationEnabled(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Your watchlist is empty. Add items from the Card Discovery page.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const endTime = new Date(item.end_time);
        const now = new Date();
        const minutesLeft = (endTime.getTime() - now.getTime()) / (1000 * 60);
        const isEnded = minutesLeft <= 0;
        const isEndingSoon = minutesLeft <= 60 && !isEnded;

        return (
          <Card key={item.id} className="overflow-hidden">
            <div className="aspect-square relative">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  fill
                  className="object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  No Image
                </div>
              )}
            </div>
            
            <div className="p-4 space-y-2">
              <h3 className="font-medium line-clamp-2" title={item.title}>
                {item.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">
                  ${item.price.toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => toggleNotification(item.id)}
                    className={notificationEnabled.has(item.id) ? 'text-blue-500' : ''}
                  >
                    {notificationEnabled.has(item.id) ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className={
                  isEnded ? 'text-red-500' :
                  isEndingSoon ? 'text-red-500 font-bold' :
                  'text-muted-foreground'
                }>
                  {isEnded ? 'Ended' :
                   isEndingSoon ? minutesLeft < 2 
                     ? '⚡ Ending in 1 minute!'
                     : `⚡ Ending in ${Math.round(minutesLeft)} minutes!` :
                   `Ends: ${endTime.toLocaleDateString()} ${endTime.toLocaleTimeString()}`}
                </p>
              </div>

              <Button
                variant="secondary"
                className="w-full"
                onClick={() => window.open(item.listing_url, '_blank')}
              >
                View on eBay
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
} 