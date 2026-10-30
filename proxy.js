import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (
    process.env.MAINTENANCE_MODE !== 'true' ||
    pathname === '/maintenance' ||
    pathname.startsWith('/maintenance/')
  ) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/maintenance', request.url));
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
