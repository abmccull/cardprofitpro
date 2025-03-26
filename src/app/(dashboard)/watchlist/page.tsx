import { auth } from '@clerk/nextjs/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/types';
import { WatchlistItems } from './components/watchlist-items';

export default async function WatchlistPage() {
  const { userId } = await auth();
  const supabase = createServerComponentClient<Database>({ cookies });

  const { data: watchlistItems } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .order('end_time', { ascending: true });

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
      </div>
      <WatchlistItems initialItems={watchlistItems || []} />
    </div>
  );
} 