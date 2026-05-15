import type { Metadata } from "next";
import Link from "next/link";
import {
  Bell,
  Boxes,
  Building2,
  KeyRound,
  Layers,
  MapPin,
  Settings as SettingsIcon,
  Sparkles,
  Tag,
  User,
  Users,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/common/page-header";
import { cn } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  { href: "/settings/general", title: "General", description: "Workspace name, currency, fiscal year, timezone.", icon: SettingsIcon },
  { href: "/settings/users", title: "Users & roles", description: "Invite teammates, assign roles, deactivate.", icon: Users },
  { href: "/settings/sites", title: "Sites & locations", description: "Buildings, floors, rooms.", icon: Building2 },
  { href: "/settings/departments", title: "Departments", description: "Org units for cost attribution.", icon: Layers },
  { href: "/settings/people", title: "People directory", description: "Non-user employees who hold assets.", icon: User },
  { href: "/settings/customers", title: "Customers", description: "External parties you ship assets to.", icon: MapPin },
  { href: "/settings/categories", title: "Categories", description: "Asset taxonomy with nesting.", icon: Tag },
  { href: "/settings/custom-fields", title: "Custom fields", description: "Per-category extra fields on assets.", icon: Boxes },
  { href: "/settings/api-keys", title: "API & integrations", description: "Slack, webhooks, programmatic access.", icon: KeyRound },
  { href: "/settings/alerts", title: "Alert rules", description: "Tune warranty, lease, license thresholds.", icon: Bell },
  { href: "/settings/ai", title: "AI", description: "Claude-powered asset categorization & alerts.", icon: Sparkles },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Tune your workspace — taxonomy, people, integrations, AI."
      />
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.href} style={{ animationDelay: `${i * 30}ms` }} className="animate-fade-in-up">
              <Link
                href={s.href}
                className={cn(
                  "card-lift bg-surface group block rounded-lg border p-4",
                  "transition-colors duration-150",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="bg-surface-muted text-text-muted group-hover:bg-brand-orange-100 group-hover:text-brand-orange-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-text text-[13.5px] font-medium tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-text-muted mt-1 text-[12px] leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
