// A script to set up the required database tables in Supabase
// Run this script with Node.js to initialize your database
// Usage: node scripts/setup-database.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to load .env file from project root
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Supabase connection details from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role key for admin privileges

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or key not found in environment variables');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('Starting database setup...');

  try {
    // 1. Create a _health table for health checks
    console.log('Creating _health table...');
    
    // Use the query builder instead of RPC or SQL
    const { error: healthTableError } = await supabase
      .from('_health')
      .select('*')
      .limit(1)
      .single();
    
    if (healthTableError && healthTableError.code === 'PGRST116') {
      console.log('_health table does not exist, creating it...');
      
      // Use REST API calls instead of direct SQL
      await supabase.auth.admin.createTable({
        name: '_health',
        columns: [
          { name: 'id', type: 'serial', primaryKey: true },
          { name: 'status', type: 'text', notNull: true },
          { name: 'last_checked', type: 'timestamp with time zone', default: 'now()' }
        ]
      }).catch(err => {
        console.error('Error creating _health table with REST API:', err);
      });
      
    } else if (healthTableError) {
      console.error('Error checking _health table:', healthTableError);
    } else {
      console.log('_health table already exists');
    }

    // 2. Insert initial health record if table is empty
    const { data: healthRecords, error: healthQueryError } = await supabase
      .from('_health')
      .select('*')
      .limit(1);

    if (!healthQueryError && (!healthRecords || healthRecords.length === 0)) {
      const { error: insertError } = await supabase
        .from('_health')
        .insert({ status: 'ok' });
      
      if (insertError) {
        console.error('Error inserting health record:', insertError);
      } else {
        console.log('Inserted initial health record');
      }
    }

    // 3. Check if the cards table exists
    const { data: cardsCheck, error: cardsCheckError } = await supabase
      .from('cards')
      .select('id')
      .limit(1);
    
    if (cardsCheckError && cardsCheckError.code === 'PGRST116') {
      console.log('Cards table does not exist, creating it...');
      
      // Create cards table using REST API
      await supabase.auth.admin.createTable({
        name: 'cards',
        columns: [
          { name: 'id', type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
          { name: 'name', type: 'text', notNull: true },
          { name: 'player', type: 'text' },
          { name: 'year', type: 'integer' },
          { name: 'manufacturer', type: 'text' },
          { name: 'grade', type: 'text' },
          { name: 'grading_company', type: 'text' },
          { name: 'purchase_price', type: 'numeric' },
          { name: 'status', type: 'text' },
          { name: 'image_url', type: 'text' },
          { name: 'owner_id', type: 'text', notNull: true },
          { name: 'created_at', type: 'timestamp with time zone', default: 'now()' },
          { name: 'updated_at', type: 'timestamp with time zone', default: 'now()' },
          { name: 'is_graded', type: 'boolean', default: false },
          { name: 'sport', type: 'text' },
          { name: 'buying_format', type: 'text' },
          { name: 'location', type: 'text' },
          { name: 'is_sold', type: 'boolean', default: false },
          { name: 'selling_fees', type: 'numeric' },
          { name: 'sales_price', type: 'numeric' },
          { name: 'purchase_link', type: 'text' },
          { name: 'source', type: 'text' }
        ]
      }).catch(err => {
        console.error('Error creating cards table with REST API:', err);
      });
    } else if (cardsCheckError) {
      console.error('Error checking cards table:', cardsCheckError);
    } else {
      console.log('Cards table already exists');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Unexpected error during database setup:', error);
  }
}

setupDatabase()
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  }); 