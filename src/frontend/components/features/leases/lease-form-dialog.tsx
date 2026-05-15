"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { Switch } from "@/frontend/components/ui/switch";
import { AssetQuickPicker } from "@/frontend/components/common/asset-quick-picker";
import { FormDialog } from "@/frontend/components/common/form-dialog";
import { createLeaseAction } from "@/backend/actions/leases";
import type { LeaseAssetOption } from "@/backend/services/leases";

interface Props {
  assets: LeaseAssetOption[];
}

export function LeaseFormDialog({ assets }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [vendor, setVendor] = useState("");
  const [contractRef, setContractRef] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthlyCost, setMonthlyCost] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setAssetId("");
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
    <FormDialog
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onReset={reset}
      triggerLabel="New lease"
      title="New lease"
      description="Only assets without an existing lease are shown."
      submitLabel="Create lease"
      onSubmit={handleSubmit}
    >
      <AssetQuickPicker
        assets={assets}
        value={assetId}
        onChange={setAssetId}
        emptyHint="No leasable assets. Existing leases hide their assets."
      />

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
    </FormDialog>
  );
}
