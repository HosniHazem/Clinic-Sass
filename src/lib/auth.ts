// Export a factory for the non-adapter parts of the Auth.js configuration.
// Heavy, node-only dependencies (PrismaClient, PrismaAdapter, bcrypt,
// and providers that use them) are intentionally NOT imported here so
// they can be dynamically loaded inside a Node runtime at request time.

export function getAuthOptionsBase() {
  return {
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
}
