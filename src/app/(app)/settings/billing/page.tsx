import type { Metadata } from "next";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { requireSession } from "@/backend/session";
import { prisma } from "@/backend/db";
import { SettingsShell } from "@/frontend/components/features/settings/settings-shell";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Subscription plans" };

type Plan = {
  id: "free" | "pro" | "enterprise";
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
  icon: typeof Crown;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Starter",
    price: "$0",
    cadence: "/mo · forever",
    tagline: "Everything to get one location on the rails.",
    icon: Sparkles,
    features: [
      "Up to 100 assets",
      "1 workspace, 1 site",
      "Full check-in / check-out",
      "CSV import + export",
      "7-day audit log retention",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    cadence: "per seat / month",
    tagline: "Scale across sites with audit, alerts, and AI.",
    icon: Zap,
    highlighted: true,
    features: [
      "Unlimited assets and sites",
      "Custom fields per category",
      "AI auto-categorize (Claude)",
      "Warranty / lease / license alerts",
      "Floor maps and reservations",
      "365-day audit log retention",
      "Priority email support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    cadence: "tailored to your fleet",
    tagline: "SSO, SLAs, and a named contact.",
    icon: Crown,
    features: [
      "SAML SSO + SCIM provisioning",
      "Multi-workspace org tree",
      "Custom audit retention",
      "Dedicated success manager",
      "99.9% uptime SLA",
      "Onboarding + migration help",
    ],
  },
];

export default async function BillingSettingsPage() {
  const session = await requireSession();
  const ws = await prisma.workspace.findUnique({
    where: { id: session.workspaceId },
    select: { name: true, _count: { select: { assets: true } } },
  });
  const currentPlan: Plan["id"] = "free"; // No billing wiring yet.
  const assetCount = ws?._count?.assets ?? 0;

  return (
    <SettingsShell
      title="Subscription plans"
      description="You're on the Starter plan. Upgrade to unlock alerts, AI, and unlimited scale."
    >
      <div className="bg-surface mb-5 rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-text-subtle text-[10.5px] font-medium uppercase tracking-[0.06em]">
              Current usage
            </p>
            <p className="text-text mt-1 text-[20px] font-medium tabular-nums">
              {assetCount} <span className="text-text-muted text-[12px] font-normal">of 100 assets</span>
            </p>
          </div>
          <Badge tone="muted" size="md">
            Starter plan
          </Badge>
        </div>
        <div className="bg-surface-muted relative mt-3 h-1.5 overflow-hidden rounded-full">
          <div
            className="from-brand-orange-400 to-brand-orange-600 absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-[width] duration-700"
            style={{ width: `${Math.min(100, (assetCount / 100) * 100)}%` }}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          return (
            <article
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-xl border bg-surface p-5 transition-colors",
                plan.highlighted &&
                  "border-brand-orange-300 ring-1 ring-brand-orange-200 dark:border-brand-orange-500/40 dark:ring-brand-orange-500/15",
              )}
            >
              {plan.highlighted ? (
                <span className="bg-brand-orange-500 absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="h-2.5 w-2.5" />
                  Most popular
                </span>
              ) : null}

              <div className="mb-4 flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border",
                    plan.highlighted
                      ? "border-brand-orange-300 bg-brand-orange-50 text-brand-orange-700 dark:border-brand-orange-500/40 dark:bg-brand-orange-500/10 dark:text-brand-orange-300"
                      : "border-border bg-surface-muted/40 text-text-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="text-text text-[15px] font-medium tracking-tight">{plan.name}</h3>
              </div>

              <div className="mb-3">
                <p className="text-text text-[28px] font-medium leading-none tabular-nums">
                  {plan.price}
                </p>
                <p className="text-text-subtle mt-1 text-[11.5px]">{plan.cadence}</p>
              </div>

              <p className="text-text-muted mb-4 text-[12px] leading-relaxed">{plan.tagline}</p>

              <ul className="mb-5 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-text flex items-start gap-2 text-[12px]">
                    <Check
                      className={cn(
                        "mt-0.5 h-3 w-3 shrink-0",
                        plan.highlighted ? "text-brand-orange-600" : "text-success-fg",
                      )}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                {isCurrent ? (
                  <Button variant="secondary" size="md" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : (
                  <Button variant={plan.highlighted ? "primary" : "secondary"} size="md" className="w-full">
                    {plan.id === "enterprise" ? "Talk to us" : "Upgrade"}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-text-subtle mt-4 text-[11px]">
        Billing isn’t wired yet — the upgrade buttons are placeholders. Once payments ship you can
        switch plans here without losing data.
      </p>
    </SettingsShell>
  );
}
