"use client";

import Link from "next/link";
import { Plus, ScanLine, Search } from "lucide-react";
import { Breadcrumbs } from "@/frontend/components/app/breadcrumbs";
import { CommandPalette, useCommandPalette } from "@/frontend/components/app/command-palette";
import { Button } from "@/frontend/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/frontend/components/ui/tooltip";
import { toast } from "sonner";

export function TopBar() {
  const { open, setOpen } = useCommandPalette();

  return (
    <TooltipProvider delayDuration={120}>
      <header
        className="bg-surface/85 supports-[backdrop-filter]:bg-surface/75 sticky top-0 z-20 flex items-center justify-between border-b px-4 backdrop-blur-md lg:px-6"
        style={{ height: "var(--topbar-height)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Breadcrumbs />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="group bg-surface-muted hover:bg-surface-subtle text-text-muted hidden h-8 items-center gap-2 rounded-md border px-2.5 text-[12.5px] transition-colors md:flex w-[260px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search or run a command…</span>
            <span className="inline-flex items-center gap-0.5">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open command palette"
            className="bg-surface-muted hover:bg-surface-subtle text-text-muted flex h-8 w-8 items-center justify-center rounded-md border transition-colors md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500/40"
          >
            <Search className="h-3.5 w-3.5" />
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={() =>
                  toast("Scanner", {
                    description: "Camera scan and barcode label printing arrive in milestone 4.",
                  })
                }
                aria-label="Scan barcode"
              >
                <ScanLine />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scan barcode · ⇧S</TooltipContent>
          </Tooltip>

          <Button asChild variant="primary" size="md" className="hidden sm:inline-flex">
            <Link href="/assets/new">
              <Plus />
              New asset
            </Link>
          </Button>
          <Button asChild variant="primary" size="icon" className="sm:hidden" aria-label="New asset">
            <Link href="/assets/new">
              <Plus />
            </Link>
          </Button>
        </div>
      </header>

      <CommandPalette open={open} onOpenChange={setOpen} />
    </TooltipProvider>
  );
}
