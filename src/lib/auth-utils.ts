import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { setCurrentClinic, runWithClinicTransaction } from '@/lib/db-rls';

export async function getSessionServer() {
  // Use getServerSession with authOptions for API routes
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSessionServer();
  if (!session?.user) {
    throw new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  // set DB session clinic id for RLS policies (best-effort)
  try {
    await setCurrentClinic(session.user.clinicId as string | undefined);
  } catch (err) {
    // swallow - RLS is best-effort here; application-level scoping remains primary
    console.warn('setCurrentClinic failed', err);
  }
  return session;
}

/**
 * Convenience helper: run a callback inside a transaction with the current
 * authenticated session's clinic id set for RLS.
 */
export async function runWithSessionClinic<T>(cb: (tx: any) => Promise<T>) {
  const session = await requireAuth();
  const clinicId = session.user.clinicId as string;
  return runWithClinicTransaction(clinicId, cb);
}

export async function requireRole(roles: string[] = []) {
  const session = await requireAuth();
  const userRole = session.user.role as string;
  if (!roles.includes(userRole)) {
    throw new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  return session;
}

export function getClinicIdFromRequest(req: NextRequest) {
  // Prefer header injected by middleware, fallback to cookies/session if needed
  const header = req.headers.get('x-clinic-id');
  if (header) return header;
  return null;
}

export function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}