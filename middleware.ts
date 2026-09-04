import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /main routes if needed
  if (pathname.startsWith('/main')) {
    const sessionCookie =
      request.cookies.get('better-auth.session_token') ||
      request.cookies.get('__Secure-better-auth.session_token');

    // If no session cookie and accessing /main, allow client layout to handle or redirect
    // Let client-side layout do the smooth loading/redirect
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.ico|logo.png|ui/).*)',
  ],
};
