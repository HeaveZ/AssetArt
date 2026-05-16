import type { Metadata } from "next";
import { requireSession } from "@/backend/session";
import { SettingsShell } from "@/frontend/components/features/settings/settings-shell";
import { PasswordForm } from "@/frontend/components/features/settings/password-form";

export const metadata: Metadata = { title: "Change password" };

export default async function PasswordSettingsPage() {
  await requireSession();
  return (
    <SettingsShell
      title="Change password"
      description="Keep your account safe. Pick something you don't use anywhere else."
    >
      <PasswordForm />
    </SettingsShell>
  );
}
