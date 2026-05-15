"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Building2,
  Command as CommandIcon,
  Download,
  KeyRound,
  LayoutDashboard,
  Moon,
  Plus,
  QrCode,
  ReceiptText,
  ScanLine,
  Settings,
  Sparkles,
  Sun,
  Wrench,
  ArrowUpFromLine,
  ArrowDownToLine,
  AlertTriangle,
  Activity,
  Map as MapIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/frontend/components/ui/command";

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { open, setOpen };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const go = (href: string) => () => {
    onOpenChange(false);
    router.push(href);
  };

  const action = (label: string, fn?: () => void) => () => {
    onOpenChange(false);
    fn?.();
    toast(label, { description: "Action wired up in the next milestone." });
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      description="Search assets, navigate, run an action"
    >
      <CommandInput placeholder="Type a command, or paste an asset tag…" />
      <CommandList>
        <CommandEmpty>No results. Try &quot;new asset&quot;, &quot;maintenance&quot;, or an asset tag.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={action("Create new asset", () => router.push("/assets/new"))}>
            <Plus />
            New asset
            <CommandShortcut><kbd>N</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={action("Check out")}>
            <ArrowUpFromLine />
            Check out asset
            <CommandShortcut><kbd>O</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={action("Check in")}>
            <ArrowDownToLine />
            Check in asset
            <CommandShortcut><kbd>I</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={action("Scanner opening")}>
            <ScanLine />
            Scan barcode
            <CommandShortcut><kbd>⇧</kbd><kbd>S</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={action("Print QR labels")}>
            <QrCode />
            Print QR labels
          </CommandItem>
          <CommandItem onSelect={action("Export to Excel")}>
            <Download />
            Export current view
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={go("/dashboard")}>
            <LayoutDashboard />
            Dashboard
            <CommandShortcut><kbd>G</kbd><kbd>D</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/assets")}>
            <Boxes />
            Assets
            <CommandShortcut><kbd>G</kbd><kbd>A</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/maintenance")}>
            <Wrench />
            Maintenance
            <CommandShortcut><kbd>G</kbd><kbd>M</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/leases")}>
            <ReceiptText />
            Leases
            <CommandShortcut><kbd>G</kbd><kbd>L</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/licenses")}>
            <KeyRound />
            Licenses
          </CommandItem>
          <CommandItem onSelect={go("/alerts")}>
            <AlertTriangle />
            Alerts
            <CommandShortcut><kbd>G</kbd><kbd>N</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/activity")}>
            <Activity />
            Activity
            <CommandShortcut><kbd>G</kbd><kbd>Y</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/floor-map")}>
            <MapIcon />
            Floor map
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="AI">
          <CommandItem onSelect={action("Asking Evam")}>
            <Sparkles />
            Ask Evam — natural language search…
            <CommandShortcut><kbd>⏎</kbd></CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Workspace">
          <CommandItem onSelect={go("/settings")}>
            <Settings />
            Settings
            <CommandShortcut><kbd>G</kbd><kbd>S</kbd></CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={go("/settings/sites")}>
            <Building2 />
            Manage sites & locations
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              onOpenChange(false);
            }}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
            Toggle theme — {resolvedTheme === "dark" ? "Light" : "Dark"}
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <div className="text-text-subtle flex items-center justify-between gap-2 px-2 pt-2 text-[10.5px]">
          <span className="inline-flex items-center gap-1">
            <CommandIcon className="h-3 w-3" /> Cmd + K to toggle
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd>↑</kbd><kbd>↓</kbd> Navigate · <kbd>⏎</kbd> Open · <kbd>Esc</kbd> Close
          </span>
        </div>
      </CommandList>
    </CommandDialog>
  );
}
