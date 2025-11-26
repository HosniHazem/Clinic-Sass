import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// Use Node runtime for NextAuth handlers because Prisma, bcrypt, and
// other server libs rely on Node APIs not available in the Edge runtime.
export const runtime = 'nodejs';

// Initialize NextAuth with our `authOptions` and re-export helpers.
// This returns `{ handlers, auth, signIn, signOut }`.
const nextAuthInstance = NextAuth(authOptions as any);

export const { handlers, auth, signIn, signOut } = nextAuthInstance as any;

export const { GET, POST } = handlers as any;
