import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, getBackendApiUrl } from "@/lib/auth-config";
import { forwardBackendResponse } from "@/lib/api/forward-backend-response";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const { id } = await params;

  const response = await fetch(`${getBackendApiUrl()}/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  return forwardBackendResponse(response);
}
