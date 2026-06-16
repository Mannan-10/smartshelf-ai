import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getBackendApiUrl } from "@/lib/auth-config";
import { forwardBackendResponse } from "@/lib/api/forward-backend-response";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  const response = await fetch(`${getBackendApiUrl()}/categories`, {
    method: "GET",
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    cache: "no-store",
  });

  return forwardBackendResponse(response);
}