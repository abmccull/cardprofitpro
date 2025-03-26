'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

type Transaction = {
  id: string;
  title: string;
  price: number;
  type: 'purchase' | 'sale';
  platform: 'facebook' | 'instagram' | 'tiktok' | 'in_person' | 'other';
  transaction_date: string;
  notes?: string;
};

export function TransactionHistory() {
  const [type, setType] = useState<string>('');
  const [platform, setPlatform] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', type, platform, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (platform) params.append('platform', platform);
      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/transactions?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      return data.data as Transaction[];
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All types</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="sale">Sale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger>
              <SelectValue placeholder="All platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All platforms</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="in_person">In Person</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Start Date</Label>
          <DatePicker
            selected={startDate}
            onSelect={setStartDate}
            maxDate={endDate || undefined}
          />
        </div>

        <div className="space-y-2">
          <Label>End Date</Label>
          <DatePicker
            selected={endDate}
            onSelect={setEndDate}
            minDate={startDate || undefined}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead className="text-right">Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions?.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>{transaction.title}</TableCell>
              <TableCell>
                <Badge variant={transaction.type === 'purchase' ? 'default' : 'success'}>
                  {transaction.type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {transaction.platform.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                ${transaction.price.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
          {!transactions?.length && (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 