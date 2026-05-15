"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
import { createLeaseAction } from "@/backend/actions/leases";
import type { LeaseAssetOption } from "@/backend/services/leases";

interface Props {
  assets: LeaseAssetOption[];
}

export function LeaseFormDialog({ assets }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [assetQuery, setAssetQuery] = useState("");
  const [vendor, setVendor] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const filteredAssets = useMemo(() => {
    const q = assetQuery.trim().toLowerCase();
    if (!q) return assets.slice(0, 50);
    return assets
      .filter((a) => `${a.tag} ${a.name}`.toLowerCase().includes(q))
      .slice(0, 50);
  }, [assets, assetQuery]);

  function reset() {
    setAssetId("");
    setAssetQuery("");
    setVendor("");
    setContractRef("");
    setStartDate("");
    setEndDate("");
    setMonthlyCost("");
    setAutoRenew(false);
    setNotes("");
  }

  function handleSubmit() {
    if (!assetId) return toast.error("Pick an asset");
    if (!vendor.trim()) return toast.error("Vendor is required");
    if (!startDate || !endDate) return toast.error("Start and end dates are required");
    if (!monthlyCost) return toast.error("Monthly cost is required");

    startTransition(async () => {
      const result = await createLeaseAction({
        assetId,
        vendor,
        contractRef: contractRef || undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyCost: Number(monthlyCost),
        currency: "USD",
        autoRenew,
        notes: notes || undefined,
      });
      if (!result.ok) {
        toast.error("Couldn't create lease", { description: result.error });
        return;
      }
      toast.success("Lease created");
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!pending) {
          setOpen(v);
          if (!v) reset();
        }
      }}
    >
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        New lease
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New lease</DialogTitle>
          <DialogDescription>Only assets without an existing lease are shown.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="mb-1 text-[11.5px]">Asset</Label>
            <div className="relative">
              <Search className="text-text-subtle pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" />
              <Input
                value={assetQuery}
                onChange={(e) => setAssetQuery(e.target.value)}
                placeholder="Search by tag or name…"
                className="h-8 pl-8 text-[12.5px]"
              />
            </div>
            <div className="mt-1.5 max-h-40 overflow-y-auto rounded-md border">
              {filteredAssets.length === 0 ? (
                <p className="text-text-muted px-3 py-3 text-center text-[12px]">
                  No leasable assets. Existing leases hide their assets.
                </p>
              ) : (
                <ul className="divide-y divide-border-subtle">
                  {filteredAssets.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setAssetId(a.id)}
                        className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                          assetId === a.id
                            ? "bg-brand-orange-500/5 text-text"
                            : "hover:bg-surface-muted/60 text-text-muted"
                        }`}
                      >
                        <span className="asset-tag text-[11px]">{a.tag}</span>
                        <span className="truncate">{a.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="l-vendor" className="mb-1 text-[11.5px]">
                Vendor
              </Label>
              <Input
                id="l-vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="h-8 text-[12.5px]"
                placeholder="e.g. DLL Finance"
              />
            </div>
            <div>
              <Label htmlFor="l-ref" className="mb-1 text-[11.5px]">
                Contract ref
              </Label>
              <Input
                id="l-ref"
                value={contractRef}
                onChange={(e) => setContractRef(e.target.value)}
                placeholder="Optional"
                className="h-8 text-[12.5px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="l-start" className="mb-1 text-[11.5px]">
                Start date
              </Label>
              <Input
                id="l-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-[12.5px]"
              />
            </div>
            <div>
              <Label htmlFor="l-end" className="mb-1 text-[11.5px]">
                End date
              </Label>
              <Input
                id="l-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-[12.5px]"
              />
            </div>
            <div>
              <Label htmlFor="l-cost" className="mb-1 text-[11.5px]">
                Monthly cost (USD)
              </Label>
              <Input
                id="l-cost"
                type="number"
                min={0}
                step="0.01"
                value={monthlyCost}
                onChange={(e) => setMonthlyCost(e.target.value)}
                className="h-8 text-[12.5px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="l-auto" className="text-[12.5px]">
              Auto-renew
              <span className="text-text-subtle ml-1 text-[11px]">
                Lease automatically renews at end date
              </span>
            </Label>
            <Switch id="l-auto" checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>

          <div>
            <Label htmlFor="l-notes" className="mb-1 text-[11.5px]">
              Notes
            </Label>
            <Textarea
              id="l-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context…"
              className="resize-none text-[12.5px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            Create lease
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
