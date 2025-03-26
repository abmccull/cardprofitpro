import { NextResponse } from 'next/server';
import { initSocketServer } from '@/lib/websocket/server';

export async function GET(request: Request) {
  try {
    // @ts-ignore - NextJS doesn't expose the raw request object type
    initSocketServer(request);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error initializing socket server:', error);
    return NextResponse.json(
      { error: 'Failed to initialize socket server' },
      { status: 500 }
    );
  }
} 