# Manual Database Setup for CardProfitPro

Since the automated setup script requires administrative privileges that may not be available through the JavaScript client, follow these manual steps to set up your Supabase database.

## Step 1: Access the SQL Editor

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. In the left sidebar, click on **SQL Editor**
4. Click **New Query** to create a new SQL script

## Step 2: Create Health Check Table

Copy and paste the following SQL into the editor, then click **Run**:

```sql
-- Create health check table
CREATE TABLE IF NOT EXISTS public._health (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial health record
INSERT INTO public._health (status) 
VALUES ('ok')
ON CONFLICT DO NOTHING;
```

## Step 3: Create Cards Table

Create the main cards table with the following SQL:

```sql
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
```

## Step 4: Create Updated Timestamp Trigger

Set up a trigger to automatically update the `updated_at` field:

```sql
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the cards table
DROP TRIGGER IF EXISTS update_cards_updated_at ON public.cards;
CREATE TRIGGER update_cards_updated_at
BEFORE UPDATE ON public.cards
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

## Step 5: Create Table Info Helper

Create a function to help with getting table information:

```sql
-- Create function to get table information
CREATE OR REPLACE FUNCTION get_table_info(table_name TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'column_name', a.attname,
      'data_type', format_type(a.atttypid, a.atttypmod),
      'is_nullable', CASE WHEN a.attnotnull THEN 'NO' ELSE 'YES' END,
      'column_default', pg_get_expr(d.adbin, d.adrelid)
    )
  ) INTO result
  FROM pg_attribute a
  LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
  WHERE a.attrelid = table_name::regclass 
    AND a.attnum > 0 
    AND NOT a.attisdropped;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Step 6: Enable UUID Extension

Ensure the UUID extension is enabled for generating unique IDs:

```sql
-- Make sure UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Step 7: Test the Setup

You can test that everything is working with:

```sql
-- Test the health table
SELECT * FROM public._health;

-- Test the cards table structure
SELECT get_table_info('cards');
```

## Step 8: Add Sample Card (Optional)

If you want to add a sample card for testing:

```sql
-- Insert a sample card
INSERT INTO public.cards (
  name, 
  player, 
  year, 
  manufacturer, 
  purchase_price, 
  status, 
  owner_id
)
VALUES (
  'Sample Basketball Card', 
  'Michael Jordan', 
  1986, 
  'Fleer', 
  150.00, 
  'Purchased', 
  'your-user-id-here'  -- Replace with your actual user ID
);
```

## Step 9: Set Up Row Level Security (Optional but Recommended)

Set up row-level security to protect your data:

```sql
-- Enable row level security
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own cards
CREATE POLICY "Users can view their own cards" 
  ON public.cards 
  FOR SELECT 
  USING (owner_id = auth.uid());

-- Create policy to allow users to insert their own cards
CREATE POLICY "Users can insert their own cards" 
  ON public.cards 
  FOR INSERT 
  WITH CHECK (owner_id = auth.uid());

-- Create policy to allow users to update their own cards
CREATE POLICY "Users can update their own cards" 
  ON public.cards 
  FOR UPDATE 
  USING (owner_id = auth.uid());
```

## Testing in Application

After completing these steps, restart your application and navigate to the `/debug` page to verify the database connection and table structure are working properly. 