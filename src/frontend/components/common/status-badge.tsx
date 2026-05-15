import type { AssetStatus } from "@prisma/client";
import { Badge } from "@/frontend/components/ui/badge";
import { ASSET_STATUS_META } from "@/shared/constants";
import { cn } from "@/frontend/lib/utils";

interface Props {
  status: AssetStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
  dot?: boolean;
}

export function AssetStatusBadge({ status, size = "md", className, dot = true }: Props) {
  const meta = ASSET_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full whitespace-nowrap font-medium",
        meta.bg,
        meta.fg,
        size === "sm" && "px-1.5 h-4 text-[10px]",
        size === "md" && "px-2 h-[18px] text-[10.5px]",
        size === "lg" && "px-2.5 h-6 text-[12px]",
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} /> : null}
      {meta.label}
    </span>
  );
}

interface PillProps {
  tone: "info" | "success" | "warning" | "danger" | "muted" | "outline" | "navy" | "orange" | "purple";
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  dot?: string;
  className?: string;
}

export function Pill({ tone, children, size, dot, className }: PillProps) {
  return (
    <Badge tone={tone} size={size} dot={dot} className={className}>
      {children}
    </Badge>
  );
}
