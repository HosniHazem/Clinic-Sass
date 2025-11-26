import NextAuth from 'next-auth';
import { getAuthOptionsBase } from '@/lib/auth';

// Use Node runtime for NextAuth handlers because Prisma, bcrypt, and
// other server libs rely on Node APIs not available in the Edge runtime.
export const runtime = 'nodejs';

// Validate that required secrets are set in production
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. Please add it to your environment variables in production.'
  );
}

// Lazy initialize NextAuth per request to avoid bundling/minification issues
// that can occur when Node-only libraries are bundled into shared chunks.
let nextAuthInstance: any;
try {
  nextAuthInstance = NextAuth(async (req) => {
    // Dynamically import heavy/node-only dependencies inside the function
    const [{ PrismaClient }, { PrismaAdapter }] = await Promise.all([
      import('@prisma/client'),
      import('@auth/prisma-adapter')
    ]);
    const CredentialsProvider = (await import('next-auth/providers/credentials')).default;
    const { compare } = await import('bcryptjs');

    const prisma = new PrismaClient();

    // Build options based on base config
    const base = getAuthOptionsBase();

    // Attach adapter
    base.adapter = PrismaAdapter(prisma) as any;

    // Create Credentials provider that uses the runtime prisma and bcrypt
    base.providers = [
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
    ];

    return base as any;
  });
} catch (error) {
  console.error('Failed to initialize NextAuth (lazy):', error);
  throw error;
}

const { handlers, auth: authFn, signIn, signOut } = nextAuthInstance as any;

// Export auth function for server-side usage
export { signIn, signOut };
export const auth = authFn;

// Delegate GET/POST to handlers (wrapped to log)
export async function GET(request: any, context: any) {
  try {
    return await handlers.GET(request, context);
  } catch (error) {
    console.error('[Auth GET] Handler error:', error);
    throw error;
  }
}

export async function POST(request: any, context: any) {
  try {
    return await handlers.POST(request, context);
  } catch (error) {
    console.error('[Auth POST] Handler error:', error);
    throw error;
  }
}
