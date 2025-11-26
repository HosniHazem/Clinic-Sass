import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Custom session endpoint that directly calls NextAuth's auth() function
 * This bypasses the route handler bundling issue and provides better error logging
 */
export async function GET(request: Request) {
  try {
    // Pass the incoming Request to auth() so it can read cookies/context
    const session = await auth(request as any);

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

    // TEMPORARY: return verbose error details to help debugging on prod
    // Remove or limit this once issue is identified
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
