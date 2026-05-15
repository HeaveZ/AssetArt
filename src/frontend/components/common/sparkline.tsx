"use client";

import { useId } from "react";
import { cn } from "@/frontend/lib/utils";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
}

export function Sparkline({
  values,
  width = 96,
  height = 28,
  className,
  strokeClassName = "stroke-text-subtle",
  fillClassName = "fill-text-subtle/15",
}: SparklineProps) {
  const id = useId();
  if (values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("h-7 w-24", className)}
        aria-hidden
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          strokeDasharray="2 3"
          className="stroke-text-subtle/40"
          strokeWidth={1}
        />
      </svg>
    );
  }

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const pathLine = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const pathFill = `${pathLine} L ${width} ${height} L 0 ${height} Z`;

  const gradId = `spark-${id}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-7 w-24 overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.32} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={pathFill} className={fillClassName} fill={`url(#${gradId})`} />
      <path
        d={pathLine}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
      />
      {(() => {
        const last = points[points.length - 1];
        if (!last) return null;
        return (
          <circle
            cx={last[0]}
            cy={last[1]}
            r={2}
            className={strokeClassName}
            fill="currentColor"
          />
        );
      })()}
    </svg>
  );
}
