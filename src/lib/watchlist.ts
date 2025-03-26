import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface WatchlistItem {
  itemId: string;
  title: string;
  price: {
    value: number;
    currency: string;
  };
  condition: string;
  endTime: string;
  listingUrl: string;
  imageUrl: string;
  isAuction: boolean;
}

export async function addToWatchlist(item: WatchlistItem) {
  const supabase = createClientComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to add items to your watchlist');
  }

  const { error } = await supabase
    .from('watchlist')
    .insert({
      user_id: user.id,
      item_id: item.itemId,
      title: item.title,
      price_value: item.price.value,
      price_currency: item.price.currency,
      condition: item.condition,
      end_time: item.endTime,
      listing_url: item.listingUrl,
      image_url: item.imageUrl,
      is_auction: item.isAuction,
    });

  if (error) {
    throw new Error('Failed to add item to watchlist');
  }
}

export async function removeFromWatchlist(itemId: string) {
  const supabase = createClientComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to remove items from your watchlist');
  }

  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('item_id', itemId);

  if (error) {
    throw new Error('Failed to remove item from watchlist');
  }
}

export async function getWatchlist() {
  const supabase = createClientComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to view your watchlist');
  }

  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch watchlist');
  }

  return data.map((item) => ({
    itemId: item.item_id,
    title: item.title,
    price: {
      value: item.price_value,
      currency: item.price_currency,
    },
    condition: item.condition,
    endTime: item.end_time,
    listingUrl: item.listing_url,
    imageUrl: item.image_url,
    isAuction: item.is_auction,
  }));
} 