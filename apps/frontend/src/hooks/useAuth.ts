"use client";
import { apiClient } from "@/lib/api-client";
import { RegisterFormValues, LoginFormValues } from "@/lib/validation/authSchema";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useAuth() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const register = async (
        values: RegisterFormValues,
        redirectTo = "/dashboard"
    ) => {
        setIsLoading(true);

        try {
            const response = await apiClient.register(values);
            if (response.authenticated) {
                router.push(redirectTo);
                router.refresh();
            } else {
                router.push("/login?registered=1");
            }
            return response;
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (values: LoginFormValues, redirectTo = "/dashboard") => {
        setIsLoading(true);

        try {
            const response = await apiClient.login(values);
            // Full navigation guarantees fresh cookies are sent in HTTP request headers to server components
            if (typeof window !== "undefined") {
                window.location.href = redirectTo;
            } else {
                router.push(redirectTo);
            }
            return response;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);

        try {
            await apiClient.logout();
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            } else {
                router.push("/login");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        register,
        login,
        logout,
        isLoading,
    };
}