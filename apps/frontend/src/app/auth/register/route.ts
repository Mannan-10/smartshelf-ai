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
  try {
    const body = await request.json();

    const backendResponse = await fetch(`${getBackendApiUrl()}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await readJsonSafely<unknown>(backendResponse);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: getApiErrorMessage(data, "Something went wrong"),
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
  } catch {
    return NextResponse.json(
      {
        message: "Unable to register. Please try again.",
      },
      {
        status: 500,
      }
    );
  }
}
