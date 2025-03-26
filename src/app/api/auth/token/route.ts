import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 401 }
      );
    }

    try {
      const token = await session.getToken({ template: 'supabase' });
      
      if (!token) {
        console.error('Failed to get Supabase token - JWT template returned null');
        return NextResponse.json(
          { error: 'JWT template error - token is null' },
          { status: 500 }
        );
      }

      return NextResponse.json({ token });
    } catch (tokenError: any) {
      console.error('JWT template error:', tokenError);
      
      if (tokenError?.status === 404) {
        return NextResponse.json(
          { 
            error: 'JWT template "supabase" not found or invalid - please check your Clerk dashboard',
            details: 'Visit Clerk Dashboard → JWT Templates → Create template named "supabase" with correct claims'
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: tokenError?.message || 'Failed to generate JWT token' },
        { status: tokenError?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in auth token route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: error?.status || 500 }
    );
  }
} 