import { auth } from "./auth";
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.nextUrl.origin));
    }
    return null;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', req.nextUrl.origin));
  }

  // Inject tenant (clinic) id as header so server-side API handlers
  // and other middleware can access it without re-fetching the session.
  const clinicId = req.auth?.user?.clinicId as string | undefined;

  const res = NextResponse.next({
    request: {
      // forward original headers and add our tenant header
      headers: new Headers(req.headers),
    },
  });

  if (clinicId) {
    res.headers.set('x-clinic-id', clinicId);
  }

  return res;
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
