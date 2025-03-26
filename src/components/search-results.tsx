'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase/types';
import { useToast } from '@/components/ui/use-toast';

interface Player {
  player_id: number;
  player_name: string;
  is_rookie: boolean;
  rookie_year: number | null;
  sports: {
    sport_name: string;
  };
}

interface SearchResultsProps {
  players: Player[];
  isLoading: boolean;
}

export function SearchResults({ players, isLoading }: SearchResultsProps) {
  const { toast } = useToast();
  const [addingCard, setAddingCard] = useState<number | null>(null);

  const addCardToCollection = async (player: Player) => {
    try {
      setAddingCard(player.player_id);
      
      // First sync the user
      const syncResponse = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync' })
      });

      if (!syncResponse.ok) {
        throw new Error('Failed to sync user');
      }

      const { user: supabaseUser } = await syncResponse.json();
      
      if (!supabaseUser?.id) {
        throw new Error('No user ID found');
      }

      // Initialize Supabase client
      const supabase = createClientComponentClient<Database>();

      // Add card to collection
      const { error } = await supabase.from('cards').insert({
        name: player.player_name,
        sport: player.sports.sport_name,
        owner_id: supabaseUser.id,
        status: 'In Collection',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Added ${player.player_name} to your collection`,
      });
    } catch (error: any) {
      console.error('Error adding card:', error);
      toast({
        title: 'Error',
        description: 'Failed to add card to collection',
        variant: 'destructive',
      });
    } finally {
      setAddingCard(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-3 w-full bg-gray-200 rounded mb-2" />
              <div className="h-3 w-2/3 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!players?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Results</CardTitle>
          <CardDescription>
            Try adjusting your search filters to find more players.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {players.map((player) => (
        <Card key={player.player_id}>
          <CardHeader>
            <CardTitle>{player.player_name}</CardTitle>
            <CardDescription>{player.sports.sport_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-gray-500">
                {player.is_rookie && (
                  <p>Rookie Year: {player.rookie_year || 'Unknown'}</p>
                )}
              </div>
              <Button 
                onClick={() => addCardToCollection(player)}
                disabled={addingCard === player.player_id}
                className="w-full"
              >
                {addingCard === player.player_id ? 'Adding...' : 'Add to Collection'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 