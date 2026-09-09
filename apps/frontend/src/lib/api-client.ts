import { LoginFormValues, RegisterFormValues } from "../lib//validation/authSchema";

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role?: string;
    storeId?: string | null;
    storeName?: string | null;
};

export type AuthResponse = {
    message?: string;
    user?: AuthUser | null;
    authenticated?: boolean;
};

async function apiRequest<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // Include cookies for authentication
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.message || data?.error || "Request failed");
    }

    return data as T;
}

export const apiClient = {
    register: async (values: RegisterFormValues) => {
        const payload = {
            name: values.name,
            email: values.email,
            password: values.password,
            storeName: values.storeName,
        };

        return apiRequest<AuthResponse>(`/auth/register`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    login: async (values: LoginFormValues) => {
        return apiRequest<AuthResponse>(`/auth/login`, {
            method: 'POST',
            body: JSON.stringify(values),
        });
    },

    logout: async () => {
        return apiRequest<AuthResponse>(`/auth/logout`, {
            method: 'POST',
        });
    },

    me: async () => {
        return apiRequest<AuthResponse>(`/auth/me`, {
            method: 'GET',
        });
    },
};
