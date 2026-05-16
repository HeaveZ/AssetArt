import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function HelpShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/help"
        className="text-text-subtle hover:text-text inline-flex items-center gap-1 text-[11.5px] transition-colors"
      >
        <ChevronLeft className="h-3 w-3" />
        Help center
      </Link>

      <header className="space-y-2">
        <h1 className="text-text text-[24px] font-medium leading-tight tracking-tight">{title}</h1>
        {description ? (
          <p className="text-text-muted text-[13.5px] leading-relaxed">{description}</p>
        ) : null}
      </header>

      <div className="text-text prose-help text-[13.5px] leading-relaxed">{children}</div>
    </div>
  );
}
