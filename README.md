This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, ensure all environment variables are properly set in the `.env` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key 

# OpenAI
OPENAI_API_KEY=your_openai_api_key
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project is organized as follows:

- `/src/app` - Main application routes using Next.js App Router
  - `/(auth)` - Authentication-related pages (sign-in, sign-up)
  - `/(dashboard)` - Protected dashboard pages for authenticated users
  - `/api` - Backend API endpoints
- `/src/components` - Reusable UI components
- `/src/contexts` - React context providers (auth-context, etc.)
- `/src/lib` - Utility functions and singleton patterns
- `/public` - Static assets

## Authentication System

This project uses a dual authentication system:

1. **Clerk** - Primary authentication provider for user sessions
2. **Supabase** - Database and storage provider

The authentication flow involves:
1. User authenticates with Clerk
2. User data is synchronized to Supabase via `/api/users/sync` endpoint
3. Supabase ID is stored in the auth context for database operations

## Common Issues and Troubleshooting

### Authentication Issues

1. **Multiple Supabase Client Instances**
   - The application uses singleton patterns to prevent multiple instances
   - Always use the client exported from `/src/lib/supabase-admin.ts` for admin operations
   - Regular client operations should use the client from `/src/lib/supabase.ts`

2. **Environment Variables**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is correctly set for admin operations
   - Public API keys should be prefixed with `NEXT_PUBLIC_`
   - After updating env variables, restart the development server completely

3. **User Synchronization Failures**
   - Check logs for specific errors in `/api/users/sync` endpoint
   - The sync endpoint uses the Clerk user ID to link accounts

### Build and Caching Issues

1. **Webpack Caching Errors**
   - If you encounter `ENOENT: no such file or directory` errors with Webpack cache:
   ```bash
   # Clear Next.js cache
   rm -rf .next/cache
   # or on Windows
   Remove-Item -Recurse -Force .next/cache
   ```

2. **Module Resolution Issues**
   - If you get "Cannot find module" errors, try:
   ```bash
   # Clear the build completely
   rm -rf .next
   # or on Windows
   Remove-Item -Recurse -Force .next
   ```

### TypeScript and Linting

1. **Type Safety with External APIs**
   - Use proper type assertions when working with external APIs
   - For Supabase data, define database types in `/src/types/database.types.ts`
   
2. **Common Type Issues**
   - Avoid using `any` - prefer `unknown` with type guards
   - For error handling, use proper error typing patterns:
   ```typescript
   try {
     // code
   } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : String(error);
     // handle error
   }
   ```

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

When deploying, ensure all environment variables are properly configured in your deployment platform.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
