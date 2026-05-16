import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  CalendarClock,
  ClipboardList,
  FileChartColumn,
  FileText,
  GanttChart,
  Receipt,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/frontend/components/common/page-header";
import { Badge } from "@/frontend/components/ui/badge";
import { cn } from "@/frontend/lib/utils";

export const metadata: Metadata = { title: "Reports" };

type Category = {
  id: string;
  title: string;
  description: string;
  icon: typeof Boxes;
  accent: string;
  reports: { href: string | null; label: string; description: string }[];
};

const CATEGORIES: Category[] = [
  {
    id: "asset",
    title: "Asset reports",
    description: "Inventories, register exports, and depreciation snapshots.",
    icon: Boxes,
    accent: "from-brand-orange-400 to-brand-orange-600",
    reports: [
      {
        href: "/reports/asset-inventory",
        label: "Asset inventory",
        description: "Full register, every column.",
      },
      {
        href: null,
        label: "Depreciation",
        description: "Straight-line and reducing balance schedules.",
      },
    ],
  },
  {
    id: "status",
    title: "Status reports",
    description: "Where every asset stands right now.",
    icon: Zap,
    accent: "from-success-fg/80 to-success-fg",
    reports: [
      {
        href: "/reports/status",
        label: "Status mix",
        description: "Counts and totals grouped by status.",
      },
    ],
  },
  {
    id: "checkout",
    title: "Check-out reports",
    description: "Who has what, since when, due back when.",
    icon: ClipboardList,
    accent: "from-info-fg/80 to-info-fg",
    reports: [
      {
        href: "/reports/checkout-active",
        label: "Active check-outs",
        description: "Everything currently out in the field.",
      },
      {
        href: null,
        label: "Overdue returns",
        description: "Items past their expected return.",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Maintenance reports",
    description: "Ticket history, MTBF, vendor performance.",
    icon: Wrench,
    accent: "from-warning-fg/80 to-warning-fg",
    reports: [
      {
        href: "/reports/maintenance-history",
        label: "Maintenance history",
        description: "Most recent 200 maintenance events.",
      },
      {
        href: null,
        label: "MTBF / MTTR",
        description: "Time-between-failures by category.",
      },
    ],
  },
  {
    id: "lease",
    title: "Leased asset reports",
    description: "Active leases, renewal calendar, lease P&L.",
    icon: ReceiptText,
    accent: "from-brand-purple-500/80 to-brand-purple-600",
    reports: [
      {
        href: "/reports/lease-active",
        label: "Active leases",
        description: "Open leases with end-date countdown.",
      },
      {
        href: null,
        label: "Renewal calendar",
        description: "What's expiring in 30 / 60 / 90 days.",
      },
    ],
  },
  {
    id: "audit",
    title: "Audit reports",
    description: "Compliance-ready trails of every change.",
    icon: ShieldCheck,
    accent: "from-danger-fg/70 to-danger-fg",
    reports: [
      {
        href: null,
        label: "Audit trail export",
        description: "Per-resource history with actor + diff.",
      },
    ],
  },
  {
    id: "contract",
    title: "Contract reports",
    description: "Warranty, support, and SLAs you're holding.",
    icon: FileText,
    accent: "from-text-muted to-text-subtle",
    reports: [
      {
        href: null,
        label: "Warranty calendar",
        description: "Devices going out of warranty soon.",
      },
    ],
  },
  {
    id: "reservation",
    title: "Reservation reports",
    description: "Bookings against pooled equipment.",
    icon: CalendarClock,
    accent: "from-info-fg/70 to-info-fg",
    reports: [
      {
        href: null,
        label: "Upcoming reservations",
        description: "Approved bookings starting in next 14 days.",
      },
    ],
  },
  {
    id: "transaction",
    title: "Transaction reports",
    description: "Procurement, transfers, disposals.",
    icon: Receipt,
    accent: "from-warning-fg/70 to-warning-fg",
    reports: [
      { href: null, label: "Purchases", description: "By month and category." },
      { href: null, label: "Disposals", description: "What left the portfolio and why." },
    ],
  },
  {
    id: "custom",
    title: "Custom reports",
    description: "Saved views from any data set.",
    icon: GanttChart,
    accent: "from-brand-orange-400 to-brand-orange-600",
    reports: [
      {
        href: null,
        label: "Saved views",
        description: "Reuse filtered views as repeatable reports.",
      },
    ],
  },
  {
    id: "automated",
    title: "Automated reports",
    description: "Scheduled exports to your inbox.",
    icon: Sparkles,
    accent: "from-brand-orange-400 to-brand-orange-600",
    reports: [
      {
        href: null,
        label: "Email digest",
        description: "Daily / weekly snapshots emailed to admins.",
      },
    ],
  },
  {
    id: "other",
    title: "Other reports",
    description: "Anything that doesn't fit the buckets above.",
    icon: FileChartColumn,
    accent: "from-text-muted to-text-subtle",
    reports: [
      {
        href: null,
        label: "Workspace summary",
        description: "Single-page PDF for board reporting.",
      },
    ],
  },
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Reports"
        description="Compose, schedule, and export every view of your fleet — from a 30-second status check to a full audit pack."
        meta={
          <Badge tone="muted" size="md">
            {CATEGORIES.reduce((n, c) => n + c.reports.filter((r) => r.href).length, 0)} live ·{" "}
            {CATEGORIES.reduce((n, c) => n + c.reports.filter((r) => !r.href).length, 0)} coming
            soon
          </Badge>
        }
      />

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <li
              key={cat.id}
              style={{ animationDelay: `${i * 25}ms` }}
              className="animate-fade-in-up"
            >
              <article className="card-lift bg-surface group/cat relative h-full overflow-hidden rounded-xl border">
                <div
                  aria-hidden
                  className={cn(
                    "absolute -right-14 -top-14 h-32 w-32 rounded-full bg-gradient-to-br opacity-[0.07] blur-2xl transition-opacity group-hover/cat:opacity-[0.16]",
                    cat.accent,
                  )}
                />
                <header className="relative p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-[0_2px_8px_rgba(0,0,0,0.15)]",
                        cat.accent,
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" strokeWidth={2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-text text-[13.5px] font-medium tracking-tight">
                        {cat.title}
                      </h3>
                      <p className="text-text-muted mt-1 text-[12px] leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                </header>
                <ul className="relative space-y-px border-t bg-surface-muted/30">
                  {cat.reports.map((r) => {
                    const ReportInner = (
                      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="text-text truncate text-[12.5px] font-medium">{r.label}</p>
                          <p className="text-text-subtle truncate text-[11px]">{r.description}</p>
                        </div>
                        {r.href ? (
                          <ArrowUpRight className="text-text-subtle group-hover/row:text-text h-3.5 w-3.5 shrink-0 transition-colors" />
                        ) : (
                          <Badge tone="muted" size="sm">
                            Soon
                          </Badge>
                        )}
                      </div>
                    );
                    return (
                      <li key={r.label} className={cn(r.href ? "group/row" : "opacity-70")}>
                        {r.href ? (
                          <Link href={r.href} className="hover:bg-surface-muted/60 block transition-colors">
                            {ReportInner}
                          </Link>
                        ) : (
                          ReportInner
                        )}
                      </li>
                    );
                  })}
                </ul>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
