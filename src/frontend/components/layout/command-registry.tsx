"use client";

import type { ReactNode } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  Building2,
  Download,
  KeyRound,
  LayoutDashboard,
  Map as MapIcon,
  Moon,
  Plus,
  QrCode,
  ReceiptText,
  ScanLine,
  Settings,
  Sparkles,
  Sun,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type PaletteGroup = "Quick actions" | "Navigate" | "AI" | "Workspace";

export interface PaletteContext {
  router: AppRouterInstance;
  resolvedTheme: string | undefined;
  setTheme: (theme: string) => void;
  close: () => void;
}

export interface PaletteCommand {
  id: string;
  group: PaletteGroup;
  label: string;
  icon: LucideIcon;
  shortcut?: ReactNode;
  run: (ctx: PaletteContext) => void;
}

/**
 * Single source of truth for the command palette. Adding a new command means
 * appending to this list — no changes to `<CommandPalette>` required (OCP).
 */
export function buildPaletteCommands(ctx: PaletteContext): PaletteCommand[] {
  const go = (href: string) => () => {
    ctx.close();
    ctx.router.push(href);
  };
  const stubbed = (label: string) => () => {
    ctx.close();
    toast(label, { description: "Action wired up in the next milestone." });
  };

  return [
    // Quick actions
    {
      id: "asset.new",
      group: "Quick actions",
      label: "New asset",
      icon: Plus,
      shortcut: <kbd>N</kbd>,
      run: go("/assets/new"),
    },
    {
      id: "asset.checkout",
      group: "Quick actions",
      label: "Check out asset",
      icon: ArrowUpFromLine,
      shortcut: <kbd>O</kbd>,
      run: go("/checkout"),
    },
    {
      id: "asset.checkin",
      group: "Quick actions",
      label: "Check in asset",
      icon: ArrowDownToLine,
      shortcut: <kbd>I</kbd>,
      run: go("/checkin"),
    },
    {
      id: "asset.scan",
      group: "Quick actions",
      label: "Scan barcode",
      icon: ScanLine,
      shortcut: (
        <>
          <kbd>⇧</kbd>
          <kbd>S</kbd>
        </>
      ),
      run: stubbed("Scanner opening"),
    },
    {
      id: "asset.qr",
      group: "Quick actions",
      label: "Print QR labels",
      icon: QrCode,
      run: stubbed("Print QR labels"),
    },
    {
      id: "asset.export",
      group: "Quick actions",
      label: "Export current view",
      icon: Download,
      run: stubbed("Export to Excel"),
    },

    // Navigate
    {
      id: "nav.dashboard",
      group: "Navigate",
      label: "Dashboard",
      icon: LayoutDashboard,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>D</kbd>
        </>
      ),
      run: go("/dashboard"),
    },
    {
      id: "nav.assets",
      group: "Navigate",
      label: "Assets",
      icon: Boxes,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>A</kbd>
        </>
      ),
      run: go("/assets"),
    },
    {
      id: "nav.maintenance",
      group: "Navigate",
      label: "Maintenance",
      icon: Wrench,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>M</kbd>
        </>
      ),
      run: go("/maintenance"),
    },
    {
      id: "nav.leases",
      group: "Navigate",
      label: "Leases",
      icon: ReceiptText,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>L</kbd>
        </>
      ),
      run: go("/leases"),
    },
    {
      id: "nav.licenses",
      group: "Navigate",
      label: "Licenses",
      icon: KeyRound,
      run: go("/licenses"),
    },
    {
      id: "nav.alerts",
      group: "Navigate",
      label: "Alerts",
      icon: AlertTriangle,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>N</kbd>
        </>
      ),
      run: go("/alerts"),
    },
    {
      id: "nav.activity",
      group: "Navigate",
      label: "Activity",
      icon: Activity,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>Y</kbd>
        </>
      ),
      run: go("/activity"),
    },
    {
      id: "nav.floor-map",
      group: "Navigate",
      label: "Floor map",
      icon: MapIcon,
      run: go("/floor-map"),
    },

    // AI
    {
      id: "ai.ask",
      group: "AI",
      label: "Ask Evam — natural language search…",
      icon: Sparkles,
      shortcut: <kbd>⏎</kbd>,
      run: stubbed("Asking Evam"),
    },

    // Workspace
    {
      id: "ws.settings",
      group: "Workspace",
      label: "Settings",
      icon: Settings,
      shortcut: (
        <>
          <kbd>G</kbd>
          <kbd>S</kbd>
        </>
      ),
      run: go("/settings"),
    },
    {
      id: "ws.sites",
      group: "Workspace",
      label: "Manage sites & locations",
      icon: Building2,
      run: go("/settings/sites"),
    },
    {
      id: "ws.theme",
      group: "Workspace",
      label: `Toggle theme — ${ctx.resolvedTheme === "dark" ? "Light" : "Dark"}`,
      icon: ctx.resolvedTheme === "dark" ? Sun : Moon,
      run: () => {
        ctx.setTheme(ctx.resolvedTheme === "dark" ? "light" : "dark");
        ctx.close();
      },
    },
  ];
}

export const PALETTE_GROUP_ORDER: PaletteGroup[] = [
  "Quick actions",
  "Navigate",
  "AI",
  "Workspace",
];
