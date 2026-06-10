// apps/frontend/middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-config";

const protectedRoutes = [
  "/dashboard",
  "/products",
  "/vendors",
  "/purchases",
  "/sales",
  "/inventory",
  "/reports",
  "/ml",
  "/settings",
];

const authRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/products/:path*",
    "/vendors/:path*",
    "/purchases/:path*",
    "/sales/:path*",
    "/inventory/:path*",
    "/reports/:path*",
    "/ml/:path*",
    "/settings/:path*",
  ],
};