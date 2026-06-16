import { NextResponse } from "next/server";

export async function forwardBackendResponse(response: Response) {
  if (response.status === 204) {
    return new Response(null, {
      status: 204,
    });
  }

  const data = await response.json().catch(() => ({
    message: response.statusText || "Request failed",
  }));

  return NextResponse.json(data, {
    status: response.status,
  });
}