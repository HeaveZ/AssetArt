import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-text text-[20px] font-medium leading-tight tracking-tight sm:text-[22px]">
          {title}
        </h1>
        {description ? (
          <p className="text-text-muted text-[13px] leading-relaxed">{description}</p>
        ) : null}
        {meta ? <div className="pt-1">{meta}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
