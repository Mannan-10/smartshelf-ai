import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-config";

export async function POST() {
  const response = NextResponse.json({
    message: "Logout successful",
    authenticated: false,
  });

  response.cookies.delete(AUTH_COOKIE_NAME);

  return response;
}
