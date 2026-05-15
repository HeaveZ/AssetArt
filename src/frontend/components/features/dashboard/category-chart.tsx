"use client";

import { motion } from "motion/react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CATEGORY_PALETTE, CHART_TOOLTIP_STYLE } from "@/frontend/lib/chart-colors";

export interface CategoryChartProps {
  data: { name: string; count: number }[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const rows = data.map((d, i) => ({
    ...d,
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]!,
  }));
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: 0.24 }}
      className="bg-surface flex flex-col rounded-xl border p-4"
    >
      <header className="space-y-0.5">
        <h2 className="text-text text-[13.5px] font-medium tracking-tight">By category</h2>
        <p className="text-text-muted text-[11.5px]">Donut breakdown of your asset taxonomy.</p>
      </header>
      <div className="mt-3 grid grid-cols-[160px_1fr] items-center gap-3">
        <div className="relative h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="name"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                animationDuration={650}
                animationEasing="ease-out"
                stroke="var(--color-surface)"
                strokeWidth={2}
              >
                {rows.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...CHART_TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-text num text-[20px] font-medium leading-none">{total}</span>
            <span className="text-text-subtle mt-0.5 text-[10px] uppercase tracking-[0.08em]">
              Total
            </span>
          </div>
        </div>
        <ul className="space-y-1.5">
          {rows.length === 0 ? (
            <li className="text-text-muted text-[12.5px]">No categorized assets yet.</li>
          ) : (
            rows.map((r) => {
              const pct = total ? Math.round((r.count / total) * 100) : 0;
              return (
                <li key={r.name} className="flex items-center gap-2 text-[12px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="text-text flex-1 truncate">{r.name}</span>
                  <span className="text-text-muted num tabular-nums">{pct}%</span>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </motion.section>
  );
}
