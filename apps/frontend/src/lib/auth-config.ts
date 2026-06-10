export const AUTH_COOKIE_NAME = "smartshelf_access_token"

export const getBackendApiUrl = () => {
    return (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    )
};

export const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
};

export function getTokenFromAuthResponse(data: unknown): string | null {
    const response = data as {
        accessToken?: string;
        token?: string;
        data?: {
            accessToken?: string;
            token?: string;
        };
    };

    return (
        response.accessToken ||
        response.token ||
        response.data?.accessToken ||
        response.data?.token ||
        null
    );
}

export function getUserFromAuthResponse(data: unknown) {
    const response = data as {
        user?: unknown;
        data?: {
            user?: unknown;
        };
    };
    return response?.user || response.data?.user || null;
}