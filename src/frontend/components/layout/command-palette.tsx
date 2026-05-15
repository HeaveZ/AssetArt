"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Boxes,
  Clock,
  Command as CommandIcon,
  CornerDownLeft,
  Loader2,
} from "lucide-react";
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
import { ASSET_STATUS_META } from "@/shared/constants";
import { cn } from "@/frontend/lib/utils";
import {
  buildPaletteCommands,
  PALETTE_GROUP_ORDER,
  type PaletteCommand,
  type PaletteGroup,
} from "./command-registry";

const RECENT_KEY = "assetart:palette:recent";
const RECENT_LIMIT = 5;
const SEARCH_DEBOUNCE_MS = 180;

interface AssetHit {
  id: string;
  tag: string;
  name: string;
  brand: string | null;
  model: string | null;
  status: keyof typeof ASSET_STATUS_META;
}

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
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [assetHits, setAssetHits] = useState<AssetHit[]>([]);
  const [searching, setSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const ctx = useMemo(
    () => ({ router, resolvedTheme, setTheme, close }),
    [router, resolvedTheme, setTheme, close],
  );

  const commands = useMemo(() => buildPaletteCommands(ctx), [ctx]);

  // Load recent on open
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      const ids = raw ? (JSON.parse(raw) as string[]) : [];
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with localStorage on open
      setRecentIds(Array.isArray(ids) ? ids.slice(0, RECENT_LIMIT) : []);
    } catch {
      // ignore
    }
  }, [open]);

  // Reset query when closed
  useEffect(() => {
    if (open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear transient palette state on close
    setQuery("");
    setAssetHits([]);
  }, [open]);

  // Debounced asset search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- short query clears stale hits
      setAssetHits([]);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ac.signal })
        .then((r) => r.json())
        .then((data: { ok: boolean; results: AssetHit[] }) => {
          if (data.ok) setAssetHits(data.results);
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== "AbortError") {
            // swallow — palette stays usable
          }
        })
        .finally(() => setSearching(false));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const runCommand = useCallback(
    (cmd: PaletteCommand) => {
      try {
        const next = [cmd.id, ...recentIds.filter((id) => id !== cmd.id)].slice(0, RECENT_LIMIT);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        setRecentIds(next);
      } catch {
        // ignore storage failures
      }
      cmd.run(ctx);
    },
    [recentIds, ctx],
  );

  const recentCommands = useMemo(() => {
    if (query.trim()) return [];
    return recentIds
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is PaletteCommand => Boolean(c));
  }, [recentIds, commands, query]);

  const grouped = useMemo(() => groupCommands(commands), [commands]);

  function openAsset(id: string) {
    close();
    router.push(`/assets/${id}`);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      description="Search assets, navigate, run an action"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Type a command, asset tag, or search…"
      />
      <CommandList className="max-h-[440px]">
        <CommandEmpty>
          {searching ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </span>
          ) : (
            <span>No results. Try &quot;new asset&quot;, &quot;maintenance&quot;, or an asset tag.</span>
          )}
        </CommandEmpty>

        {assetHits.length > 0 ? (
          <>
            <CommandGroup heading="Assets">
              {assetHits.map((hit) => {
                const meta = ASSET_STATUS_META[hit.status];
                return (
                  <CommandItem
                    key={hit.id}
                    value={`asset:${hit.tag}-${hit.name}`}
                    onSelect={() => openAsset(hit.id)}
                  >
                    <Boxes />
                    <span className="asset-tag text-[10.5px]">{hit.tag}</span>
                    <span className="text-text font-medium">{hit.name}</span>
                    {hit.brand || hit.model ? (
                      <span className="text-text-subtle ml-1 text-[11px]">
                        · {[hit.brand, hit.model].filter(Boolean).join(" ")}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        meta.bg,
                        meta.fg,
                      )}
                    >
                      <span className={cn("h-1 w-1 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {recentCommands.length > 0 ? (
          <>
            <CommandGroup heading="Recent">
              {recentCommands.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={`recent-${cmd.id}`}
                    value={`recent-${cmd.id}-${cmd.label}`}
                    onSelect={() => runCommand(cmd)}
                  >
                    <Icon />
                    {cmd.label}
                    <Clock className="text-text-subtle ml-auto h-3 w-3" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        ) : null}

        {PALETTE_GROUP_ORDER.map((group, idx) => {
          const items = grouped.get(group);
          if (!items?.length) return null;
          const showSep = idx > 0 || recentCommands.length > 0 || assetHits.length > 0;
          return (
            <Fragment key={group}>
              {showSep && idx > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading={group}>
                {items.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <CommandItem
                      key={cmd.id}
                      value={`${cmd.id}-${cmd.label}`}
                      onSelect={() => runCommand(cmd)}
                    >
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
        <PaletteFooter />
      </CommandList>
    </CommandDialog>
  );
}

function PaletteFooter() {
  return (
    <div className="text-text-subtle bg-surface-muted/30 -mx-1 mt-1 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[10.5px]">
      <span className="inline-flex items-center gap-1">
        <CommandIcon className="h-3 w-3" />
        <kbd>K</kbd> to toggle
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex items-center gap-1">
          <kbd>↑</kbd>
          <kbd>↓</kbd> Navigate
        </span>
        <span className="inline-flex items-center gap-1">
          <CornerDownLeft className="h-3 w-3" /> Open
        </span>
        <span className="inline-flex items-center gap-1">
          <kbd>Esc</kbd> Close
        </span>
      </span>
    </div>
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
