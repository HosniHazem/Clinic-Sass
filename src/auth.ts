import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

const prisma = new PrismaClient();

// Types are declared centrally in `src/types/next-auth.d.ts`.
// Keep runtime auth logic in this file; do not redeclare module augmentations here.

// Define types for auth callbacks
interface SessionCallbackParams {
  session: any;
  token: any;
}

interface JwtCallbackParams {
  token: any;
  user: any;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  debug: process.env.NODE_ENV === 'development',
  trustHost: true,
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async session({ session, token }: SessionCallbackParams) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.clinicId = token.clinicId as string | null;
        session.user.clinicName = token.clinicName as string | null;
      }
      return session;
    },
    async jwt({ token, user }: JwtCallbackParams) {
      if (user) {
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.clinicName = user.clinicName;
      }
      return token;
    }
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
        async authorize(credentials: any) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { clinic: true }
          });

          if (!user || !user.password) {
            return null;
          }

          const isValid = await compare(credentials.password, user.password);

          if (!isValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0],
            role: user.role,
            clinicId: user.clinicId,
            clinicName: user.clinic?.name || undefined
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ]
});

export const { GET, POST } = handlers;
