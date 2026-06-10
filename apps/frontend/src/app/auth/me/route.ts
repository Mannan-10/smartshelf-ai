import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getBackendApiUrl } from "@/lib/auth-config";
import { getApiErrorMessage, readJsonSafely } from "@/lib/backend-api";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const backendResponse = await fetch(`${getBackendApiUrl()}/auth/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await readJsonSafely<unknown>(backendResponse);

    if (!backendResponse.ok) {
      const response = NextResponse.json(
        {
          message: getApiErrorMessage(data, "Something went wrong"),
        },
        {
          status: backendResponse.status,
        }
      );

      if (backendResponse.status === 401) {
        response.cookies.delete(AUTH_COOKIE_NAME);
      }

      return response;
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        message: "Unable to fetch user profile",
      },
      {
        status: 500,
      }
    );
  }
}
