import type { Metadata } from "next";
import {
  Building2,
  Calendar,
  CheckCircle2,
  KeyRound,
  Mail,
  Shield,
} from "lucide-react";
import { requireSession } from "@/backend/session";
import { prisma } from "@/backend/db";
import { ROLE_META } from "@/shared/constants";
import { SettingsShell } from "@/frontend/components/features/settings/settings-shell";
import { Badge } from "@/frontend/components/ui/badge";
import { formatDate } from "@/shared/format";

export const metadata: Metadata = { title: "Account details" };

export default async function AccountDetailsPage() {
  const session = await requireSession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      role: true,
      workspace: { select: { name: true, slug: true, currency: true, timezone: true } },
    },
  });

  const role = ROLE_META[session.role];

  const rows = [
    {
      icon: Mail,
      label: "Email",
      value: user?.email ?? session.email,
      hint: user?.emailVerified ? (
        <Badge tone="success" size="sm">
          <CheckCircle2 className="h-3 w-3" />
          Verified
        </Badge>
      ) : (
        <Badge tone="muted" size="sm">
          Unverified
        </Badge>
      ),
    },
    {
      icon: Building2,
      label: "Workspace",
      value: user?.workspace?.name ?? "—",
      hint: user?.workspace?.slug ? (
        <span className="text-text-subtle text-[11px]">/ {user.workspace.slug}</span>
      ) : null,
    },
    {
      icon: Shield,
      label: "Role",
      value: role.label,
      hint: <span className="text-text-subtle text-[11px]">{role.description ?? ""}</span>,
    },
    {
      icon: KeyRound,
      label: "Member since",
      value: user?.createdAt ? formatDate(user.createdAt) : "—",
    },
    {
      icon: Calendar,
      label: "Last sign-in",
      value: user?.lastLoginAt ? formatDate(user.lastLoginAt) : "Never",
    },
    {
      icon: Building2,
      label: "Default currency",
      value: user?.workspace?.currency ?? "—",
    },
    {
      icon: Calendar,
      label: "Timezone",
      value: user?.workspace?.timezone ?? "—",
    },
  ];

  return (
    <SettingsShell
      title="Account details"
      description="The non-editable bits — who you are inside AssetArt."
    >
      <dl className="bg-surface divide-y rounded-xl border">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-4 px-4 py-3.5">
              <span className="text-text-subtle bg-surface-muted/60 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="flex-1">
                <dt className="text-text-subtle text-[10.5px] font-medium uppercase tracking-[0.06em]">
                  {row.label}
                </dt>
                <dd className="text-text mt-0.5 text-[13px] font-medium">{row.value}</dd>
              </div>
              {row.hint ? <div className="shrink-0">{row.hint}</div> : null}
            </div>
          );
        })}
      </dl>

      <p className="text-text-subtle mt-3 text-[11px]">
        Need to change your email or transfer ownership? Contact your workspace admin.
      </p>
    </SettingsShell>
  );
}
