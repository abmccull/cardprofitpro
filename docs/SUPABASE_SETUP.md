# Supabase Database Setup Guide

This guide explains how to set up and initialize the Supabase database for the CardProfitPro application.

## Prerequisites

- Supabase account with a project created
- Node.js installed on your system
- Access to the project's environment variables

## Setup Process

### 1. Environment Variables

Ensure you have the following environment variables configured in your `.env` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Initialization

You can initialize your database in two ways:

#### A. Using the Setup Script

Run the provided script that will create all necessary tables and functions:

```bash
node scripts/setup-database.js
```

This script will:
- Create the `_health` table for health checks
- Create a `get_table_info` function for retrieving table structure
- Create the `cards` table if it doesn't exist
- Set up triggers for automatic timestamp updates

#### B. Manual SQL Setup

If you prefer to set up the database manually, you can run the following SQL commands in the Supabase SQL Editor:

```sql
-- Create health check table
CREATE TABLE IF NOT EXISTS public._health (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health record
INSERT INTO public._health (status) VALUES ('ok');

-- Create function to get table information
CREATE OR REPLACE FUNCTION get_table_info(table_name TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'is_nullable', is_nullable,
      'column_default', column_default
    )
  ) INTO result
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = $1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  player TEXT,
  year INTEGER,
  manufacturer TEXT,
  grade TEXT,
  grading_company TEXT,
  purchase_price NUMERIC,
  status TEXT,
  image_url TEXT,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_graded BOOLEAN DEFAULT FALSE,
  sport TEXT,
  buying_format TEXT,
  location TEXT,
  is_sold BOOLEAN DEFAULT FALSE,
  selling_fees NUMERIC,
  sales_price NUMERIC,
  purchase_link TEXT,
  source TEXT
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cards_updated_at ON public.cards;
CREATE TRIGGER update_cards_updated_at
BEFORE UPDATE ON public.cards
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

## Verifying Setup

After running the setup script or manual SQL commands, you should be able to:

1. Navigate to the `/debug` page in your application
2. See a successful connection to Supabase
3. View the list of available tables
4. See the structure of the cards table

## Common Issues

### 1. Missing Tables

If you see errors about missing tables, ensure that:
- You have run the setup script
- You have proper permissions in your Supabase project
- Your service role key has sufficient privileges

### 2. Authentication Issues

If you're unable to authenticate:
- Check that the JWT configuration is correct
- Verify that the Clerk and Supabase integration is properly set up
- Ensure your Supabase anon key has the necessary permissions

### 3. Connection Failed

If you see "Failed to connect to Supabase":
- Verify your Supabase URL and keys
- Check for network issues
- Ensure your Supabase project is active

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Next.js API Reference](https://nextjs.org/docs/api-reference)
- [Clerk Authentication](https://clerk.dev/docs) 