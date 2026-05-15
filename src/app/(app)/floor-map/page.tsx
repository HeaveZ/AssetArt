import type { Metadata } from "next";
import { Map as MapIcon } from "lucide-react";
import { PageHeader } from "@/frontend/components/app/page-header";
import { EmptyState } from "@/frontend/components/app/empty-state";
import { Badge } from "@/frontend/components/ui/badge";

export const metadata: Metadata = { title: "Floor map" };

export default function FloorMapPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Floor map"
        description="Drag and drop asset pins onto your site floor plans."
        meta={<Badge tone="orange" size="md">New · premium</Badge>}
      />
      <EmptyState
        icon={MapIcon}
        title="Floor map editor arrives in milestone 11"
        description="Upload SVG/PNG plans per site, pin assets, click a pin to open its detail."
      />
    </div>
  );
}
