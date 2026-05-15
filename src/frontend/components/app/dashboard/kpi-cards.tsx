"use client";

import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Boxes, Diamond, Loader2, Wrench } from "lucide-react";
import { AnimatedNumber } from "@/frontend/components/app/animated-number";
import { Progress } from "@/frontend/components/ui/progress";
import { formatCompactMoney } from "@/shared/format";
import { cn } from "@/frontend/lib/utils";

interface Totals {
  totalAssets: number;
  checkedOut: number;
  inMaintenance: number;
  overdueMaintenance: number;
  portfolioValue: number;
  portfolioCurrency: string;
}

export function KpiCards({ totals }: { totals: Totals }) {
  const checkedOutPct = totals.totalAssets ? Math.round((totals.checkedOut / totals.totalAssets) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        index={0}
        label="Total assets"
        value={totals.totalAssets}
        icon={Boxes}
        accent="navy"
        trend={{ label: "+4 this week", positive: true }}
      />
      <KpiCard
        index={1}
        label="Checked out"
        value={totals.checkedOut}
        icon={ArrowUpRight}
        accent="success"
        meta={
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[10.5px]">
              <span className="text-text-subtle">Utilization</span>
              <span className="text-text font-medium tabular-nums">{checkedOutPct}%</span>
            </div>
            <Progress value={checkedOutPct} className="h-1" indicatorClassName="from-success-fg to-success-fg/80" />
          </div>
        }
      />
      <KpiCard
        index={2}
        label="In maintenance"
        value={totals.inMaintenance}
        icon={Wrench}
        accent="warning"
        trend={
          totals.overdueMaintenance > 0
            ? {
                label: `${totals.overdueMaintenance} overdue`,
                positive: false,
                strong: true,
              }
            : { label: "Nothing overdue", positive: true }
        }
      />
      <PortfolioCard value={totals.portfolioValue} currency={totals.portfolioCurrency} />
    </div>
  );
}

interface KpiProps {
  index: number;
  label: string;
  value: number;
  icon: typeof Boxes;
  accent: "navy" | "success" | "warning" | "danger" | "info";
  trend?: { label: string; positive?: boolean; strong?: boolean };
  meta?: React.ReactNode;
}

function KpiCard({ index, label, value, icon: Icon, accent, trend, meta }: KpiProps) {
  const ACCENT_CLS = {
    navy:    "bg-brand-navy-100/60 text-brand-navy-700 dark:bg-brand-navy-700/30 dark:text-brand-navy-100",
    success: "bg-success-bg text-success-fg",
    warning: "bg-warning-bg text-warning-fg",
    danger:  "bg-danger-bg text-danger-fg",
    info:    "bg-info-bg text-info-fg",
  } as const;

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: index * 0.06, ease: [0.25, 1, 0.5, 1] }}
      className={cn(
        "card-lift bg-surface relative overflow-hidden rounded-xl border p-4",
      )}
    >
      <header className="flex items-start justify-between">
        <p className="text-text-muted text-[11px] font-medium uppercase tracking-[0.06em]">{label}</p>
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", ACCENT_CLS[accent])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </header>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-text num text-[30px] font-medium leading-none tracking-tight">
          <AnimatedNumber value={value} />
        </span>
      </div>
      {trend ? (
        <div className="mt-2 flex items-center gap-1 text-[11px]">
          {trend.positive ? (
            <ArrowUpRight className="text-success-fg h-3 w-3" />
          ) : (
            <ArrowDownRight className={cn("h-3 w-3", trend.strong ? "text-danger-fg" : "text-warning-fg")} />
          )}
          <span
            className={cn(
              "font-medium",
              trend.positive ? "text-success-fg" : trend.strong ? "text-danger-fg" : "text-warning-fg",
            )}
          >
            {trend.label}
          </span>
        </div>
      ) : null}
      {meta}
    </motion.article>
  );
}

function PortfolioCard({ value, currency }: { value: number; currency: string }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="relative overflow-hidden rounded-xl border border-brand-navy-700 bg-portfolio-gradient p-4 text-white card-lift"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,1) 1px, transparent 0)",
          backgroundSize: "16px 16px",
        }}
      />
      <header className="relative flex items-start justify-between">
        <p className="text-brand-orange-200/90 text-[11px] font-medium uppercase tracking-[0.08em]">
          Portfolio value
        </p>
        <span className="border-brand-orange-500/30 bg-brand-orange-500/15 text-brand-orange-300 flex h-7 w-7 items-center justify-center rounded-md border">
          <Diamond className="h-3 w-3" strokeWidth={2.2} />
        </span>
      </header>
      <div className="relative mt-3">
        <p className="num text-[30px] font-medium leading-none tracking-tight text-white">
          <AnimatedNumber value={value} format={(n) => formatCompactMoney(n, currency)} />
        </p>
        <p className="text-brand-navy-100/80 mt-1.5 text-[11px]">
          Live appraisal · ex. disposed
        </p>
      </div>
      <div className="relative mt-3 flex items-center gap-1 text-[11px]">
        <ArrowUpRight className="text-brand-orange-300 h-3 w-3" />
        <span className="text-brand-orange-300 font-medium">+8.1% YoY</span>
      </div>
    </motion.article>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-7 w-7 rounded-md" />
          </div>
          <div className="skeleton mt-4 h-8 w-24" />
          <div className="skeleton mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// Used in suspense fallbacks
export function _LoaderShim() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
