# eBay Integration Module

This module provides eBay integration for Card Profit Pro using Clerk for authentication and Supabase for data storage.

## Architecture

### Authentication Flow

1. User authenticates with Clerk
2. Our app uses Clerk's userId to store/retrieve eBay tokens in Supabase
3. The connection between Clerk and Supabase is handled by the centralized `AuthContext`

### Database Schema

Two Supabase tables support this integration:

1. **ebay_tokens**
   - `user_id` (TEXT, Primary Key): Clerk user ID
   - `access_token` (TEXT): eBay OAuth access token
   - `refresh_token` (TEXT): eBay refresh token
   - `expires_at` (TIMESTAMP): Token expiration time
   - `ebay_user_id` (TEXT): eBay username
   - `created_at` (TIMESTAMP): When the connection was established

2. **user_sessions**
   - `user_id` (TEXT, Primary Key): Clerk user ID
   - `oauth_state` (TEXT): Random state for CSRF protection
   - `created_at` (TIMESTAMP): Session creation time
   - `updated_at` (TIMESTAMP): Session update time

### Components

- `ConnectEbayButton`: Initiates the eBay OAuth flow
- `DisconnectEbayButton`: Removes eBay connection
- `EbayIntegrationPage`: Main dashboard for eBay connection status

## Implementation Details

### Clerk Authentication

The integration uses Clerk for user authentication:

```typescript
// In components
const { isSignedIn, userId, supabase } = useAuth();

// The useAuth() hook provides:
// - Authentication state (isSignedIn)
// - User identity (userId)
// - Supabase client with proper auth headers
```

### Supabase Database Access

Data access follows this pattern:

```typescript
// Example from connect-ebay-button.tsx
const { supabase, userId } = useAuth();

// Store state in the database for verification
const { error } = await supabase
  .from('user_sessions')
  .upsert({
    user_id: userId,
    oauth_state: state,
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id'
  });
```

### eBay OAuth Flow

1. **Initiate connection**: Generate state, store in `user_sessions`, redirect to eBay
2. **Callback handling**: Validate state, exchange code for tokens, store in `ebay_tokens`
3. **Token usage**: Retrieve tokens from `ebay_tokens` when making eBay API calls

## Development Guidelines

1. **Always use the auth context**:
   ```typescript
   import { useAuth } from '@/contexts/auth-context';
   ```

2. **Never create new Supabase clients directly**:
   ❌ WRONG:
   ```typescript
   import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
   const supabase = createClientComponentClient();
   ```
   
   ✅ CORRECT:
   ```typescript
   const { supabase } = useAuth();
   ```

3. **Verify authentication before operations**:
   ```typescript
   if (!isSignedIn || !userId || !supabase) {
     // Handle unauthenticated state
     return;
   }
   ```

## Additional Resources

For more detailed information about the authentication setup, refer to:
- [/docs/auth-integration.mdc](/docs/auth-integration.mdc) 