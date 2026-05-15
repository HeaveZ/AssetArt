import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/app/auth/register-form";

export const metadata: Metadata = {
  title: "Create your workspace",
};

export default function RegisterPage() {
  const allowSignup = process.env.AUTH_ALLOW_SIGNUP === "true";

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-text-subtle text-[11px] font-semibold uppercase tracking-[0.2em]">
          Get started
        </p>
        <h1 className="text-text text-[26px] font-medium leading-tight tracking-tight">
          Create your workspace
        </h1>
        <p className="text-text-muted text-[13px] leading-relaxed">
          You&apos;ll be the first owner. Invite your team after setup.
        </p>
      </header>

      {allowSignup ? (
        <RegisterForm />
      ) : (
        <div className="bg-warning-bg text-warning-fg rounded-lg border border-warning-fg/15 p-4 text-[12.5px] leading-relaxed">
          Open registration is disabled. Ask an administrator to invite you, or set{" "}
          <code className="font-mono text-[11px]">AUTH_ALLOW_SIGNUP=true</code> in <code className="font-mono text-[11px]">.env.local</code> for local dev.
        </div>
      )}

      <p className="text-text-muted text-[12.5px]">
        Already have an account?{" "}
        <Link className="text-info-fg underline-offset-4 hover:underline font-medium" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
