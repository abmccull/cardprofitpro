import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Create a matcher for protected routes
const isProtectedRoute = createRouteMatcher([
  '/dashboard/(.*)',
  '/my-cards/(.*)',
  '/active-bidding/(.*)',
  '/psa/(.*)',
  '/analytics/(.*)',
  '/card-discovery/(.*)',
  '/watchlist/(.*)',
  '/va-management/(.*)',
  '/deal-analyzer/(.*)',
  '/card-lifecycle/(.*)',
  '/transactions/(.*)',
  '/settings/(.*)',
  '/profile/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // Skip Supabase sync for public routes
  if (!isProtectedRoute(req)) {
    return res;
  }

  // Get user ID from auth
  const { userId } = await auth();

  // If the user is not signed in, continue
  if (!userId) {
    return res;
  }

  // Get Supabase client
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Check if user exists in Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError) {
      // Only create a new user if the error is that the user wasn't found
      if (userError.code === 'PGRST116') {
        console.log('User not found in Supabase, creating new user with clerk_id:', userId);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            clerk_id: userId,
            email: req.headers.get('x-clerk-email') || '',
            name: req.headers.get('x-clerk-user-name') || '',
            role: 'user'
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating user in middleware:', createError);
          // Don't throw, just log and continue
          return res;
        }

        console.log('Successfully created new user with id:', newUser?.id);
      } else {
        console.error('Error looking up user in middleware:', userError);
        // Don't throw, just log and continue
        return res;
      }
    } else {
      console.log('Found existing user with clerk_id:', userId);
    }
  } catch (error) {
    console.error('Error in middleware:', error);
    // Don't throw, just log and continue
  }

  return res;
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}; 