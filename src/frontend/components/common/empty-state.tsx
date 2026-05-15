import type { LucideIcon } from "lucide-react";
import { cn } from "@/frontend/lib/utils";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: Props) {
  return (
    <div
      className={cn(
        "border-border-subtle bg-surface flex flex-col items-center justify-center rounded-lg border text-center",
        compact ? "py-10 px-6" : "py-20 px-6",
        "animate-fade-in-up",
        className,
      )}
    >
      <div className="bg-surface-muted text-text-subtle mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl">
        <Icon className="h-5 w-5" strokeWidth={1.6} />
      </div>
      <h3 className="text-text text-[15px] font-medium tracking-tight">{title}</h3>
      {description ? (
        <p className="text-text-muted mt-1.5 max-w-sm text-[12.5px] leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
