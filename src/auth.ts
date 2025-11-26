import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Use Node runtime for NextAuth handlers because Prisma, bcrypt, and
// other server libs rely on Node APIs not available in the Edge runtime.
export const runtime = 'nodejs';

// Validate that required secrets are set in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. Please add it to your environment variables in production.'
  );
}

// Initialize NextAuth with our `authOptions` and re-export helpers.
// This returns `{ handlers, auth, signIn, signOut }`.
let nextAuthInstance: any;
try {
  nextAuthInstance = NextAuth(authOptions as any);
} catch (error) {
  console.error('Failed to initialize NextAuth:', error);
  throw error;
}

const { handlers, auth: authFn, signIn, signOut } = nextAuthInstance as any;

// Export auth function for server-side usage
export { signIn, signOut };
export const auth = authFn;

// Create wrapper handlers to avoid bundling issues with re-exports
export async function GET(request: any, context: any) {
  try {
    console.log('[Auth GET] Request received');
    const response = await handlers.GET(request, context);
    console.log('[Auth GET] Response status:', response?.status || 'unknown');
    return response;
  } catch (error) {
    console.error('[Auth GET] Handler error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Re-throw to let Vercel handle the error response
    throw error;
  }
}

export async function POST(request: any, context: any) {
  try {
    console.log('[Auth POST] Request received');
    const response = await handlers.POST(request, context);
    console.log('[Auth POST] Response status:', response?.status || 'unknown');
    return response;
  } catch (error) {
    console.error('[Auth POST] Handler error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Re-throw to let Vercel handle the error response
    throw error;
  }
}
