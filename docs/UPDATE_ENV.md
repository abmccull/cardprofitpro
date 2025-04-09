# Important: Update Your Environment Variables

To enable secure card updates, you need to add your Supabase service role key to your environment variables.

## Steps to Add the Service Role Key:

1. Go to your Supabase project dashboard
2. Navigate to Project Settings > API
3. Find the "Project API keys" section
4. Copy the "service_role key" (this is different from the anon key)
5. Add this line to your `.env` file:

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**IMPORTANT SECURITY NOTE**: The service role key bypasses Row Level Security (RLS) policies. It should NEVER be exposed to the client side. It's safe to use in API routes because they run on the server, but never include it in client-side code. 