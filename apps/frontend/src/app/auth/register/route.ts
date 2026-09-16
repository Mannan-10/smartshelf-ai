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

    const backendResponse = await fetch(`${backendUrl}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await readJsonSafely<unknown>(backendResponse);

    if (!backendResponse.ok) {
      const errorMsg = getApiErrorMessage(data, "Registration failed");
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

    const response = NextResponse.json({
      message: "Registration successful",
      user: getUserFromAuthResponse(data),
      authenticated: Boolean(token),
    });

    if (token) {
      response.cookies.set(AUTH_COOKIE_NAME, token, authCookieOptions);
    }

    return response;
  } catch (error) {
    const errorDetail = error instanceof Error ? error.message : "Network error";
    console.error(`[Auth Register Proxy Error] Failed connecting to backend at ${backendUrl}/auth/register:`, error);
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
