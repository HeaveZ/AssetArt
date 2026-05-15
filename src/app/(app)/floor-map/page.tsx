import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/common/page-header";
import { Badge } from "@/frontend/components/ui/badge";
import { FloorMapCanvas } from "@/frontend/components/features/floor-map/floor-map-canvas";
import { listFloorMapSites, listFloorMapAssets } from "@/backend/services/floor-map";

export const metadata: Metadata = { title: "Floor map" };

interface PageProps {
  searchParams: Promise<{ site?: string }>;
}

export default async function FloorMapPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.workspaceId) redirect("/login");

  const sites = await listFloorMapSites(session.user.workspaceId);
  const { site } = await searchParams;
  const initialSiteId = site && sites.some((s) => s.id === site) ? site : sites[0]?.id ?? null;

  const assets = initialSiteId
    ? await listFloorMapAssets(session.user.workspaceId, initialSiteId)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Floor map"
        description="Drag assets onto the canvas, click a pin to open its detail. Layout saves locally per site."
        meta={
          <Badge tone="orange" size="md">
            Beta · client-side
          </Badge>
        }
      />
      <FloorMapCanvas sites={sites} initialSiteId={initialSiteId} assets={assets} />
    </div>
  );
}
