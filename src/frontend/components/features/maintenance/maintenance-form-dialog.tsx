"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Textarea } from "@/frontend/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";
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
  const [assetQuery, setAssetQuery] = useState("");
  const [type, setType] = useState<MaintenanceTypeInput>("PREVENTIVE");
  const [scheduledAt, setScheduledAt] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
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
        Schedule maintenance
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Schedule maintenance</DialogTitle>
          <DialogDescription>Pick an asset, type, and target date.</DialogDescription>
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
                <p className="text-text-muted px-3 py-3 text-center text-[12px]">No matches.</p>
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
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !assetId}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
