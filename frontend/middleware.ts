import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect workspace routes
  const isWorkspaceRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/leads') ||
    pathname.startsWith('/visits') ||
    pathname.startsWith('/deals');

  const token = request.cookies.get('aqarflow_token')?.value;

  if (isWorkspaceRoute && !token) {
    // If unauthenticated, redirect to login page (or allow pass-through if testing)
    // For MVP boilerplate: pass-through or redirect
    // return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
