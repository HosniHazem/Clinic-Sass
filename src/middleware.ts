import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { auth } from '@/auth';

export async function middleware(req: NextRequest) {
  const session = await auth();
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isLoggedIn = !!session?.user;

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl.origin));
  }

  // Inject tenant (clinic) id as header
  const clinicId = session?.user?.clinicId as string | undefined;
  const requestHeaders = new Headers(req.headers);
  
  if (clinicId) {
    requestHeaders.set('x-clinic-id', clinicId);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
