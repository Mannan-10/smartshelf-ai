import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Enter a valid email address"),
    
    password: z
        .string()
        .min(1, "Password is required")
        .min(6, "Password must be at least 6 characters long"),
});

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must be less than 50 characters long"),

    email: z
        .string()
        .trim()
        .min(1, "Email is required")
        .email("Enter a valid email address"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters long")
        .max(72, "Password must be less than 72 characters long"),

    confirmPassword: z
        .string()
        .min(1, "Confirm Password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;