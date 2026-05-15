import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssetSearch } from "@/components/app/assets/asset-search";
import { AssetFiltersSheet } from "@/components/app/assets/asset-filters-sheet";
import { AssetTable } from "@/components/app/assets/asset-table";
import { getAssetFacets, listAssets } from "@/server/services/assets";
import { assetFiltersSchema, type AssetFiltersInput } from "@/schemas/asset";

export const metadata: Metadata = { title: "Assets" };

function paramToArray(value: string | string[] | undefined): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return value.split(",").filter(Boolean);
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const workspaceId = session?.user?.workspaceId ?? "";
  const raw = await searchParams;

  const filters: AssetFiltersInput = assetFiltersSchema.parse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: paramToArray(raw.status),
    siteId: paramToArray(raw.siteId),
    categoryId: paramToArray(raw.categoryId),
    assigneeId: paramToArray(raw.assigneeId),
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
  });

  const [list, facets] = await Promise.all([
    listAssets(workspaceId, filters),
    getAssetFacets(workspaceId),
  ]);

  const activeFilterCount =
    (filters.status?.length ?? 0) +
    (filters.siteId?.length ?? 0) +
    (filters.categoryId?.length ?? 0) +
    (filters.assigneeId?.length ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets"
        description="Every device, license, and peripheral in your portfolio."
        meta={
          <div className="flex items-center gap-2">
            <Badge tone="muted" size="md">
              {list.total} total
            </Badge>
            {activeFilterCount > 0 ? (
              <Badge tone="orange" size="md">
                {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"} active
              </Badge>
            ) : null}
          </div>
        }
        actions={
          <Button asChild variant="primary" size="md">
            <Link href="/assets/new">
              <Plus /> New asset
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AssetSearch />
        <div className="flex items-center gap-2">
          <AssetFiltersSheet facets={facets} />
        </div>
      </div>

      <AssetTable
        rows={list.rows}
        total={list.total}
        page={list.page}
        pageSize={list.pageSize}
        currentFilters={filters}
      />
    </div>
  );
}
