import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
    "text-[10.5px] font-medium tracking-wide whitespace-nowrap",
    "transition-colors duration-150",
    "border border-transparent",
  ].join(" "),
  {
    variants: {
      tone: {
        info:    "bg-info-bg text-info-fg",
        success: "bg-success-bg text-success-fg",
        warning: "bg-warning-bg text-warning-fg",
        danger:  "bg-danger-bg text-danger-fg",
        muted:   "bg-surface-muted text-text-muted border-border",
        outline: "bg-transparent text-text-muted border-border",
        navy:    "bg-brand-navy-900 text-white",
        orange:  "bg-brand-orange-100 text-brand-orange-700 dark:bg-brand-orange-500/15 dark:text-brand-orange-300",
        purple:  "bg-brand-purple-100 text-brand-purple-700 dark:bg-brand-purple-500/15 dark:text-brand-purple-300",
      },
      size: {
        sm: "px-1.5 py-0 text-[10px] h-4",
        md: "px-2 py-0.5 text-[10.5px] h-[18px]",
        lg: "px-2.5 py-1 text-[12px] h-6",
      },
    },
    defaultVariants: {
      tone: "muted",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: string; // tailwind bg class for leading dot
}

function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
