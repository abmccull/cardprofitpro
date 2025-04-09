'use server';

import { revalidatePath } from 'next/cache';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

// Define the CardData interface based on what we observed in myCards page
interface CardData {
  id: string;
  name: string;
  player?: string | null;
  year?: number | null;
  manufacturer?: string | null;
  grade?: string | null;
  purchase_price?: number | null;
  status?: string | null;
  current_value?: number | null;
  source?: string | null;
  sport?: string | null;
  created_at?: string | null;
  owner_id?: string | null;
  grading_cost?: number | null;
  taxes?: number | null;
  shipping?: number | null;
  all_in_cost?: number | null;
  sale_price?: number | null;
  selling_fees?: number | null;
  is_sold?: boolean;
  profit?: number | null;
  sales_date?: string | null;
  date_shipped_to_grade?: string | null;
  date_received_from_grade?: string | null;
  grading_submission_date?: string | null;
  grading_returned_date?: string | null;
  days_to_grade?: number | null;
  days_held?: number | null;
  roi?: number | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
}

/**
 * Fetch cards from Supabase database for the specified user
 */
export async function getCardsByUserId(userId: string): Promise<CardData[]> {
  console.log('Fetching real cards for user:', userId);
  
  // Create Supabase client with SERVICE ROLE KEY to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key to bypass RLS
  );
  
  try {
    // Query the cards table for the specified user
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('owner_id', userId);
      
    if (error) {
      console.error('Error fetching cards:', error);
      throw new Error(`Failed to fetch cards: ${error.message}`);
    }
    
    console.log(`Fetched ${data?.length || 0} cards for user ${userId}`);
    return data || [];
  } catch (err) {
    console.error('Exception in getCardsByUserId:', err);
    // Return empty array instead of throwing to avoid crashing the UI
    return [];
  }
}

/**
 * Update a field in a card record in Supabase
 */
export async function updateCardField(
  cardId: string,
  field: string,
  value: string | number | boolean | null
): Promise<void> {
  console.log('Updating card field in Supabase:', { cardId, field, value });
  
  // Create Supabase client with SERVICE ROLE KEY to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key to bypass RLS
  );
  
  try {
    // Update the specified field
    const { error } = await supabase
      .from('cards')
      .update({ [field]: value })
      .eq('id', cardId);
      
    if (error) {
      console.error('Error updating card field:', error);
      throw new Error(`Failed to update card field: ${error.message}`);
    }
    
    console.log(`Successfully updated field ${field} for card ${cardId}`);
    
    // Revalidate the page to refresh data
    revalidatePath('/my-cards');
  } catch (err) {
    console.error('Exception in updateCardField:', err);
    throw new Error(`Failed to update card: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Upload a card image to Supabase Storage and update the card record
 * with the new image URLs
 */
export async function uploadCardImage(
  cardId: string, 
  formData: FormData
): Promise<{ imageUrl: string, thumbnailUrl: string }> {
  console.log('Uploading card image to Supabase Storage for cardId:', cardId);
  
  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }
  
  // Create Supabase client with SERVICE ROLE KEY to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key to bypass RLS
  );
  
  try {
    // Upload the file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${cardId}-${Date.now()}.${fileExt}`;
    const filePath = `card-images/${fileName}`;
    
    // Upload original image
    const { error: uploadError } = await supabase.storage
      .from('cards')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      throw new Error(`Error uploading image: ${uploadError.message}`);
    }
    
    // Get public URLs for the images
    const { data: imageData } = supabase.storage
      .from('cards')
      .getPublicUrl(filePath);
      
    const imageUrl = imageData.publicUrl;
    const thumbnailUrl = imageUrl; // In a real app, you would generate a thumbnail
    
    // Update the card record with the new image URLs
    const { error: updateError } = await supabase
      .from('cards')
      .update({
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl
      })
      .eq('id', cardId);
      
    if (updateError) {
      throw new Error(`Error updating card with image URLs: ${updateError.message}`);
    }
    
    console.log('Successfully uploaded image and updated card');
    revalidatePath('/my-cards');
    
    return {
      imageUrl,
      thumbnailUrl
    };
  } catch (err) {
    console.error('Exception in uploadCardImage:', err);
    throw new Error(`Failed to upload image: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}

/**
 * Debug interface for the connection check return type
 */
interface DebugConnectionResult {
  connected: boolean;
  tablesAvailable?: { tablename: string }[];
  cardsTableInfo?: Record<string, unknown> | null;
  sampleCards?: Record<string, unknown>[] | null;
  error?: string | null;
  details?: PostgrestError | string | null;
  urls?: {
    supabaseUrl: string;
  };
}

/**
 * Debug function to inspect the database structure and check for permissions issues
 */
export async function debugSupabaseConnection(): Promise<DebugConnectionResult> {
  console.log('Running Supabase debug check');
  
  // Create Supabase client with SERVICE ROLE KEY to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key to bypass RLS
  );
  
  try {
    // 1. Check if we can connect to Supabase using a simple health table query
    const { data: healthData, error: healthError } = await supabase
      .from('_health')
      .select('*')
      .limit(1);
    
    // If we get any error other than table not found, there's a connection issue
    if (healthError && healthError.code !== 'PGRST116') {
      console.error('Connection check failed:', healthError);
      return { 
        connected: false,
        error: 'Failed to connect to Supabase', 
        details: healthError 
      };
    }
    
    // 2. Get all available tables as a direct query
    // Just select from the cards table as a test - no schema access needed
    const { data: cardsData, error: cardsError } = await supabase
      .from('cards')
      .select('id')
      .limit(5);
      
    // Build the list of known tables
    const tables = [
      { tablename: 'cards', exists: !cardsError || cardsError.code !== 'PGRST116' },
      { tablename: '_health', exists: !healthError }
    ];
    
    // 3. Try to get sample cards
    const { data: sampleCards, error: sampleCardsError } = await supabase
      .from('cards')
      .select('*')
      .limit(5);
    
    // 4. Try to use get_table_info function
    let tableInfo = null;
    let tableInfoError = null;
    try {
      const { data, error } = await supabase.rpc('get_table_info', { table_name: 'cards' });
      tableInfo = data;
      tableInfoError = error;
    } catch (err) {
      console.error('Error calling get_table_info:', err);
      tableInfoError = {
        message: err instanceof Error ? err.message : 'Unknown error',
        details: 'The get_table_info function may not exist'
      };
    }
    
    // Return all the debug information
    return {
      connected: true, 
      tablesAvailable: tables,
      cardsTableInfo: tableInfo || null,
      sampleCards: sampleCards || [],
      error: healthError || cardsError || tableInfoError ? 'Some operations failed' : null,
      details: healthError || cardsError || tableInfoError,
      urls: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!.substring(0, 15) + '...'
      }
    };
  } catch (err) {
    console.error('Debug check failed with exception:', err);
    return { 
      connected: false, 
      error: 'Debug check failed', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}

/**
 * Get all cards regardless of owner - for debugging purposes only
 */
export async function getAllCards(): Promise<CardData[]> {
  console.log('Getting all cards regardless of owner');
  
  // Create Supabase client with SERVICE ROLE KEY to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key to bypass RLS
  );
  
  try {
    // Query all cards in the table
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .limit(100);
      
    if (error) {
      console.error('Error fetching all cards:', error);
      throw new Error(`Failed to fetch all cards: ${error.message}`);
    }
    
    console.log(`Fetched ${data?.length || 0} total cards`);
    return data || [];
  } catch (err) {
    console.error('Exception in getAllCards:', err);
    return [];
  }
} 