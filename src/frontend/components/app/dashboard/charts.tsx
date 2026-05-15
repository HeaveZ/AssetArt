"use client";

import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AssetStatus } from "@prisma/client";
import { ASSET_STATUS_META } from "@/shared/constants";

const STATUS_COLOR: Record<AssetStatus, string> = {
  AVAILABLE:      "var(--color-status-available-fg)",
  CHECKED_OUT:    "var(--color-status-checked-out-fg)",
  IN_MAINTENANCE: "var(--color-status-maintenance-fg)",
  RESERVED:       "var(--color-status-reserved-fg)",
  LEASED:         "var(--color-status-leased-fg)",
  DISPOSED:       "var(--color-status-disposed-fg)",
  LOST:           "var(--color-status-lost-fg)",
};

const CATEGORY_PALETTE = [
  "#F5933E",
  "#0F3460",
  "#7B5DCC",
  "#2C9E94",
  "#D26BA1",
  "#3A7BD5",
  "#D89635",
];

export function StatusChart({ data }: { data: { status: AssetStatus; count: number }[] }) {
  const rows = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      key: d.status,
      label: ASSET_STATUS_META[d.status].label,
      value: d.count,
      color: STATUS_COLOR[d.status],
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
            <Tooltip
              cursor={{ fill: "var(--color-surface-muted)" }}
              contentStyle={{
                background: "var(--color-surface-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--color-text-muted)", fontSize: 11 }}
            />
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

export function CategoryChart({ data }: { data: { name: string; count: number }[] }) {
  const rows = data.map((d, i) => ({ ...d, color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]! }));
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
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--color-text-muted)", fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-text num text-[20px] font-medium leading-none">{total}</span>
            <span className="text-text-subtle text-[10px] uppercase tracking-[0.08em] mt-0.5">Total</span>
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
