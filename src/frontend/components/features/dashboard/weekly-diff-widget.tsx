"use client";

import { motion } from "motion/react";
import { ArrowDown, ArrowRight, ArrowUp, Boxes, CheckCircle2, ArrowUpFromLine } from "lucide-react";
import { Sparkline } from "@/frontend/components/common/sparkline";
import { cn } from "@/frontend/lib/utils";

interface DiffRow {
  label: string;
  current: number;
  previous: number;
  trend: number[];
  icon: typeof Boxes;
  positiveIsGood?: boolean;
}

interface Props {
  weekDiff: {
    newAssets: { current: number; previous: number };
    checkouts: { current: number; previous: number };
    completedMaintenance: { current: number; previous: number };
  };
  trends: {
    assetsCreated: number[];
    checkouts: number[];
    maintenance: number[];
  };
}

export function WeeklyDiffWidget({ weekDiff, trends }: Props) {
  const rows: DiffRow[] = [
    {
      label: "New assets",
      current: weekDiff.newAssets.current,
      previous: weekDiff.newAssets.previous,
      trend: trends.assetsCreated,
      icon: Boxes,
      positiveIsGood: true,
    },
    {
      label: "Checkouts",
      current: weekDiff.checkouts.current,
      previous: weekDiff.checkouts.previous,
      trend: trends.checkouts,
      icon: ArrowUpFromLine,
      positiveIsGood: true,
    },
    {
      label: "Maintenance closed",
      current: weekDiff.completedMaintenance.current,
      previous: weekDiff.completedMaintenance.previous,
      trend: trends.maintenance,
      icon: CheckCircle2,
      positiveIsGood: true,
    },
  ];

  return (
    <section className="bg-surface rounded-xl border p-4">
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="text-text-subtle text-[10.5px] font-semibold uppercase tracking-[0.08em]">
          What changed this week
        </h3>
        <span className="text-text-subtle text-[10.5px]">vs. last week</span>
      </header>
      <ul className="divide-border-subtle divide-y">
        {rows.map((r, idx) => (
          <DiffItem key={r.label} row={r} index={idx} />
        ))}
      </ul>
    </section>
  );
}

function DiffItem({ row, index }: { row: DiffRow; index: number }) {
  const Icon = row.icon;
  const delta = row.current - row.previous;
  const pct =
    row.previous === 0
      ? row.current > 0
        ? 100
        : 0
      : Math.round((delta / row.previous) * 100);
  const direction = delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const isGood = row.positiveIsGood ? delta >= 0 : delta <= 0;

  const toneClass =
    direction === "flat"
      ? "text-text-subtle"
      : isGood
        ? "text-success-fg"
        : "text-warning-fg";

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.05 }}
      className="flex items-center gap-3 py-2.5"
    >
      <span className="bg-surface-muted text-text-muted flex h-7 w-7 items-center justify-center rounded-md">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-text text-[12px] font-medium leading-tight">{row.label}</p>
        <p className="text-text-subtle text-[10.5px]">
          {row.current} this week · {row.previous} last
        </p>
      </div>
      <div className={cn("flex flex-col items-end gap-0.5 text-[11px] font-medium tabular-nums", toneClass)}>
        <span className="inline-flex items-center gap-0.5">
          {direction === "up" ? (
            <ArrowUp className="h-3 w-3" />
          ) : direction === "down" ? (
            <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowRight className="h-3 w-3" />
          )}
          {direction === "flat" ? "—" : `${pct > 0 ? "+" : ""}${pct}%`}
        </span>
        <Sparkline
          values={row.trend}
          strokeClassName={cn(toneClass, "opacity-90")}
          fillClassName="opacity-60"
          className="h-5 w-16"
        />
      </div>
    </motion.li>
  );
}
