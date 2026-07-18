// apps/frontend/middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth-config';
import { verifyAuthToken } from '@/lib/auth/jwt';
import { isAdminRole } from '@/lib/rbac';

const protectedRoutes = [
  '/dashboard',
  '/products',
  '/vendors',
  '/purchases',
  '/sales',
  '/inventory',
  '/reports',
  '/ml',
  '/settings',
  '/admin',
];

const authRoutes = ['/login', '/register'];

function startsWithRoute(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isProtectedRoute = startsWithRoute(pathname, protectedRoutes);
  const isAuthRoute = startsWithRoute(pathname, authRoutes);
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!token) {
    return NextResponse.next();
  }

  const user = await verifyAuthToken(token);

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);

    return response;
  }

  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (isAdminRoute && !isAdminRole(user.role)) {
    return new NextResponse('Forbidden: admin access required', {
      status: 403,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/dashboard/:path*',
    '/products/:path*',
    '/vendors/:path*',
    '/purchases/:path*',
    '/sales/:path*',
    '/inventory/:path*',
    '/reports/:path*',
    '/ml/:path*',
    '/settings/:path*',
    '/admin/:path*',
  ],
};