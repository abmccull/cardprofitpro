'use client';

import { Card } from '@/components/ui-migrated/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui-migrated/table';

interface Player {
  id: number;
  name: string;
  isRookie: boolean;
  rookieYear?: number;
  sport: string;
}

interface Product {
  id: number;
  name: string;
  notes?: string;
  sport: string;
}

interface Top100ResultsProps {
  players: Player[];
  products: Product[];
  isLoading: boolean;
}

export function Top100Results({ players, products, isLoading }: Top100ResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!players?.length && !products?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No results found. Try adjusting your filters.
      </div>
    );
  }

  const groupedProducts = products.reduce((acc, product) => {
    if (!acc[product.sport]) {
      acc[product.sport] = [];
    }
    acc[product.sport].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Players</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rookie Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell>{player.sport}</TableCell>
                <TableCell>{player.isRookie ? 'Rookie' : 'Veteran'}</TableCell>
                <TableCell>{player.rookieYear || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recommended Products</h3>
        {Object.entries(groupedProducts).map(([sport, sportProducts]) => (
          <div key={sport} className="mb-6 last:mb-0">
            <h4 className="text-md font-medium mb-2">{sport}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sportProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ))}
      </Card>
    </div>
  );
} 