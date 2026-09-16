import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  getBackendApiUrl,
  getTokenFromAuthResponse,
  getUserFromAuthResponse,
} from "@/lib/auth-config";
import { getApiErrorMessage, readJsonSafely } from "@/lib/backend-api";

export async function POST(request: NextRequest) {
  const backendUrl = getBackendApiUrl();
  try {
    const body = await request.json();
    const backendResponse = await fetch(`${backendUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await readJsonSafely<unknown>(backendResponse);
    if (!backendResponse.ok) {
      const errorMsg = getApiErrorMessage(data, "Invalid email or password");
      return NextResponse.json(
        {
          message: errorMsg,
        },
        {
          status: backendResponse.status,
        }
      );
    }

    const token = getTokenFromAuthResponse(data);

    if (!token) {
      console.error("[Auth Login Proxy] Backend responded OK but returned no token:", data);
      return NextResponse.json(
        {
          message: "Login succeeded, but backend did not return accessToken or token.",
        },
        {
          status: 500,
        }
      );
    }

    const response = NextResponse.json({
      message: "Login successful",
      user: getUserFromAuthResponse(data),
      authenticated: true,
    });
    response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
    return response;
  } catch (error) {
    const errorDetail = error instanceof Error ? error.message : "Network error";
    console.error(`[Auth Login Proxy Error] Failed connecting to backend at ${backendUrl}/auth/login:`, error);
    return NextResponse.json(
      {
        message: `Unable to reach backend server (${backendUrl}). ${errorDetail}. Please ensure the backend is running and NEXT_PUBLIC_API_URL is configured.`,
      },
      {
        status: 502,
      }
    );
  }
}
