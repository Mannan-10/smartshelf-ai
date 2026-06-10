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
            router.push(redirectTo);
            router.refresh();
            return response;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);

        try {
            await apiClient.logout();
            router.push("/login");
            router.refresh();
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