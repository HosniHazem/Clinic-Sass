import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcryptjs';
import CredentialsProvider from 'next-auth/providers/credentials';

// Types are declared centrally in `src/types/next-auth.d.ts`.
// Keep runtime auth logic in this file; do not redeclare module augmentations here.

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  debug: process.env.NODE_ENV === 'development',
  // Ensure host trust for server-side requests in this environment
  trustHost: true,
  pages: {
    signIn: '/auth/login',
    error: '/auth/login'
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            clinic: true,
            patient: true,
            doctor: true
          }
        });

        if (!user || !user.password || !user.isActive) {
          throw new Error('Invalid credentials or account disabled');
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          role: user.role,
          clinicId: user.clinicId,
          clinicName: user.clinic?.name || undefined,
          patientId: user.patient?.id,
          doctorId: user.doctor?.id
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = (user as any).role;
        token.clinicId = (user as any).clinicId;
        token.clinicName = (user as any).clinicName;
        token.patientId = (user as any).patientId;
        token.doctorId = (user as any).doctorId;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.clinicId = token.clinicId as string;
        session.user.clinicName = token.clinicName as string | undefined;
      }
      return session;
    }
  }
} as any;
