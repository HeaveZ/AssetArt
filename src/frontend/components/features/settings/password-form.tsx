"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { changePasswordAction } from "@/backend/actions/auth";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [strength, setStrength] = useState<ReturnType<typeof scorePassword>>({ score: 0, label: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Password changed", {
        description: "You'll stay signed in here. Sign out elsewhere to refresh those sessions.",
      });
      formRef.current?.reset();
      // The strength meter is driven by `onInput`, which won't fire after a
      // form.reset(). Reset it directly so the bar clears alongside the inputs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStrength({ score: 0, label: "" });
    } else if (state && !state.ok) {
      toast.error("Couldn't change password", { description: state.error });
    }
  }, [state]);

  const fieldError = state && !state.ok ? state : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-surface space-y-5 rounded-xl border p-5"
    >
      <div className="flex items-center gap-3 border-b pb-4">
        <span className="bg-brand-orange-100 text-brand-orange-700 dark:bg-brand-orange-500/15 dark:text-brand-orange-300 flex h-9 w-9 items-center justify-center rounded-lg">
          <KeyRound className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-text text-[13.5px] font-medium">Change password</p>
          <p className="text-text-muted text-[12px]">
            Use 8+ characters with at least one upper, lower, and number.
          </p>
        </div>
      </div>

      <PasswordField
        id="currentPassword"
        label="Current password"
        autoComplete="current-password"
        invalid={fieldError?.field === "currentPassword"}
        show={showCurrent}
        onToggle={() => setShowCurrent((s) => !s)}
      />

      <div className="space-y-1.5">
        <Label htmlFor="newPassword" required>
          New password
        </Label>
        <div className="relative">
          <Input
            id="newPassword"
            name="newPassword"
            type={showNew ? "text" : "password"}
            autoComplete="new-password"
            onInput={(e) => setStrength(scorePassword(e.currentTarget.value))}
            invalid={fieldError?.field === "newPassword"}
          />
          <button
            type="button"
            onClick={() => setShowNew((s) => !s)}
            className="text-text-subtle hover:text-text absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors"
            tabIndex={-1}
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
        <StrengthMeter strength={strength} />
      </div>

      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        invalid={fieldError?.field === "confirmPassword"}
        show={showNew}
        onToggle={() => setShowNew((s) => !s)}
      />

      {fieldError && !fieldError.field ? (
        <p className="text-danger-fg text-[12px] animate-fade-in">{fieldError.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {pending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  invalid,
  show,
  onToggle,
}: {
  id: string;
  label: string;
  autoComplete: string;
  invalid?: boolean;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required>
        {label}
      </Label>
      <div className="relative">
        <Input id={id} name={id} type={show ? "text" : "password"} autoComplete={autoComplete} invalid={invalid} />
        <button
          type="button"
          onClick={onToggle}
          className="text-text-subtle hover:text-text absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 transition-colors"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function scorePassword(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Too short", "Weak", "OK", "Good", "Strong", "Excellent"] as const;
  const idx = Math.min(s, 5);
  return { score: idx, label: labels[idx] ?? "" };
}

function StrengthMeter({ strength }: { strength: { score: number; label: string } }) {
  if (!strength.label) return null;
  const bars = [0, 1, 2, 3, 4];
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex flex-1 gap-1">
        {bars.map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength.score
                ? strength.score >= 4
                  ? "bg-success-fg"
                  : strength.score >= 3
                    ? "bg-brand-orange-500"
                    : "bg-warning-fg"
                : "bg-surface-muted"
            }`}
          />
        ))}
      </div>
      <span className="text-text-subtle w-[64px] text-right text-[10.5px]">{strength.label}</span>
    </div>
  );
}
