import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  '/dashboard/(.*)',
  '/my-cards/(.*)',
  '/active-bidding/(.*)',
  '/psa/(.*)',
  '/analytics/(.*)',
  '/card-discovery/(.*)',
  '/watchlist/(.*)',
  '/va-management/(.*)',
  '/settings/(.*)',
  '/profile/(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const session = await auth();
    session.protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
