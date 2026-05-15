"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpFromLine, CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
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
import { TargetPicker } from "./target-picker";
import { checkoutAssetsAction } from "@/backend/actions/checkouts";
import type { AssetPickRow, CheckoutTargetOptions } from "@/backend/services/checkouts";
import type { CheckoutTargetInput } from "@/shared/schemas/checkout";

interface Props {
  assets: AssetPickRow[];
  targets: CheckoutTargetOptions;
}

export function CheckoutWorkbench({ assets, targets }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<CheckoutTargetInput>("PERSON");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [dueAt, setDueAt] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedAssets = useMemo(
    () => assets.filter((a) => selected.has(a.id)),
    [assets, selected],
  );
  const targetLabel = useMemo(() => describeTarget(targets, target, targetId), [targets, target, targetId]);

  const canSubmit = selected.size > 0 && targetId !== null && !pending;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    if (!targetId) return;
    startTransition(async () => {
      const result = await checkoutAssetsAction({
        assetIds: Array.from(selected),
        target,
        targetId,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        notes: notes || undefined,
      });
      if (!result.ok) {
        toast.error("Checkout failed", { description: result.error });
        return;
      }
      toast.success(`Checked out ${result.data.checkedOut} asset${result.data.checkedOut === 1 ? "" : "s"}`, {
        description: targetLabel ? `Handed to ${targetLabel}` : undefined,
      });
      setConfirmOpen(false);
      setSelected(new Set());
      setTargetId(null);
      setDueAt("");
      setNotes("");
      router.refresh();
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="bg-surface flex h-[640px] flex-col overflow-hidden rounded-xl border">
          <header className="border-b px-4 py-2.5">
            <h2 className="text-text text-[13px] font-medium">1 · Pick asset(s)</h2>
            <p className="text-text-subtle text-[11.5px]">Only Available and Reserved assets are eligible.</p>
          </header>
          <div className="flex-1 overflow-hidden">
            <AssetPicker
              assets={assets}
              selected={selected}
              onToggle={toggle}
              onSelectAll={(ids) => setSelected(new Set(ids))}
              emptyHint="No available assets. Try check-in first or adjust filters."
            />
          </div>
        </section>

        <aside className="bg-surface flex h-[640px] flex-col overflow-hidden rounded-xl border">
          <header className="border-b px-4 py-2.5">
            <h2 className="text-text text-[13px] font-medium">2 · Hand off to…</h2>
            <p className="text-text-subtle text-[11.5px]">Choose target & set return policy.</p>
          </header>
          <div className="flex-1 overflow-hidden">
            <TargetPicker
              options={targets}
              target={target}
              targetId={targetId}
              onChange={(t, id) => {
                setTarget(t);
                setTargetId(id);
              }}
            />
          </div>
          <div className="space-y-3 border-t px-4 py-3">
            <div>
              <Label htmlFor="dueAt" className="text-text-muted mb-1 text-[11.5px]">
                <CalendarClock className="mr-1 inline h-3 w-3" />
                Due date <span className="text-text-subtle">(optional)</span>
              </Label>
              <Input
                id="dueAt"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className="h-8 text-[12.5px]"
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-text-muted mb-1 text-[11.5px]">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional context…"
                className="resize-none text-[12.5px]"
              />
            </div>
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!canSubmit}
              className="w-full"
              size="sm"
            >
              <ArrowUpFromLine />
              Check out {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(o) => !pending && setConfirmOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm check-out</DialogTitle>
            <DialogDescription>
              {selectedAssets.length} asset{selectedAssets.length === 1 ? "" : "s"} → {targetLabel ?? "—"}
              {dueAt ? ` · due ${dueAt}` : ""}
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-56 space-y-1 overflow-y-auto rounded-md border bg-surface-muted/30 p-2 text-[12px]">
            {selectedAssets.map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-1 py-0.5">
                <span className="asset-tag text-[11px]">{a.tag}</span>
                <span className="text-text truncate">{a.name}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={!canSubmit || pending}>
              {pending ? <Loader2 className="animate-spin" /> : <ArrowUpFromLine />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function describeTarget(
  opts: CheckoutTargetOptions,
  target: CheckoutTargetInput,
  id: string | null,
): string | null {
  if (!id) return null;
  switch (target) {
    case "USER": {
      const u = opts.users.find((x) => x.id === id);
      return u ? (u.name ?? u.email) : null;
    }
    case "PERSON": {
      const p = opts.people.find((x) => x.id === id);
      return p ? `${p.firstName} ${p.lastName}` : null;
    }
    case "SITE": {
      const s = opts.sites.find((x) => x.id === id);
      return s?.name ?? null;
    }
    case "CUSTOMER": {
      const c = opts.customers.find((x) => x.id === id);
      return c?.name ?? null;
    }
  }
}
