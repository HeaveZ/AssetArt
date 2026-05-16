import type { Metadata } from "next";
import Link from "next/link";
import {
  Accessibility,
  CalendarClock,
  FileText,
  HeartHandshake,
  Info,
  Mail,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/common/page-header";
import { Badge } from "@/frontend/components/ui/badge";
import { cn } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Help & Support" };

const SECTIONS = [
  {
    href: "/help/about",
    title: "About AssetArt",
    description: "Who built this, what it stands for, where we're headed.",
    icon: Info,
    accent: "from-brand-orange-400 to-brand-orange-600",
  },
  {
    href: "/help/contact",
    title: "Contact us",
    description: "Reach the team directly — bugs, feedback, sales.",
    icon: Mail,
    accent: "from-info-fg/80 to-info-fg",
  },
  {
    href: "/help/terms",
    title: "Terms of service",
    description: "Plain-language terms for using AssetArt.",
    icon: FileText,
    accent: "from-text-muted to-text-subtle",
  },
  {
    href: "/help/privacy",
    title: "Privacy policy",
    description: "What we collect, what we don't, and your rights.",
    icon: ShieldCheck,
    accent: "from-success-fg/80 to-success-fg",
  },
  {
    href: "/help/videos",
    title: "Walkthrough videos",
    description: "Short clips for every feature — checkout to floor maps.",
    icon: PlayCircle,
    accent: "from-danger-fg/70 to-danger-fg",
  },
  {
    href: "/help/reviews",
    title: "User reviews",
    description: "What real fleets and IT teams say about AssetArt.",
    icon: Star,
    accent: "from-warning-fg/80 to-warning-fg",
  },
  {
    href: "/help/accessibility",
    title: "Accessibility",
    description: "Our WCAG commitment and keyboard reference.",
    icon: Accessibility,
    accent: "from-info-fg/70 to-info-fg",
  },
  {
    href: "/help/changelog",
    title: "Changelog",
    description: "Every shipped change, newest first.",
    icon: CalendarClock,
    accent: "from-brand-orange-400 to-brand-orange-600",
    badge: "Updated",
  },
] as const;

export default function HelpHubPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Help & Support"
        description="Guides, policies, and ways to reach us — everything that's not in the app itself."
        meta={
          <Badge tone="muted" size="md">
            <HeartHandshake className="h-3 w-3" />
            We answer within 1 business day
          </Badge>
        }
      />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.href}
              style={{ animationDelay: `${i * 30}ms` }}
              className="animate-fade-in-up"
            >
              <Link
                href={s.href}
                className={cn(
                  "card-lift bg-surface group relative block overflow-hidden rounded-xl border p-4 transition-colors",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br opacity-[0.08] blur-2xl transition-opacity group-hover:opacity-[0.18]",
                    s.accent,
                  )}
                />
                <div className="relative flex items-start gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
                      s.accent,
                    )}
                  >
                    <Icon className="h-4 w-4 text-white" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-text text-[13.5px] font-medium tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-text-muted mt-1 text-[12px] leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                  {"badge" in s && s.badge ? (
                    <Badge tone="orange" size="sm">
                      {s.badge}
                    </Badge>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="bg-surface relative overflow-hidden rounded-2xl border p-6">
        <div
          aria-hidden
          className="from-brand-orange-400 to-brand-orange-600 absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br opacity-[0.07] blur-3xl"
        />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="bg-brand-orange-500 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-text text-[14px] font-medium tracking-tight">Still stuck?</p>
            <p className="text-text-muted text-[12.5px]">
              Open the command palette with{" "}
              <kbd className="bg-surface-muted border-border rounded border px-1 py-0.5 text-[10px] font-mono">⌘ K</kbd>{" "}
              and type anything. We index every page, asset, and action.
            </p>
          </div>
          <Link
            href="/help/contact"
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white inline-flex items-center gap-2 rounded-md px-3 py-2 text-[12.5px] font-medium transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            Email support
          </Link>
        </div>
      </div>
    </div>
  );
}
