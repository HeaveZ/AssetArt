import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PersonalSettingsNav } from "./settings-nav";

/**
 * Shared layout shell for the personal account settings (`/settings/profile`,
 * `/settings/password`, `/settings/account`, `/settings/billing`).
 *
 * Two-column on `lg+`: a side nav on the left, content on the right.
 * Single column below `lg`, with the nav rendered as horizontal tabs.
 */
export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/settings"
          className="text-text-subtle hover:text-text inline-flex items-center gap-1 text-[11.5px] transition-colors"
        >
          <ChevronLeft className="h-3 w-3" />
          All settings
        </Link>
      </div>

      <header className="space-y-1">
        <h1 className="text-text text-[22px] font-medium leading-tight tracking-tight">{title}</h1>
        {description ? (
          <p className="text-text-muted text-[13px] leading-relaxed">{description}</p>
        ) : null}
      </header>

      <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="lg:block">
          <PersonalSettingsNav />
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}
