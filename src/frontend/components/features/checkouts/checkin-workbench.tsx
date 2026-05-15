"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Label } from "@/frontend/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { AssetPicker } from "./asset-picker";
import { checkinAssetsAction } from "@/backend/actions/checkouts";
import type { AssetPickRow } from "@/backend/services/checkouts";

interface Props {
  assets: AssetPickRow[];
}

export function CheckinWorkbench({ assets }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedAssets = useMemo(() => assets.filter((a) => selected.has(a.id)), [assets, selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await checkinAssetsAction({
        assetIds: Array.from(selected),
        notes: notes || undefined,
      });
      if (!result.ok) {
        toast.error("Check-in failed", { description: result.error });
        return;
      }
      toast.success(`Checked in ${result.data.checkedIn} asset${result.data.checkedIn === 1 ? "" : "s"}`);
      setConfirmOpen(false);
      setSelected(new Set());
      setNotes("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="bg-surface flex h-[640px] flex-col overflow-hidden rounded-xl border">
          <header className="border-b px-4 py-2.5">
            <h2 className="text-text text-[13px] font-medium">1 · Pick asset(s) to return</h2>
            <p className="text-text-subtle text-[11.5px]">Showing currently checked-out assets.</p>
          </header>
          <div className="flex-1 overflow-hidden">
            <AssetPicker
              assets={assets}
              selected={selected}
              onToggle={toggle}
              onSelectAll={(ids) => setSelected(new Set(ids))}
              emptyHint="Nothing is checked out right now."
            />
          </div>
        </section>

        <aside className="bg-surface flex h-[640px] flex-col overflow-hidden rounded-xl border">
          <header className="border-b px-4 py-2.5">
            <h2 className="text-text text-[13px] font-medium">2 · Confirm return</h2>
            <p className="text-text-subtle text-[11.5px]">Assets flip back to Available on submit.</p>
          </header>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {selectedAssets.length === 0 ? (
              <p className="text-text-muted text-[12px]">Nothing selected.</p>
            ) : (
              <ul className="space-y-1">
                {selectedAssets.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-[12px]">
                    <span className="asset-tag text-[11px]">{a.tag}</span>
                    <span className="text-text truncate">{a.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-3 border-t px-4 py-3">
            <div>
              <Label htmlFor="checkin-notes" className="text-text-muted mb-1 text-[11.5px]">
                Notes
              </Label>
              <Textarea
                id="checkin-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Condition / observations…"
                className="resize-none text-[12.5px]"
              />
            </div>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.size === 0 || pending}
              className="w-full"
              size="sm"
            >
              <ArrowDownToLine />
              Check in {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !pending && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm check-in</DialogTitle>
            <DialogDescription>
              {selectedAssets.length} asset{selectedAssets.length === 1 ? "" : "s"} will be returned to inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <ArrowDownToLine />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
