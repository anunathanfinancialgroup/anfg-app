import { NextResponse } from 'next/server';

export function middleware(request) {
  // Skip static files, API routes, images
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Your auth logic here
  const hasAuth = request.cookies.has('canfs_auth');
  if (!hasAuth && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - API routes
     * - Static files (_next/static, public)
     * - Images
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
