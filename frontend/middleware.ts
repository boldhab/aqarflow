import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// UX guard only, real security is backend.
// This middleware improves UX by redirecting unauthenticated users away from workspace
// routes and redirecting already-authenticated users away from the login page.
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('aqarflow_token')?.value;

  const protectedRoutes = ['/dashboard', '/leads', '/visits', '/deals'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtectedRoute && !token) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
