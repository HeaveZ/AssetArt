import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";

export function ReportShell({
  title,
  description,
  rowCount,
  category,
  actions,
  children,
}: {
  title: string;
  description?: string;
  rowCount?: number;
  category?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <Link
        href="/reports"
        className="text-text-subtle hover:text-text inline-flex items-center gap-1 text-[11.5px] transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        All reports
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-text text-[22px] font-medium leading-tight tracking-tight">
              {title}
            </h1>
            {category ? (
              <Badge tone="muted" size="sm">
                {category}
              </Badge>
            ) : null}
            {typeof rowCount === "number" ? (
              <Badge tone="orange" size="sm">
                {rowCount.toLocaleString()} row{rowCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
          {description ? (
            <p className="text-text-muted text-[13px] leading-relaxed">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>

      {children}
    </div>
  );
}
