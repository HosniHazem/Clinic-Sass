import NextAuth, { getServerSession, NextAuthOptions } from 'next-auth';
import { getAuthOptionsBase } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';

// Use Node runtime for NextAuth handlers
// because Prisma, bcrypt, and other server libs rely on Node APIs
// not available in the Edge runtime.
export const runtime = 'nodejs';

// Validate that required secrets are set in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. Please add it to your environment variables in production.'
  );
}

const prisma = new PrismaClient();

// Build auth options
const authOptions: NextAuthOptions = {
  ...getAuthOptionsBase(),
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
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
            include: { clinic: true, patient: true, doctor: true }
          });

          if (!user || !user.password || !user.isActive) {
            return null;
          }

          const isValid = await compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0],
            role: user.role,
            clinicId: user.clinicId,
            clinicName: user.clinic?.name || undefined,
            patientId: user.patient?.id,
            doctorId: user.doctor?.id
          };
        } catch (err) {
          console.error('Credentials authorize error:', err);
          return null;
        }
      }
    })
  ],
  // Add any additional NextAuth options here
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.clinicId = user.clinicId;
        token.clinicName = user.clinicName;
        token.patientId = user.patientId;
        token.doctorId = user.doctorId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.sub as string; // Add user ID from token
        session.user.role = token.role;
        session.user.clinicId = token.clinicId;
        session.user.clinicName = token.clinicName;
        session.user.patientId = token.patientId;
        session.user.doctorId = token.doctorId;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };

// Export auth helper for server components (uses getServerSession internally)
export const auth = () => getServerSession(authOptions);