import Link from "next/link";
import { Boxes } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  collapsed = false,
  href = "/dashboard",
}: {
  className?: string;
  collapsed?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 outline-none rounded-md",
        "focus-visible:ring-2 focus-visible:ring-brand-orange-500/40",
        className,
      )}
    >
      <span
        className={cn(
          "from-brand-orange-400 to-brand-orange-600 relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br",
          "shadow-[0_2px_8px_rgba(245,147,62,0.35)]",
          "transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-[1.05]",
        )}
      >
        <Boxes className="h-4 w-4 text-white" strokeWidth={2.4} />
        <span
          aria-hidden
          className="absolute inset-0 rounded-lg ring-1 ring-white/15"
        />
      </span>
      {!collapsed ? (
        <span className="text-[13.5px] font-medium tracking-tight text-white">
          Evam Assets
        </span>
      ) : null}
    </Link>
  );
}
