import { NextResponse, type NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
// Import from @supabase/ssr
import { createServerClient, type CookieOptions } from '@supabase/ssr'

const isPublicRoute = createRouteMatcher(['/', '/login', '/auth/(.*)', '/api/webhook/(.*)', '/api/auth/(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  
  // Check if the route is public, if so, skip Supabase session handling
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }
  
  // Prepare response object early to handle cookie setting
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // For protected routes, proceed with Supabase session check/refresh
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Use the prepared response object to set the cookie
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Use the prepared response object to delete the cookie
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Attempt to get session to refresh it if needed
  await supabase.auth.getUser()

  // Return the response object which now potentially has updated cookies
  return response;
});

// Define a matcher for the middleware
export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|images|api/webhook/clerk).*)',
    // Match all API routes except the clerk webhook
    '/api/:path*',
  ],
}; 