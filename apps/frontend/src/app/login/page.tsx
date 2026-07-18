"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useAuth } from "@/hooks/useAuth";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validation/authSchema";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const registered = searchParams.get("registered") === "1";

  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState("");

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError("");

    try {
      await login(values, redirectTo);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Login failed"
      );
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Side: Branding (Hidden on mobile) */}
      <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-zinc-900 to-zinc-900" />
        <div className="relative z-20 flex items-center text-xl font-bold tracking-tight">
          <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white shadow-sm ring-1 ring-white/20">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" /></svg>
          </div>
          SmartShelf AI
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-3">
            <p className="text-xl leading-relaxed text-zinc-300">
              "Managing inventory and forecasting stock has never been easier. SmartShelf completely transformed our retail operations and completely eliminated our expiry losses."
            </p>
            <footer className="text-sm font-medium text-zinc-500">
              Retail Operations Director
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center p-8 bg-background sm:p-12">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to sign in to your dashboard
            </p>
          </div>

          <div className="space-y-6">
            {registered && (
              <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600">
                <AlertDescription>
                  Registration successful. Please log in to continue.
                </AlertDescription>
              </Alert>
            )}

            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@smartshelf.com"
                  autoComplete="email"
                  className="h-11"
                  {...form.register("email")}
                />
                {form.formState.errors.email?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-11"
                  {...form.register("password")}
                />
                {form.formState.errors.password?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium transition-all"
                disabled={isLoading || form.formState.isSubmitting}
              >
                {isLoading || form.formState.isSubmitting
                  ? "Logging in..."
                  : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              New to SmartShelf AI?{" "}
              <Link
                href="/register"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}