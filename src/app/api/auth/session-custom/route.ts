import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Custom session endpoint that directly calls NextAuth's auth() function
 * This bypasses the route handler bundling issue and provides better error logging
 */
export async function GET(request: Request) {
  try {
    // Call the NextAuth auth() function directly to get the current session
    const session = await auth();
    
    if (!session) {
      // Not logged in - return empty session
      return NextResponse.json({}, { status: 200 });
    }
    
    // Return the session
    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error('[Session Endpoint Error]', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    // Return 500 with error details in development, generic error in production
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
