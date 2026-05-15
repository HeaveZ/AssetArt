"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import { AssetQuickPicker } from "@/frontend/components/common/asset-quick-picker";
import { FormDialog } from "@/frontend/components/common/form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { createMaintenanceAction } from "@/backend/actions/maintenance";
import { MAINTENANCE_TYPE_META } from "@/shared/constants";
import type { MaintenanceTypeInput } from "@/shared/schemas/maintenance";
import type { MaintenanceAssetOption } from "@/backend/services/maintenance";

interface Props {
  assets: MaintenanceAssetOption[];
}

const TYPES: MaintenanceTypeInput[] = ["PREVENTIVE", "CORRECTIVE", "INSPECTION", "CALIBRATION"];

export function MaintenanceFormDialog({ assets }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string>("");
  const [type, setType] = useState<MaintenanceTypeInput>("PREVENTIVE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setAssetId("");
    setType("PREVENTIVE");
    setScheduledAt("");
    setVendor("");
    setDescription("");
    setCost("");
  }

  function handleSubmit() {
    if (!assetId) {
      toast.error("Pick an asset first");
      return;
    }
    startTransition(async () => {
      const result = await createMaintenanceAction({
        assetId,
        type,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        vendor: vendor || undefined,
        description: description || undefined,
        cost: cost ? Number(cost) : undefined,
      });
      if (!result.ok) {
        toast.error("Couldn't schedule", { description: result.error });
        return;
      }
      toast.success("Maintenance scheduled");
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
      triggerLabel="Schedule maintenance"
      title="Schedule maintenance"
      description="Pick an asset, type, and target date."
      submitLabel="Schedule"
      submitDisabled={!assetId}
      onSubmit={handleSubmit}
    >
      <AssetQuickPicker assets={assets} value={assetId} onChange={setAssetId} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 text-[11.5px]">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as MaintenanceTypeInput)}>
            <SelectTrigger className="h-8 text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {MAINTENANCE_TYPE_META[t].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="m-scheduled" className="mb-1 text-[11.5px]">
            Scheduled date
          </Label>
          <Input
            id="m-scheduled"
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="h-8 text-[12.5px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="m-vendor" className="mb-1 text-[11.5px]">
            Vendor
          </Label>
          <Input
            id="m-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Optional"
            className="h-8 text-[12.5px]"
          />
        </div>
        <div>
          <Label htmlFor="m-cost" className="mb-1 text-[11.5px]">
            Estimated cost
          </Label>
          <Input
            id="m-cost"
            type="number"
            min={0}
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="0.00"
            className="h-8 text-[12.5px]"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="m-desc" className="mb-1 text-[11.5px]">
          Description
        </Label>
        <Textarea
          id="m-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs to be done?"
          className="resize-none text-[12.5px]"
        />
      </div>
    </FormDialog>
  );
}
