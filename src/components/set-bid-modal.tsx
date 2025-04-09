'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui-migrated/dialog';
import { Button } from '@/components/ui-migrated/button';
import { Input } from '@/components/ui-migrated/input';
import { Label } from '@/components/ui-migrated/label';
import { Switch } from '@/components/ui-migrated/switch';
import { LoadingSpinner } from './loading-spinner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';

interface SetBidModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export function SetBidModal({ item, isOpen, onClose }: SetBidModalProps) {
  const { user } = useUser();
  const router = useRouter();
  const [maxBid, setMaxBid] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bidStrategy, setBidStrategy] = useState<'early' | 'last'>('last');
  const [enableSnipe, setEnableSnipe] = useState<boolean>(true);
  const [snipeTime, setSnipeTime] = useState<string>('30');

  // Calculate the current price + minimum bid increment
  const suggestedBid = item?.price?.value 
    ? (parseFloat(item.price.value) + (item.bidCount && item.bidCount > 0 ? 1 : 0)).toFixed(2)
    : '0.00';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to place bids');
      return;
    }
    
    if (!maxBid || parseFloat(maxBid) <= 0) {
      setError('Please enter a valid maximum bid amount');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClientComponentClient<Database>();
      
      // Create snipe record in the database
      const { error: insertError } = await supabase
        .from('snipes')
        .insert({
          user_id: user.id,
          item_id: item.itemId,
          item_title: item.title,
          current_price: parseFloat(item.price.value),
          max_bid: parseFloat(maxBid),
          end_time: item.timeLeft || new Date().toISOString(),
          marketplace: 'ebay',
          bid_strategy: bidStrategy,
          snipe_time_seconds: enableSnipe ? parseInt(snipeTime) : null,
          status: 'active',
          image_url: item.image?.imageUrl || null,
          item_url: item.itemWebUrl || null,
        });
      
      if (insertError) {
        throw insertError;
      }
      
      // Close modal and refresh data
      onClose();
      router.refresh();
    } catch (error: any) {
      console.error('Error setting up bid:', error);
      setError(error.message || 'Failed to set up bid');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Bid for Auction</DialogTitle>
          <DialogDescription>
            Configure your maximum bid and sniping strategy.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <h3 className="font-medium text-sm line-clamp-2">{item?.title}</h3>
            <p className="text-sm text-muted-foreground">
              Current Price: ${parseFloat(item?.price?.value || '0').toFixed(2)}
            </p>
            {item?.bidCount !== undefined && (
              <p className="text-xs text-muted-foreground">
                {item.bidCount} {item.bidCount === 1 ? 'bid' : 'bids'}
              </p>
            )}
            <p className="text-xs text-amber-600">
              Ends: {new Date(item?.timeLeft || Date.now()).toLocaleString()}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-bid">Your Maximum Bid</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="max-bid"
                type="number"
                step="0.01"
                min={suggestedBid}
                placeholder={suggestedBid}
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                className="pl-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Suggested minimum bid: ${suggestedBid}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bid-strategy">Bid Strategy</Label>
            <div className="flex">
              <Button
                type="button"
                variant={bidStrategy === 'early' ? 'default' : 'outline'}
                size="sm"
                className="rounded-r-none flex-1"
                onClick={() => setBidStrategy('early')}
              >
                Bid Early
              </Button>
              <Button
                type="button"
                variant={bidStrategy === 'last' ? 'default' : 'outline'}
                size="sm"
                className="rounded-l-none flex-1"
                onClick={() => setBidStrategy('last')}
              >
                Last Second
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {bidStrategy === 'early'
                ? 'Places your maximum bid now, letting eBay proxy bid for you.'
                : 'Waits until the last seconds to place your bid, avoiding bid wars.'}
            </p>
          </div>
          
          {bidStrategy === 'last' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-snipe" className="cursor-pointer">
                  Enable Sniping
                </Label>
                <Switch
                  id="enable-snipe"
                  checked={enableSnipe}
                  onCheckedChange={setEnableSnipe}
                />
              </div>
              
              {enableSnipe && (
                <div className="pt-2">
                  <Label htmlFor="snipe-time">Seconds before end</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="snipe-time"
                      type="number"
                      min="5"
                      max="60"
                      value={snipeTime}
                      onChange={(e) => setSnipeTime(e.target.value)}
                      className="max-w-[100px]"
                    />
                    <span className="text-sm text-muted-foreground">seconds</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    The system will place your bid this many seconds before the auction ends.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <LoadingSpinner size="sm" /> : 'Set Bid'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 