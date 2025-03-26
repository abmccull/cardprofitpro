'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
            <div className="text-sm text-gray-500">
              {player.is_rookie && (
                <p>Rookie Year: {player.rookie_year || 'Unknown'}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 