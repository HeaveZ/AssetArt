"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  Eraser,
  Eye,
  EyeOff,
  Pin,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Badge } from "@/frontend/components/ui/badge";
import { ASSET_STATUS_META } from "@/shared/constants";
import { cn } from "@/frontend/lib/utils";
import type {
  FloorMapAsset,
  FloorMapSite,
} from "@/backend/services/floor-map";

interface Props {
  sites: FloorMapSite[];
  initialSiteId: string | null;
  assets: FloorMapAsset[];
}

interface PinPosition {
  x: number;
  y: number;
}

type PinMap = Record<string, PinPosition>;

const STORAGE_PREFIX = "assetnora:floor-map:";
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.4;

export function FloorMapCanvas({ sites, initialSiteId, assets }: Props) {
  const [siteId, setSiteId] = useState(initialSiteId);
  const [pins, setPins] = useState<PinMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");
  const [showPlaced, setShowPlaced] = useState(true);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const storageKey = siteId ? `${STORAGE_PREFIX}${siteId}` : null;

  useEffect(() => {
    let next: PinMap = {};
    if (storageKey) {
      try {
        const raw = localStorage.getItem(storageKey);
        next = raw ? (JSON.parse(raw) as PinMap) : {};
      } catch {
        next = {};
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local React state with localStorage on site change
    setPins(next);
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(pins));
  }, [pins, storageKey, hydrated]);

  const placedAssets = useMemo(
    () => assets.filter((a) => pins[a.id]),
    [assets, pins],
  );

  const unplacedAssets = useMemo(() => {
    const placed = new Set(Object.keys(pins));
    const q = search.trim().toLowerCase();
    return assets.filter((a) => !placed.has(a.id) && matchesSearch(a, q));
  }, [assets, pins, search]);

  const placeAtCenter = useCallback((assetId: string) => {
    setPins((prev) => ({
      ...prev,
      [assetId]: {
        x: 50 + (Math.random() - 0.5) * 12,
        y: 50 + (Math.random() - 0.5) * 12,
      },
    }));
    setActiveAssetId(assetId);
  }, []);

  const removePin = useCallback((assetId: string) => {
    setPins((prev) => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!confirm("Tüm pin'leri sil?")) return;
    setPins({});
  }, []);

  function handlePointerDown(e: React.PointerEvent, assetId: string) {
    e.preventDefault();
    setDraggingId(assetId);
    setActiveAssetId(assetId);
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPins((prev) => ({
      ...prev,
      [draggingId]: {
        x: Math.max(2, Math.min(98, x)),
        y: Math.max(2, Math.min(98, y)),
      },
    }));
  }

  function handlePointerUp() {
    setDraggingId(null);
  }

  function handleCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    const assetId = e.dataTransfer.getData("text/asset-id");
    if (!assetId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPins((prev) => ({
      ...prev,
      [assetId]: {
        x: Math.max(2, Math.min(98, x)),
        y: Math.max(2, Math.min(98, y)),
      },
    }));
    setActiveAssetId(assetId);
  }

  const activeAsset = useMemo(
    () => assets.find((a) => a.id === activeAssetId) ?? null,
    [assets, activeAssetId],
  );

  if (sites.length === 0) {
    return (
      <div className="bg-surface flex flex-col items-center rounded-xl border px-6 py-20 text-center">
        <Pin className="text-text-subtle/60 mb-2 h-6 w-6" />
        <h3 className="text-text mb-1 text-[14px] font-semibold">No sites yet</h3>
        <p className="text-text-muted max-w-md text-[12.5px]">
          Add a site under <code className="text-[11.5px]">Settings → Sites</code> first, then return here to start placing assets on the floor.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
      {/* Sidebar */}
      <aside className="bg-surface flex flex-col gap-3 rounded-xl border p-3">
        <div className="space-y-1.5">
          <label htmlFor="fm-site" className="text-text-subtle text-[10.5px] font-medium uppercase tracking-[0.06em]">
            Site
          </label>
          <select
            id="fm-site"
            value={siteId ?? ""}
            onChange={(e) => {
              setSiteId(e.target.value || null);
              setHydrated(false);
              setActiveAssetId(null);
            }}
            className="bg-surface text-text border-border focus:border-brand-orange-500 focus:ring-brand-orange-500/30 h-8 w-full rounded-md border px-2 text-[12.5px] outline-none focus:ring-2"
          >
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.code ? ` · ${s.code}` : ""} ({s.assetCount})
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="text-text-subtle absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset…"
            className="h-8 pl-7 text-[12.5px]"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-subtle text-[10.5px] uppercase tracking-[0.06em]">
            Unplaced ({unplacedAssets.length})
          </span>
          <Button variant="ghost" size="sm" onClick={() => setShowPlaced((v) => !v)}>
            {showPlaced ? <Eye /> : <EyeOff />}
            <span className="text-[11px]">{showPlaced ? "Hide" : "Show"} placed</span>
          </Button>
        </div>

        <ul className="-mr-1 max-h-[60vh] space-y-1 overflow-y-auto pr-1">
          {unplacedAssets.length === 0 ? (
            <li className="text-text-subtle px-2 py-3 text-center text-[11.5px]">
              {search ? "No matches." : "All assets placed."}
            </li>
          ) : (
            unplacedAssets.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/asset-id", a.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDoubleClick={() => placeAtCenter(a.id)}
                  className={cn(
                    "group hover:bg-surface-muted active:scale-[0.99] flex w-full cursor-grab items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-all",
                    "focus-visible:border-brand-orange-500/40 focus-visible:outline-none",
                  )}
                  title="Drag onto map · Double-click to drop at center"
                >
                  <span className="asset-tag text-[10.5px]">{a.tag}</span>
                  <span className="text-text truncate text-[12px] font-medium">{a.name}</span>
                  <ArrowRight className="text-text-subtle ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              </li>
            ))
          )}
        </ul>

        {placedAssets.length > 0 ? (
          <div className="border-t pt-2">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-danger-fg w-full justify-start">
              <Eraser />
              Clear all pins
            </Button>
          </div>
        ) : null}
      </aside>

      {/* Canvas */}
      <div className="bg-surface relative overflow-hidden rounded-xl border">
        <div className="bg-surface-muted/40 border-border-subtle absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 border-b px-3 py-2">
          <div className="text-text-muted text-[11px]">
            <span className="text-text font-medium">{placedAssets.length}</span> placed ·
            {" "}
            <span className="text-text font-medium">{unplacedAssets.length}</span> remaining
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.2).toFixed(2)))}
              disabled={zoom <= MIN_ZOOM}
            >
              <ZoomOut />
            </Button>
            <span className="text-text-subtle min-w-[44px] text-center text-[11px] tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.2).toFixed(2)))}
              disabled={zoom >= MAX_ZOOM}
            >
              <ZoomIn />
            </Button>
          </div>
        </div>

        <div
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative aspect-[4/3] w-full select-none touch-none"
          style={{ cursor: draggingId ? "grabbing" : "default" }}
        >
          <FloorBackground zoom={zoom} />

          {showPlaced
            ? placedAssets.map((a) => (
                <PlacedPin
                  key={a.id}
                  asset={a}
                  position={pins[a.id]}
                  isActive={activeAssetId === a.id}
                  isHovered={hoveredId === a.id}
                  isDragging={draggingId === a.id}
                  onPointerDown={(e) => handlePointerDown(e, a.id)}
                  onMouseEnter={() => setHoveredId(a.id)}
                  onMouseLeave={() => setHoveredId((id) => (id === a.id ? null : id))}
                  onClick={() => setActiveAssetId(a.id)}
                />
              ))
            : null}
        </div>
      </div>

      {/* Detail panel */}
      <aside className="bg-surface flex flex-col rounded-xl border p-3">
        <AnimatePresence mode="wait">
          {activeAsset ? (
            <motion.div
              key={activeAsset.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-3"
            >
              <button
                type="button"
                onClick={() => setActiveAssetId(null)}
                className="text-text-subtle hover:text-text inline-flex items-center gap-1 text-[11px]"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              <div>
                <span className="asset-tag text-[10.5px]">{activeAsset.tag}</span>
                <h3 className="text-text mt-1 text-[15px] font-semibold leading-tight">
                  {activeAsset.name}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusPill status={activeAsset.status} />
                {activeAsset.category ? (
                  <Badge tone="muted" size="sm">
                    {activeAsset.category.name}
                  </Badge>
                ) : null}
                {activeAsset.location ? (
                  <Badge tone="muted" size="sm">
                    📍 {activeAsset.location.name}
                  </Badge>
                ) : null}
              </div>
              {activeAsset.assignee?.name ? (
                <div className="text-text-muted text-[12px]">
                  Assigned to <span className="text-text font-medium">{activeAsset.assignee.name}</span>
                </div>
              ) : (
                <div className="text-text-subtle text-[12px]">Unassigned</div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <Button asChild size="sm" className="flex-1">
                  <Link href={`/assets/${activeAsset.id}`}>
                    Open detail <ArrowRight />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removePin(activeAsset.id)}
                  className="text-danger-fg"
                >
                  <Eraser />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-text-subtle flex h-full flex-col items-center justify-center px-2 py-10 text-center text-[12px]"
            >
              <Pin className="mb-2 h-5 w-5 opacity-60" />
              Click a pin or pick an asset from the left to see details here.
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    </div>
  );
}

function FloorBackground({ zoom }: { zoom: number }) {
  const grid = 24 * zoom;
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <pattern id="floor-grid" width={grid} height={grid} patternUnits="userSpaceOnUse">
          <path
            d={`M ${grid} 0 L 0 0 0 ${grid}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border-subtle"
          />
        </pattern>
        <pattern id="floor-grid-major" width={grid * 4} height={grid * 4} patternUnits="userSpaceOnUse">
          <path
            d={`M ${grid * 4} 0 L 0 0 0 ${grid * 4}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className="text-border"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" className="fill-surface-muted/30" />
      <rect width="100%" height="100%" fill="url(#floor-grid)" />
      <rect width="100%" height="100%" fill="url(#floor-grid-major)" />
      {/* sample room outlines */}
      <g className="text-border" opacity={0.7}>
        <rect x="6%" y="8%" width="40%" height="32%" fill="none" stroke="currentColor" strokeWidth={1.5} rx={4} />
        <rect x="50%" y="8%" width="44%" height="32%" fill="none" stroke="currentColor" strokeWidth={1.5} rx={4} />
        <rect x="6%" y="44%" width="88%" height="48%" fill="none" stroke="currentColor" strokeWidth={1.5} rx={4} />
      </g>
    </svg>
  );
}

function matchesSearch(a: FloorMapAsset, q: string): boolean {
  if (!q) return true;
  if (a.tag.toLowerCase().includes(q)) return true;
  if (a.name.toLowerCase().includes(q)) return true;
  return (a.assignee?.name ?? "").toLowerCase().includes(q);
}

interface PlacedPinProps {
  asset: FloorMapAsset;
  position: PinPosition | undefined;
  isActive: boolean;
  isHovered: boolean;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

function PlacedPin({
  asset,
  position,
  isActive,
  isHovered,
  isDragging,
  onPointerDown,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: PlacedPinProps) {
  if (!position) return null;
  const meta = ASSET_STATUS_META[asset.status];
  const showTooltip = isHovered && !isDragging;
  return (
    <motion.button
      layout
      type="button"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      onPointerDown={onPointerDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
      className={cn(
        "group absolute -translate-x-1/2 -translate-y-1/2 outline-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      )}
      aria-label={`${asset.tag} · ${asset.name}`}
    >
      <span
        className={cn(
          "relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-transform",
          meta.bg,
          isActive ? "scale-110 ring-2 ring-brand-orange-500" : "group-hover:scale-110",
        )}
      >
        <span className={cn("text-[10px] font-semibold", meta.fg)}>{asset.tag.slice(-2)}</span>
        <span
          className={cn(
            "absolute -bottom-0.5 right-0 h-2 w-2 rounded-full ring-2 ring-white",
            meta.dot,
          )}
        />
      </span>
      <AnimatePresence>
        {showTooltip ? (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="bg-text text-surface pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10.5px] font-medium shadow-md"
          >
            {asset.tag} · {asset.name}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.button>
  );
}

function StatusPill({ status }: { status: FloorMapAsset["status"] }) {
  const meta = ASSET_STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
        meta.bg,
        meta.fg,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
