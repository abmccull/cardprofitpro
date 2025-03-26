import { Suspense } from 'react';
import ActiveBiddingClient from './client';
import { ActiveBiddingSkeleton } from '@/components/skeletons/active-bidding-skeleton';

export const metadata = {
  title: 'Active Bidding - CardProfit Pro',
  description: 'View and manage your active bidding and sniping strategies',
};

export default function ActiveBiddingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Active Bidding</h1>
      <p className="text-gray-600 mb-8">
        Monitor and manage your active bids and sniping strategies.
      </p>
      
      <Suspense fallback={<ActiveBiddingSkeleton />}>
        <ActiveBiddingClient />
      </Suspense>
    </div>
  );
} 