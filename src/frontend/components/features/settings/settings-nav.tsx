"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, KeyRound, Shield, User } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

/**
 * Vertical secondary nav for the personal "account" cluster of settings pages.
 * Pages like Workspace / Categories live in `/settings` itself; these are the
 * "this is about *me*" routes surfaced from the top-right user menu.
 */
const ITEMS = [
  { href: "/settings/profile", label: "My profile", icon: User, description: "Name and avatar" },
  { href: "/settings/password", label: "Change password", icon: KeyRound, description: "Update your password" },
  { href: "/settings/account", label: "Account details", icon: Shield, description: "Workspace and role info" },
  { href: "/settings/billing", label: "Subscription plans", icon: CreditCard, description: "Plan and billing" },
] as const;

export function PersonalSettingsNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-surface sticky top-[calc(var(--topbar-height)+1rem)] rounded-xl border p-1.5">
      <ul className="space-y-0.5">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] transition-colors",
                  active
                    ? "bg-brand-orange-100/60 text-text dark:bg-brand-orange-500/12"
                    : "text-text-muted hover:bg-surface-muted/70 hover:text-text",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors",
                    active
                      ? "border-brand-orange-300 bg-brand-orange-50 text-brand-orange-700 dark:border-brand-orange-500/40 dark:bg-brand-orange-500/10 dark:text-brand-orange-300"
                      : "border-border bg-surface-muted/40 text-text-muted group-hover:text-text",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="text-text-subtle block truncate text-[11px]">
                    {item.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const PERSONAL_SETTINGS_ITEMS = ITEMS;
