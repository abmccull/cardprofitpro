'use client';

import { useState } from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Card } from '@/components/ui-migrated/card';
import { useToast } from '@/components/ui-migrated/use-toast';

interface EbayConnectProps {
  isConnected: boolean;
  lastUpdated?: string;
}

export function EbayConnect({ isConnected, lastUpdated }: EbayConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/ebay/url');
      
      if (!response.ok) {
        throw new Error('Failed to get eBay authorization URL');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error connecting to eBay:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect to eBay',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/ebay/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect eBay account');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error disconnecting from eBay:', error);
      toast({
        variant: 'destructive',
        title: 'Disconnection Failed',
        description: error instanceof Error ? error.message : 'Failed to disconnect from eBay',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">eBay Connection</h3>
          <p className="text-sm text-muted-foreground">
            {isConnected
              ? `Connected${lastUpdated ? ` • Last updated ${new Date(lastUpdated).toLocaleDateString()}` : ''}`
              : 'Connect your eBay account to track purchases and sales'}
          </p>
        </div>
        <Button
          onClick={isConnected ? handleDisconnect : handleConnect}
          disabled={isLoading}
          variant={isConnected ? 'destructive' : 'default'}
        >
          {isLoading
            ? 'Loading...'
            : isConnected
            ? 'Disconnect'
            : 'Connect eBay'}
        </Button>
      </div>
    </Card>
  );
} 