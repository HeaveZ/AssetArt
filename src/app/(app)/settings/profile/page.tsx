import type { Metadata } from "next";
import { requireSession } from "@/backend/session";
import { SettingsShell } from "@/frontend/components/features/settings/settings-shell";
import { ProfileForm } from "@/frontend/components/features/settings/profile-form";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfileSettingsPage() {
  const session = await requireSession();
  return (
    <SettingsShell title="My profile" description="How you appear across AssetArt.">
      <ProfileForm
        initial={{ name: session.name ?? "", email: session.email, image: session.image }}
      />
    </SettingsShell>
  );
}
