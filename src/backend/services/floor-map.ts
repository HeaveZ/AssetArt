import "server-only";
import { prisma } from "@/backend/db";
import type { AssetStatus } from "@prisma/client";

export interface FloorMapSite {
  id: string;
  name: string;
  code: string | null;
  assetCount: number;
}

export interface FloorMapAsset {
  id: string;
  tag: string;
  name: string;
  status: AssetStatus;
  category: { id: string; name: string } | null;
  location: { id: string; name: string } | null;
  assignee: { name: string | null; image: string | null } | null;
}

export async function listFloorMapSites(workspaceId: string): Promise<FloorMapSite[]> {
  const sites = await prisma.site.findMany({
    where: { workspaceId },
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: { where: { deletedAt: null } } } } },
  });
  return sites.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    assetCount: s._count.assets,
  }));
}

export async function listFloorMapAssets(
  workspaceId: string,
  siteId: string,
): Promise<FloorMapAsset[]> {
  const rows = await prisma.asset.findMany({
    where: { workspaceId, siteId, deletedAt: null },
    orderBy: { tag: "asc" },
    include: {
      category: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      assignee: { select: { name: true, image: true } },
    },
  });
  return rows.map((a) => ({
    id: a.id,
    tag: a.tag,
    name: a.name,
    status: a.status,
    category: a.category,
    location: a.location,
    assignee: a.assignee
      ? { name: a.assignee.name, image: a.assignee.image }
      : null,
  }));
}
