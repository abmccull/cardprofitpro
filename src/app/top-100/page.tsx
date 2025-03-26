import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Top100Client } from '@/components/top-100-client';
import type { Database } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function Top100Page() {
  const supabase = createServerComponentClient<Database>({ cookies });

  // Fetch all sports
  const { data: sports } = await supabase
    .from('sports')
    .select('sport_name')
    .order('sport_name');

  // Fetch all products
  const { data: products } = await supabase
    .from('products')
    .select('product_id, product_name')
    .order('product_name');

  return (
    <main className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Top 100 Players</h1>
          <p className="text-gray-500">
            Discover the most valuable players across all sports
          </p>
        </div>

        <Top100Client
          initialSports={sports?.map(s => s.sport_name) || []}
          initialProducts={products || []}
        />
      </div>
    </main>
  );
} 