import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/frontend/components/app/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-text-subtle text-[11px] font-semibold uppercase tracking-[0.2em]">
          Welcome back
        </p>
        <h1 className="text-text text-[26px] font-medium leading-tight tracking-tight">
          Sign in to Evam Assets
        </h1>
        <p className="text-text-muted text-[13px] leading-relaxed">
          Enter your credentials to access your workspace. Lost your password?{" "}
          <Link className="text-info-fg underline-offset-4 hover:underline" href="/forgot-password">
            Reset it
          </Link>
          .
        </p>
      </header>

      <LoginForm searchParamsPromise={searchParams} />

      <p className="text-text-muted text-[12.5px]">
        Don&apos;t have an account?{" "}
        <Link className="text-info-fg underline-offset-4 hover:underline font-medium" href="/register">
          Request access
        </Link>
      </p>
    </div>
  );
}
