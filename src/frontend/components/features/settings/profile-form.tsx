"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { UserAvatar } from "@/frontend/components/ui/avatar";
import { updateProfileAction } from "@/backend/actions/auth";

interface Props {
  initial: {
    name: string;
    email: string;
    image: string | null;
  };
}

export function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Profile updated", { description: "Your changes are live." });
      router.refresh();
    } else if (state && !state.ok) {
      toast.error("Couldn't save", { description: state.error });
    }
  }, [state, router]);

  const fieldError = state && !state.ok ? state : null;

  return (
    <form action={formAction} className="bg-surface space-y-5 rounded-xl border p-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={initial.name || initial.email} src={initial.image} size={56} />
        <div className="min-w-0">
          <p className="text-text truncate text-[14px] font-medium">{initial.name || initial.email}</p>
          <p className="text-text-muted truncate text-[12px]">{initial.email}</p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="name" required>
          Full name
        </Label>
        <Input
          id="name"
          name="name"
          defaultValue={initial.name}
          autoComplete="name"
          maxLength={80}
          invalid={fieldError?.field === "name"}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="image">Avatar URL</Label>
        <Input
          id="image"
          name="image"
          type="url"
          defaultValue={initial.image ?? ""}
          autoComplete="off"
          placeholder="https://…"
          maxLength={500}
          invalid={fieldError?.field === "image"}
        />
        <p className="text-text-subtle text-[11px]">
          Paste a square image URL. Upload support comes with the next storage milestone.
        </p>
      </div>

      {fieldError ? (
        <p className="text-danger-fg text-[12px] animate-fade-in">{fieldError.error}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="md" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
