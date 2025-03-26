import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { currentUser } from '@clerk/nextjs/server';

// This API route handles user operations using the Supabase admin (service role) client
export async function POST(request: Request) {
  try {
    console.log("🔄 API Route: /api/users POST request received");
    
    // Authenticate with Clerk
    const user = await currentUser();
    if (!user) {
      console.log("❌ API Route: No authenticated user found");
      return NextResponse.json({ error: 'Unauthorized', details: 'No authenticated user found' }, { status: 401 });
    }
    
    console.log("✅ API Route: User authenticated with Clerk", { 
      userId: user.id,
      email: user.emailAddresses?.[0]?.emailAddress
    });

    // Get request body
    const body = await request.json();
    const { action } = body;
    console.log("📝 API Route: Request action", { action });

    // Check if we have the required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("❌ API Route: Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing Supabase URL' },
        { status: 500 }
      );
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ API Route: Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing Supabase service role key' },
        { status: 500 }
      );
    }

    // Create Supabase admin client to bypass RLS
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      console.log("✅ API Route: Supabase client created successfully");

      if (action === 'sync') {
        console.log("🔄 API Route: Syncing user with clerk_id:", user.id);
        
        // Check if user exists in Supabase
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('clerk_id', user.id)
          .single();
        
        if (userError) {
          console.log("⚠️ API Route: User lookup error", { 
            code: userError.code, 
            message: userError.message,
            details: userError.details
          });
          
          if (userError.code === 'PGRST116') {
            console.log("ℹ️ API Route: User not found, creating new user");
            
            // User not found, create a new one
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                clerk_id: user.id,
                email: user.emailAddresses[0]?.emailAddress || '',
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                role: 'user'
              })
              .select('id, email, name')
              .single();
            
            if (createError) {
              console.error("❌ API Route: Error creating user", {
                code: createError.code,
                message: createError.message,
                details: createError.details
              });
              
              return NextResponse.json(
                { 
                  error: 'Failed to create user', 
                  details: createError,
                  message: createError.message,
                  code: createError.code
                },
                { status: 500 }
              );
            }
            
            console.log("✅ API Route: New user created successfully", newUser);
            return NextResponse.json({ user: newUser, created: true });
          } else {
            console.error("❌ API Route: Error finding user", {
              code: userError.code,
              message: userError.message,
              details: userError.details
            });
            
            return NextResponse.json(
              { 
                error: 'Error finding user', 
                details: userError,
                message: userError.message,
                code: userError.code
              },
              { status: 500 }
            );
          }
        }
        
        console.log("✅ API Route: Found existing user", userData);
        return NextResponse.json({ user: userData, created: false });
      }
      
      console.log("⚠️ API Route: Invalid action requested", { action });
      return NextResponse.json(
        { error: 'Invalid action', details: `Action '${action}' is not supported` },
        { status: 400 }
      );
    } catch (supabaseError: any) {
      console.error("❌ API Route: Supabase client error", {
        message: supabaseError.message,
        stack: supabaseError.stack
      });
      
      return NextResponse.json(
        { 
          error: 'Supabase client error', 
          details: supabaseError.message
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ API Route: Unhandled error in users API", {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
} 