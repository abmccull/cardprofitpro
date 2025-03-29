import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createLogger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase-admin';
import { getErrorMessage, createErrorResponse } from '@/lib/error-utils';

// Create a logger for this module
const logger = createLogger('api:users:sync');

// Transaction ID to track requests
const generateTransactionId = () => `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Counter to track the number of sync attempts
let syncAttempts = 0;
const MAX_SYNC_ATTEMPTS = 1000;
const RESET_INTERVAL = 60 * 60 * 1000; // 1 hour

// Rate limiter - resets the counter periodically
setInterval(() => {
  syncAttempts = 0;
}, RESET_INTERVAL);

export async function POST(request: Request) {
  // Implement rate limiting to prevent API flooding
  syncAttempts++;
  if (syncAttempts > MAX_SYNC_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many sync requests. Please try again later.' },
      { status: 429 }
    );
  }

  const transactionId = generateTransactionId();
  logger.debug(`Starting user sync [${transactionId}]`);
  
  try {
    // Try to get authenticated user from Clerk middleware
    let userId: string | null = null;

    // Method 1: Try to get user from auth() function
    try {
      const authResult = await auth();
      if (authResult.userId) {
        userId = authResult.userId;
        logger.debug(`Found user ID from auth() middleware: ${userId} [${transactionId}]`);
      }
    } catch (authError) {
      logger.debug(`Failed to get user from auth() middleware: ${authError} [${transactionId}]`);
    }

    // Method 2: Check for user ID in headers (passed explicitly by the client)
    if (!userId) {
      const clerkUserIdHeader = request.headers.get('X-Clerk-User-Id');
      if (clerkUserIdHeader) {
        userId = clerkUserIdHeader;
        logger.debug(`Found user ID from request header: ${userId} [${transactionId}]`);
      }
    }

    // Method 3: Try to get current user (fallback)
    if (!userId) {
      try {
        const user = await currentUser();
        if (user) {
          userId = user.id;
          logger.debug(`Found user ID from currentUser(): ${userId} [${transactionId}]`);
        }
      } catch (currentUserError) {
        logger.debug(`Failed to get from currentUser(): ${currentUserError} [${transactionId}]`);
      }
    }
    
    // If we still don't have a user ID, return unauthorized
    if (!userId) {
      logger.warn(`No authenticated user found [${transactionId}]`);
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }
    
    // At this point we have a valid user ID
    const clerkId = userId;
    
    logger.debug(`Processing sync for clerk_id: ${clerkId} [${transactionId}]`);
    
    // Debug environment variables
    logger.debug(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'not found'} [${transactionId}]`);
    logger.debug(`SERVICE_ROLE_KEY found: ${Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)} [${transactionId}]`);
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      logger.error(`Missing NEXT_PUBLIC_SUPABASE_URL [${transactionId}]`);
      return createErrorResponse(
        'Server configuration error: Missing Supabase URL',
        'NEXT_PUBLIC_SUPABASE_URL environment variable is not set',
        500
      );
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error(`Missing SUPABASE_SERVICE_ROLE_KEY [${transactionId}]`);
      return createErrorResponse(
        'Server configuration error: Missing Supabase service key',
        'SUPABASE_SERVICE_ROLE_KEY environment variable is not set',
        500
      );
    }
    
    // Get more user details from Clerk if available
    let user = null;
    try {
      user = await currentUser();
    } catch (error) {
      logger.debug(`Could not fetch detailed user info: ${getErrorMessage(error)} [${transactionId}]`);
      // Continue anyway - we can create a basic user record with just the ID
    }
    
    // Use our admin client singleton instead of creating a new client every time
    let supabase;
    try {
      supabase = createAdminClient();
      logger.debug(`Admin client initialized successfully [${transactionId}]`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error(`Failed to initialize Supabase client [${transactionId}]: ${errorMessage}`);
      return createErrorResponse(
        'Failed to initialize database connection',
        errorMessage,
        500
      );
    }
    
    // First check if a mapping already exists
    const { data: existingUser, error: queryError } = await supabase
      .from('users')
      .select('id, clerk_id, email, name')
      .eq('clerk_id', clerkId)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') {
      logger.error(`Error checking user existence [${transactionId}]: ${queryError.message}`);
      return createErrorResponse(
        'Database query failed',
        queryError.message,
        500
      );
    }
    
    // User exists, update if needed and return their ID
    if (existingUser) {
      // Ensure existingUser is properly typed
      const typedUser = existingUser as { 
        id: string; 
        clerk_id: string; 
        email: string | null; 
        name: string | null 
      };
      
      // Update user details if they've changed in Clerk
      if (user) {
        const currentEmail = user.emailAddresses[0]?.emailAddress;
        const currentName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        
        // Only update if email or name has changed
        if ((currentEmail && currentEmail !== typedUser.email) ||
            (currentName && currentName !== typedUser.name)) {
          
          logger.debug(`Updating user details [${transactionId}]`);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: currentEmail || typedUser.email,
              name: currentName || typedUser.name,
              updated_at: new Date().toISOString()
            })
            .eq('id', typedUser.id);
            
          if (updateError) {
            logger.warn(`Failed to update user details [${transactionId}]: ${updateError.message}`);
            // Continue anyway since we have the user ID
          }
        }
      }
      
      logger.info(`User found, returning existing user [${transactionId}]`, { 
        id: typedUser.id, 
        clerk_id: typedUser.clerk_id 
      });
      
      return NextResponse.json({
        success: true,
        data: {
          id: typedUser.id, 
          clerk_id: typedUser.clerk_id,
          email: typedUser.email,
          name: typedUser.name,
          isNew: false
        }
      });
    }
    
    // If we got here, we need to create the user
    logger.debug(`Creating new user [${transactionId}]`);
    
    const email = user?.emailAddresses[0]?.emailAddress || null;
    const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : null;
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_id: clerkId,
        email,
        name,
        role: 'user', // default role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      logger.error(`Error creating user [${transactionId}]: ${insertError.message}`);
      return createErrorResponse(
        'Failed to create user',
        insertError.message,
        500
      );
    }
    
    logger.info(`User created successfully [${transactionId}]`, { 
      id: newUser.id, 
      clerk_id: newUser.clerk_id 
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id, 
        clerk_id: newUser.clerk_id,
        email: newUser.email,
        name: newUser.name,
        isNew: true
      }
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error(`Unexpected error in user sync [${transactionId}]: ${errorMessage}`);
    return createErrorResponse(
      'Internal server error',
      errorMessage,
      500
    );
  }
} 