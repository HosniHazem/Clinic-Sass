import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  // Use getToken instead of auth() to work in Edge runtime
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  const isLoggedIn = !!token;

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
  const clinicId = token?.clinicId as string | undefined;
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