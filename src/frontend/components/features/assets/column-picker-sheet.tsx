"use client";

import { useMemo, useState, useTransition } from "react";
import { Reorder, useDragControls } from "motion/react";
import { Eye, EyeOff, GripVertical, RotateCcw, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/frontend/components/ui/sheet";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { Separator } from "@/frontend/components/ui/separator";
import { cn } from "@/frontend/lib/utils";
import {
  ASSET_COLUMN_IDS,
  ASSET_COLUMN_LABELS,
  DEFAULT_VISIBLE_COLUMNS,
  PINNED_COLUMNS,
  type AssetColumnId,
} from "@/shared/asset-columns";
import { saveAssetColumnPrefsAction } from "@/backend/actions/saved-views";

interface Props {
  /** Ordered list of column ids, head-to-tail. Source of truth lives in parent. */
  order: AssetColumnId[];
  /** Set of column ids currently visible. */
  visible: Set<AssetColumnId>;
  /** Called on every change — parent re-renders with the new layout immediately. */
  onChange: (next: { order: AssetColumnId[]; visible: Set<AssetColumnId> }) => void;
}

/**
 * Drag-to-reorder column picker.
 *
 * The picker is "controlled" — every interaction calls `onChange` and the
 * parent owns the canonical state. Saving to the server is an explicit
 * action via the Save button below.
 */
export function ColumnPickerSheet({ order, visible, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const totalToggleable = useMemo(
    () => ASSET_COLUMN_IDS.filter((id) => !PINNED_COLUMNS.includes(id)).length,
    [],
  );
  const visibleCount = visible.size;

  function toggle(id: AssetColumnId) {
    if (PINNED_COLUMNS.includes(id)) return;
    const nextVisible = new Set(visible);
    if (nextVisible.has(id)) nextVisible.delete(id);
    else nextVisible.add(id);
    onChange({ order, visible: nextVisible });
  }

  function reorder(next: AssetColumnId[]) {
    onChange({ order: next, visible });
  }

  function resetToDefaults() {
    onChange({
      order: [...ASSET_COLUMN_IDS] as AssetColumnId[],
      visible: new Set<AssetColumnId>(DEFAULT_VISIBLE_COLUMNS),
    });
    toast("Layout reset", { description: "Default columns restored." });
  }

  function saveLayout() {
    startTransition(async () => {
      const payload = {
        order,
        visible: Array.from(visible),
      };
      const res = await saveAssetColumnPrefsAction(payload);
      if (res.ok) {
        toast.success("Layout saved", {
          description: "Your column setup is remembered for next time.",
        });
      } else {
        toast.error("Couldn't save layout", { description: res.error });
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings2 />
          Setup columns
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Setup columns
            <Badge tone="muted" size="sm">
              {visibleCount}/{totalToggleable + PINNED_COLUMNS.length}
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Drag to reorder, toggle the eye to hide. Save to remember it for next time.
          </SheetDescription>
        </SheetHeader>

        <div className="-mx-4 mt-4 max-h-[calc(100vh-220px)] overflow-y-auto px-4">
          <Reorder.Group
            axis="y"
            values={order}
            onReorder={(next) => reorder(next as AssetColumnId[])}
            className="space-y-1"
          >
            {order.map((id) => (
              <ColumnRow
                key={id}
                id={id}
                visible={visible.has(id)}
                pinned={PINNED_COLUMNS.includes(id)}
                onToggle={() => toggle(id)}
              />
            ))}
          </Reorder.Group>
        </div>

        <Separator className="my-4" />

        <SheetFooter className="!flex-col gap-2 sm:!flex-row sm:justify-between">
          <Button variant="ghost" size="sm" onClick={resetToDefaults}>
            <RotateCcw /> Reset defaults
          </Button>
          <Button variant="primary" size="sm" onClick={saveLayout} disabled={pending}>
            <Save />
            {pending ? "Saving…" : "Save layout"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ColumnRow({
  id,
  visible,
  pinned,
  onToggle,
}: {
  id: AssetColumnId;
  visible: boolean;
  pinned: boolean;
  onToggle: () => void;
}) {
  const dragControls = useDragControls();
  const label = ASSET_COLUMN_LABELS[id] ?? id;

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.01, boxShadow: "0 8px 24px -8px rgba(0,0,0,0.25)" }}
      className={cn(
        "group/col bg-surface flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors",
        visible ? "border-border" : "border-border-subtle bg-surface-muted/40",
      )}
    >
      <button
        type="button"
        aria-label={`Drag ${label}`}
        onPointerDown={(e) => dragControls.start(e)}
        className="text-text-subtle hover:text-text touch-none cursor-grab rounded p-0.5 transition-colors active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <span
        className={cn(
          "flex-1 truncate text-[12.5px]",
          visible ? "text-text" : "text-text-muted",
        )}
      >
        {label}
      </span>
      {pinned ? (
        <Badge tone="muted" size="sm">
          Pinned
        </Badge>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className={cn(
            "text-text-subtle hover:text-text rounded p-1 transition-colors",
            visible && "text-text",
          )}
        >
          {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      )}
    </Reorder.Item>
  );
}
