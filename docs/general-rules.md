# Card Profit Pro Project Development Rules

This document outlines the essential rules and conventions for developing the Card Profit Pro application. Adhering to these rules ensures consistency, maintainability, and leverages the established architecture effectively.

## 1. Core Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Authentication:** Clerk (Native Integration)
- **Database:** Supabase (with Row Level Security)
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **Language:** TypeScript

*Rule: Always use the latest stable versions of these core technologies unless a specific reason prevents it.* 
*Rule: Do not introduce alternative libraries for core functionalities (e.g., different auth providers, ORMs, UI libraries) without explicit discussion and approval.*

## 2. Project Structure

- **Pages & Layouts:** Follow Next.js App Router conventions (`app/` directory).
- **Components:** Place reusable components in `src/components/`. Group related components within subdirectories (e.g., `src/components/ui/`, `src/components/cards/`).
- **Contexts:** Store React Context providers in `src/contexts/` (e.g., `auth-context.tsx`).
- **Utilities/Lib:** Place utility functions and library configurations in `src/lib/`.
- **Types:** Define shared TypeScript types in `src/types/`, especially database types in `database.types.ts`.
- **Server Actions:** Place Next.js Server Actions relevant to specific features within their feature directory (e.g., `src/app/(dashboard)/ebay-integration/actions.ts`).
- **Documentation:** Store project-level documentation in the root `/docs` directory.

*Rule: Maintain this structure for new features and components.* 

## 3. Naming Conventions

- **Files/Directories:** Use `kebab-case` (e.g., `auth-context.tsx`, `ebay-integration/`).
- **Components:** Use `PascalCase` for React component function names (e.g., `EbayIntegrationPage`).
- **Variables/Functions:** Use `camelCase` (e.g., `userId`, `getConnectionStatus`).
- **Types/Interfaces:** Use `PascalCase` (e.g., `AuthContextType`, `Database`).

*Rule: Strictly follow these naming conventions.* 

## 4. Component Design (React & Next.js)

- **Favor Server Components:** Use React Server Components (RSCs) by default for pages and data fetching.
- **Isolate Client Components:** Only use Client Components (`'use client';`) for features requiring browser APIs or interactivity (e.g., `useState`, `useEffect`, event handlers).
  - Keep Client Components small and focused.
  - Pass data down from Server Components where possible.
- **Loading & Error States:** Implement loading states (e.g., spinners, skeletons) and clear error messages for components involving data fetching or asynchronous operations.
- **Semantic HTML:** Use appropriate HTML5 elements (`<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, etc.) for accessibility and structure.

*Rule: Prioritize RSCs and minimize the scope of Client Components.* 
*Rule: Always include loading and error handling for async operations.* 

## 5. Authentication (Clerk + Supabase)

**This is the MOST CRITICAL section. Do NOT deviate.**

- **Provider:** Clerk is the SOLE authentication provider.
- **Integration:** Use the established **native integration** between Clerk and Supabase.
- **Client-Side Auth:**
  - Access auth state (`isSignedIn`, `userId`) and the Supabase client via the `useAuth` hook from `src/contexts/auth-context.tsx`.
  - **NEVER** create a new Supabase client directly in components using `createClientComponentClient` or similar.
  - The `AuthContext` correctly initializes the Supabase client with the Clerk token.
- **Server-Side Auth (Server Components & API Routes):**
  - Use `auth()` and `currentUser()` from `@clerk/nextjs/server` to get user information.
- **Middleware:**
  - The `src/middleware.ts` file MUST use `clerkMiddleware()` from `@clerk/nextjs/server`.
  - This middleware is essential for Clerk's server-side auth functions to work.
  - Do NOT add separate Supabase middleware logic; rely on the client initialization in `AuthContext` or server-side helpers.
- **Supabase Auth:** Do **NOT** use Supabase's built-in authentication features (email/password, magic links, etc.).

*Rule: Follow the exact patterns outlined in `/docs/auth-integration.mdc` for authentication in client components, server components, and API routes.* 
*Rule: NEVER change the core authentication flow or middleware setup.* 

## 6. State Management

- **Global State:** Use React Context (`AuthContext`) for authentication state.
- **Local State:** Use `useState` for component-level state.
- **Server State/Caching:** Consider using `@tanstack/react-query` (already installed) for managing server state, caching, and data fetching, especially for complex client-side data needs.

*Rule: Use the appropriate state management tool for the scope required.* 

## 7. Database (Supabase)

- **Client:** Access the Supabase client via the `useAuth` hook (client-side) or server-side helpers (`createServerComponentClient`, `createRouteHandlerClient`).
- **Types:** Utilize the generated types in `src/types/database.types.ts` for type safety when interacting with Supabase.
  - If types are missing for new tables, generate them using `supabase gen types typescript > src/types/database.types.ts`.
  - Temporarily use `(supabase as any)` with a clear comment ONLY if generated types are unavailable or incorrect, and create an issue to fix the types.
- **RLS:** Row Level Security is enabled. While current policies for `ebay_tokens` and `user_sessions` are temporarily permissive (`USING (TRUE)`), ensure application logic correctly filters by `user_id`. New tables should implement proper RLS policies based on `auth.uid()` (which maps to the Clerk `userId` via the native integration token).
- **Migrations:** Create SQL migration files for schema changes.

*Rule: Always use the provided Supabase client instances.* 
*Rule: Strive for type safety using generated types.* 
*Rule: Implement appropriate RLS policies for new tables.* 

## 8. Styling (TailwindCSS)

- **Utilities:** Primarily use TailwindCSS utility classes for styling.
- **Component Libraries:** Leverage `shadcn/ui` components and customize them using Tailwind utilities as needed.
- **Custom CSS:** Avoid custom CSS files unless absolutely necessary for complex styles not achievable with Tailwind.

*Rule: Prefer utility classes over custom CSS.* 

## 9. Error Handling

- **Async Operations:** Use `try...catch` blocks for database operations, API calls, and other asynchronous actions.
- **User Feedback:** Provide clear user feedback for errors using `sonner` or `react-toast` (already integrated).
- **Logging:** Log significant errors to the console for debugging.

*Rule: Implement robust error handling for all potentially failing operations.* 

## 10. Code Quality & Consistency

- **TypeScript:** Write strongly-typed code. Avoid `any` where possible, except for the temporary Supabase client casting mentioned above.
- **Readability:** Write clear, concise, and readable code. Add comments only for non-obvious logic.
- **ESLint/Prettier:** Follow the project's linting and formatting rules (ensure ESLint and Prettier are configured and run).
- **No TODOs:** Fully implement features. Do not leave `// TODO:` comments or placeholders.

*Rule: Prioritize code quality, type safety, and readability.* 