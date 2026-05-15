"use client";

import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AssetStatus } from "@prisma/client";
import { ASSET_STATUS_META } from "@/shared/constants";
import { CHART_TOOLTIP_STYLE, STATUS_CHART_COLOR } from "@/frontend/lib/chart-colors";

export interface StatusChartProps {
  data: { status: AssetStatus; count: number }[];
}

export function StatusChart({ data }: StatusChartProps) {
  const rows = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      key: d.status,
      label: ASSET_STATUS_META[d.status].label,
      value: d.count,
      color: STATUS_CHART_COLOR[d.status],
    }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay: 0.18 }}
      className="bg-surface flex flex-col rounded-xl border p-4"
    >
      <header className="space-y-0.5">
        <h2 className="text-text text-[13.5px] font-medium tracking-tight">Status mix</h2>
        <p className="text-text-muted text-[11.5px]">How your assets are distributed.</p>
      </header>
      <div className="mt-2 h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--color-text-muted)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: "var(--color-text-subtle)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip cursor={{ fill: "var(--color-surface-muted)" }} {...CHART_TOOLTIP_STYLE} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={650} animationEasing="ease-out">
              {rows.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {rows.length === 0 ? (
        <p className="text-text-muted py-8 text-center text-[12.5px]">No assets yet.</p>
      ) : null}
    </motion.section>
  );
}
