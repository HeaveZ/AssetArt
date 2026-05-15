"use client";

import { Fragment, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/frontend/components/ui/breadcrumb";
import { findActiveItem } from "@/frontend/lib/navigation";
import { cn } from "@/frontend/lib/utils";

const TITLE_OVERRIDES: Record<string, string> = {
  new: "New asset",
};

function humanize(segment: string): string {
  if (TITLE_OVERRIDES[segment]) return TITLE_OVERRIDES[segment]!;
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const activeNav = findActiveItem(pathname);

  const segments = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, idx) => {
      const href = "/" + parts.slice(0, idx + 1).join("/");
      const label =
        idx === 0 && activeNav?.href === href ? activeNav.label : humanize(part);
      return { href, label };
    });
  }, [pathname, activeNav]);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList>
        <BreadcrumbItem>
          <Link
            href="/dashboard"
            className={cn(
              "text-text-subtle hover:text-text-muted flex h-5 w-5 items-center justify-center rounded-md transition-colors",
              "focus-visible:ring-2 focus-visible:ring-brand-orange-500/40",
            )}
            aria-label="Home"
          >
            <Home className="h-3 w-3" />
          </Link>
        </BreadcrumbItem>
        {segments.map((seg, i) => (
          <Fragment key={seg.href}>
            <BreadcrumbItem>
              <ChevronRight className="text-text-subtle h-3 w-3" />
            </BreadcrumbItem>
            <BreadcrumbItem>
              {i === segments.length - 1 ? (
                <BreadcrumbPage className="truncate max-w-[260px]">{seg.label}</BreadcrumbPage>
              ) : (
                <Link
                  href={seg.href}
                  className="text-text-muted hover:text-text truncate max-w-[180px] rounded-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
                >
                  {seg.label}
                </Link>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
