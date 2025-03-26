'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSocket } from '@/hooks/use-socket';
import type { CardStatus } from '@/lib/supabase/types';

type CardData = {
  id: string;
  name: string;
  status: CardStatus;
  purchase_price: number;
  current_value: number;
  updated_at: string;
};

type CardUpdate = {
  id: string;
  status: CardStatus;
};

const statusColors = {
  raw: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  graded: 'bg-green-100 text-green-800',
  listed: 'bg-yellow-100 text-yellow-800',
  sold: 'bg-purple-100 text-purple-800',
} as const;

export default function CardLifecyclePage() {
  const [selectedStatus, setSelectedStatus] = useState<CardStatus | 'all'>('all');
  const [cards, setCards] = useState<CardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { subscribeToCard, unsubscribeFromCard } = useSocket();

  useEffect(() => {
    fetchCards();
  }, [selectedStatus]);

  useEffect(() => {
    // Subscribe to real-time updates for each card
    cards.forEach((card) => {
      subscribeToCard(card.id, (update: CardUpdate) => {
        handleCardUpdate(update);
      });
    });

    return () => {
      // Cleanup subscriptions
      cards.forEach((card) => {
        unsubscribeFromCard((update: CardUpdate) => {
          handleCardUpdate(update);
        });
      });
    };
  }, [cards]);

  const fetchCards = async () => {
    try {
      const response = await fetch(
        '/api/cards' + (selectedStatus !== 'all' ? `?status=${selectedStatus}` : '')
      );

      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const data = await response.json();
      setCards(data.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cards. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardUpdate = (update: CardUpdate) => {
    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === update.id ? { ...card, status: update.status } : card
      )
    );
  };

  const handleStatusChange = async (cardId: string, newStatus: CardStatus) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update card status');
      }

      toast({
        title: 'Status Updated',
        description: 'Card status has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating card status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update card status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Card Lifecycle</h2>
        <p className="text-muted-foreground">
          Track and manage your cards through their lifecycle
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {(['all', 'raw', 'submitted', 'graded', 'listed', 'sold'] as const).map(
                (status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? 'default' : 'outline'}
                    onClick={() => setSelectedStatus(status)}
                    className={
                      status !== 'all' && selectedStatus === status
                        ? statusColors[status]
                        : ''
                    }
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                )
              )}
            </div>
            <Button onClick={() => router.push('/deal-analyzer')}>
              Add New Card
            </Button>
          </div>

          <div className="relative">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Card Name</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Purchase Price</th>
                  <th className="text-right py-3 px-4">Current Value</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr key={card.id} className="border-b">
                    <td className="py-3 px-4">{card.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[card.status]
                        }`}
                      >
                        {card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      ${card.purchase_price.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      ${card.current_value.toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      <select
                        value={card.status}
                        onChange={(e) =>
                          handleStatusChange(card.id, e.target.value as CardStatus)
                        }
                        className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        {Object.keys(statusColors).map((status) => (
                          <option key={status} value={status}>
                            Move to {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!isLoading && cards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground">
                      No cards found. Add a new card to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
} 