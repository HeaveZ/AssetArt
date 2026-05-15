"use client";

import * as React from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/components/ui/dialog";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  pending: boolean;
  triggerLabel: string;
  title: string;
  description?: string;
  submitLabel: string;
  submitDisabled?: boolean;
  onSubmit: () => void;
  onReset?: () => void;
  children: React.ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  pending,
  triggerLabel,
  title,
  description,
  submitLabel,
  submitDisabled,
  onSubmit,
  onReset,
  children,
}: FormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (pending) return;
        onOpenChange(v);
        if (!v) onReset?.();
      }}
    >
      <Button size="sm" onClick={() => onOpenChange(true)}>
        <Plus />
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-3">{children}</div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={pending || submitDisabled}>
            {pending ? <Loader2 className="animate-spin" /> : <Plus />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
