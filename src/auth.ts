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

export const { handlers, auth, signIn, signOut } = nextAuthInstance as any;

export const { GET, POST } = handlers as any;
