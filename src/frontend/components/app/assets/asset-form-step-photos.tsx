"use client";

import { ImagePlus, Sparkles } from "lucide-react";
import { Badge } from "@/frontend/components/ui/badge";

export function StepPhotos() {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-text text-[16px] font-medium tracking-tight">Photos</h2>
        <p className="text-text-muted text-[12.5px]">
          Drop in photos of the device — useful when checking it in to verify condition.
        </p>
      </header>

      <div className="bg-surface-muted/40 dot-grid flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
        <span className="bg-surface mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl border">
          <ImagePlus className="text-text-subtle h-5 w-5" />
        </span>
        <p className="text-text text-[13px] font-medium">Photo upload arrives in milestone 11</p>
        <p className="text-text-muted mt-1 max-w-sm text-[12px] leading-relaxed">
          We&apos;ll wire UploadThing into the gallery once the storage token is set in your env.
          Your form data here is preserved — feel free to skip to Review.
        </p>
        <Badge tone="orange" size="sm" className="mt-3">
          <Sparkles className="h-3 w-3" /> Coming soon
        </Badge>
      </div>
    </div>
  );
}
