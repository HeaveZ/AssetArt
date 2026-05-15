"use client";

import { useEffect, useMemo, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Command as CommandIcon } from "lucide-react";
import { useTheme } from "next-themes";
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
import {
  buildPaletteCommands,
  PALETTE_GROUP_ORDER,
  type PaletteCommand,
  type PaletteGroup,
} from "./command-registry";

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

  const commands = useMemo(
    () =>
      buildPaletteCommands({
        router,
        resolvedTheme,
        setTheme,
        close: () => onOpenChange(false),
      }),
    [router, resolvedTheme, setTheme, onOpenChange],
  );

  const grouped = useMemo(() => groupCommands(commands), [commands]);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      description="Search assets, navigate, run an action"
    >
      <CommandInput placeholder="Type a command, or paste an asset tag…" />
      <CommandList>
        <CommandEmpty>No results. Try &quot;new asset&quot;, &quot;maintenance&quot;, or an asset tag.</CommandEmpty>

        {PALETTE_GROUP_ORDER.map((group, idx) => {
          const items = grouped.get(group);
          if (!items?.length) return null;
          return (
            <Fragment key={group}>
              {idx > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading={group}>
                {items.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <CommandItem key={cmd.id} onSelect={() => cmd.run({
                      router,
                      resolvedTheme,
                      setTheme,
                      close: () => onOpenChange(false),
                    })}>
                      <Icon />
                      {cmd.label}
                      {cmd.shortcut ? <CommandShortcut>{cmd.shortcut}</CommandShortcut> : null}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Fragment>
          );
        })}

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

function groupCommands(commands: PaletteCommand[]): Map<PaletteGroup, PaletteCommand[]> {
  const map = new Map<PaletteGroup, PaletteCommand[]>();
  for (const cmd of commands) {
    const bucket = map.get(cmd.group) ?? [];
    bucket.push(cmd);
    map.set(cmd.group, bucket);
  }
  return map;
}
