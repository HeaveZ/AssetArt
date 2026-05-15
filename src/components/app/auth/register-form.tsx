"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAction, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Workspace created", { description: "Welcome to Evam Assets." });
      router.push(state.data.redirectTo);
      router.refresh();
    } else if (state && !state.ok) {
      toast.error("Sign-up failed", { description: state.error });
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="workspaceName" required>
          Workspace name
        </Label>
        <Input
          id="workspaceName"
          name="workspaceName"
          placeholder="Acme IT"
          autoComplete="organization"
          invalid={!state?.ok && state?.field === "workspaceName"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name" required>
            Your name
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Jane Doe"
            autoComplete="name"
            invalid={!state?.ok && state?.field === "name"}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" required>
            Work email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@acme.com"
            autoComplete="email"
            invalid={!state?.ok && state?.field === "email"}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="At least 8 chars"
            autoComplete="new-password"
            invalid={!state?.ok && state?.field === "password"}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" required>
            Confirm
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repeat"
            autoComplete="new-password"
            invalid={!state?.ok && state?.field === "confirmPassword"}
          />
        </div>
      </div>

      {state && !state.ok ? (
        <p className="text-danger-fg text-[12px] animate-fade-in">{state.error}</p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating workspace…
          </>
        ) : (
          <>
            Create workspace
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
