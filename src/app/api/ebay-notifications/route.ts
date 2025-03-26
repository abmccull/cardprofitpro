import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// This should be stored securely in environment variables
const EBAY_VERIFICATION_TOKEN = process.env.EBAY_VERIFICATION_TOKEN || '';
const ENDPOINT_URL = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/ebay-notifications` : '';

export async function GET(request: NextRequest) {
  try {
    // Get the challenge code from the query parameters
    const challengeCode = request.nextUrl.searchParams.get('challenge_code');

    if (!challengeCode) {
      return NextResponse.json(
        { error: 'Challenge code is required' },
        { status: 400 }
      );
    }

    if (!EBAY_VERIFICATION_TOKEN || !ENDPOINT_URL) {
      return NextResponse.json(
        { error: 'Missing required environment variables' },
        { status: 500 }
      );
    }

    // Create the challenge response hash
    const hash = createHash('sha256');
    hash.update(challengeCode);
    hash.update(EBAY_VERIFICATION_TOKEN);
    hash.update(ENDPOINT_URL);
    const challengeResponse = hash.digest('hex');

    // Return the challenge response in the required format
    return NextResponse.json({ challengeResponse }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error processing eBay challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface EbayDeletionPayload {
  notification: {
    notificationId: string;
    eventDate: string;
    userId: string;
    username: string;
  };
}

async function logDeletionRequest(payload: EbayDeletionPayload) {
  try {
    await supabase.from('deletion_logs').insert({
      notification_id: payload.notification.notificationId,
      event_date: payload.notification.eventDate,
      ebay_user_id: payload.notification.userId,
      ebay_username: payload.notification.username,
      status: 'received'
    });
  } catch (error) {
    console.error('Error logging deletion request:', error);
    // Continue with deletion even if logging fails
  }
}

async function deleteUserData(userId: string) {
  const tables = ['profiles', 'tasks', 'messages', 'threads'];
  const errors: Error[] = [];

  for (const table of tables) {
    try {
      // Delete records associated with the eBay user ID
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('ebay_user_id', userId);

      if (error) {
        errors.push(new Error(`Error deleting from ${table}: ${error.message}`));
      }
    } catch (error) {
      errors.push(new Error(`Error deleting from ${table}: ${error}`));
    }
  }

  if (errors.length > 0) {
    throw new Error(`Errors during deletion: ${errors.map(e => e.message).join(', ')}`);
  }
}

async function updateDeletionLog(notificationId: string, status: 'completed' | 'failed', error?: string) {
  try {
    await supabase
      .from('deletion_logs')
      .update({ 
        status,
        completed_at: new Date().toISOString(),
        error_message: error
      })
      .eq('notification_id', notificationId);
  } catch (error) {
    console.error('Error updating deletion log:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as EbayDeletionPayload;
    
    // Log the notification for debugging
    console.log('Received eBay account deletion notification:', payload);

    // Log the deletion request
    await logDeletionRequest(payload);

    try {
      // Delete user data from all relevant tables
      await deleteUserData(payload.notification.userId);
      
      // Update deletion log with success status
      await updateDeletionLog(payload.notification.notificationId, 'completed');

      return NextResponse.json({ 
        status: 'success',
        message: 'User data deleted successfully'
      });
    } catch (error) {
      // Update deletion log with failure status
      await updateDeletionLog(
        payload.notification.notificationId,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );

      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error('Error processing eBay notification:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 