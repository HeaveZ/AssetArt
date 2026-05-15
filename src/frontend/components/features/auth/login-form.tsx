"use client";

import { use, useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInWithCredentials } from "@/backend/actions/auth";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

interface Props {
  searchParamsPromise: Promise<{ callbackUrl?: string; error?: string }>;
}

export function LoginForm({ searchParamsPromise }: Props) {
  const search = use(searchParamsPromise);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(signInWithCredentials, null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Signed in", { description: "Welcome back to Evam Assets." });
      router.push(search.callbackUrl ?? state.data.redirectTo);
      router.refresh();
    }
  }, [state, router, search.callbackUrl]);

  useEffect(() => {
    if (search.error) {
      toast.error("Sign-in failed", { description: "Please check your credentials." });
    }
  }, [search.error]);

  const fieldError = state && !state.ok ? state : null;

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="email" required>
          Work email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@evam.com"
          autoFocus
          invalid={fieldError?.field === "email"}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" required>
            Password
          </Label>
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-text-subtle hover:text-text inline-flex items-center gap-1 text-[11px] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          invalid={fieldError?.field === "password"}
        />
      </div>

      {fieldError && !fieldError.field ? (
        <p className="text-danger-fg text-[12px] animate-fade-in">{fieldError.error}</p>
      ) : null}
      {fieldError?.field ? (
        <p className="text-danger-fg text-[12px] animate-fade-in">{fieldError.error}</p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      {process.env.NODE_ENV === "development" ? (
        <div className="border-border-subtle bg-surface-muted/60 rounded-lg border p-3 text-[11.5px]">
          <p className="text-text-muted">
            Seeded demo account after <code className="font-mono text-[10.5px]">pnpm db:seed</code>:
          </p>
          <p className="text-text mt-1 font-mono text-[11px]">
            ibrahim@evam.com · use <code>SEED_DEFAULT_PASSWORD</code> from your <code>.env.local</code>
          </p>
        </div>
      ) : null}
    </form>
  );
}
