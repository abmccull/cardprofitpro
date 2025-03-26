import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createLogger } from '@/lib/logger';

// Create a logger for this module
const logger = createLogger('api:users:sync');

// Transaction ID to track requests
const generateTransactionId = () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export async function POST(request: Request) {
  const transactionId = generateTransactionId();
  logger.debug(`Starting user sync [${transactionId}]`);
  
  try {
    const body = await request.json();
    const { clerkId } = body;
    
    if (!clerkId) {
      logger.warn(`Missing clerkId in request body [${transactionId}]`);
      return logger.apiError('Missing clerkId in request body', null, 400);
    }
    
    logger.debug(`Processing sync for clerk_id: ${clerkId} [${transactionId}]`);
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      logger.error(`Missing NEXT_PUBLIC_SUPABASE_URL [${transactionId}]`);
      return logger.apiError('Server configuration error: Missing Supabase URL', null, 500);
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error(`Missing SUPABASE_SERVICE_ROLE_KEY [${transactionId}]`);
      return logger.apiError('Server configuration error: Missing Supabase service key', null, 500);
    }
    
    // Use service role client to bypass RLS policies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Use our stored procedure to create or find the user in a single operation
    logger.debug(`Calling create_user_if_not_exists procedure [${transactionId}]`);
    const { data, error } = await supabase
      .rpc('create_user_if_not_exists', {
        clerk_id_param: clerkId,
        email_param: null
      });
    
    if (error) {
      logger.error(`Error from stored procedure [${transactionId}]`, error);
      
      // If the stored procedure fails, we'll try the old approach
      logger.debug(`Fallback to manual user check/create [${transactionId}]`);
      
      // First check if a mapping already exists
      const { data: existingUser, error: queryError } = await supabase
        .from('users')
        .select('id, clerk_id')
        .eq('clerk_id', clerkId)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') {
        logger.error(`Error checking user existence [${transactionId}]`, queryError);
        return logger.apiError('Database query failed', queryError, 500);
      }
      
      // User exists, return their ID
      if (existingUser) {
        logger.info(`User found, returning existing user [${transactionId}]`, { 
          id: existingUser.id, 
          clerk_id: existingUser.clerk_id 
        });
        return logger.apiSuccess({
          id: existingUser.id, 
          clerk_id: existingUser.clerk_id,
          isNew: false
        });
      }
      
      // If we got here, we need to create the user but hit an issue
      // Try to disable RLS temporarily
      logger.debug(`Attempting to disable RLS [${transactionId}]`);
      const { error: disableRlsError } = await supabase.rpc('disable_rls_for_transaction');
      
      if (disableRlsError) {
        logger.error(`Failed to disable RLS [${transactionId}]`, disableRlsError);
        return logger.apiError(
          'Cannot create user due to database permissions. Please contact support.',
          error,
          500
        );
      }
      
      // Create the user with RLS disabled
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (insertError) {
        logger.error(`Error creating user [${transactionId}]`, insertError);
        return logger.apiError('Failed to create user', insertError, 500);
      }
      
      logger.info(`User created successfully (fallback method) [${transactionId}]`, { 
        id: newUser.id, 
        clerk_id: newUser.clerk_id 
      });
      
      return logger.apiSuccess({
        id: newUser.id, 
        clerk_id: newUser.clerk_id,
        isNew: true
      });
    }
    
    // The stored procedure worked! Check the result format
    if (!data || data.length === 0) {
      logger.error(`Empty result from stored procedure [${transactionId}]`);
      return logger.apiError('Database procedure returned no results', null, 500);
    }
    
    const userData = data[0] || data; // Handle array or object response
    
    logger.info(`User ${userData.is_new ? 'created' : 'found'} via stored procedure [${transactionId}]`, userData);
    
    return logger.apiSuccess({
      id: userData.id,
      clerk_id: userData.clerk_id,
      isNew: userData.is_new
    });
  } catch (error) {
    logger.error(`Unexpected error in user sync [${transactionId}]`, error);
    return logger.apiError('Internal server error', error, 500);
  }
} 