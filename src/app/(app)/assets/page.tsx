import type { Metadata } from "next";
import Link from "next/link";
import { FileUp, Plus } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/common/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { AssetSearch } from "@/frontend/components/features/assets/asset-search";
import { AssetFiltersSheet } from "@/frontend/components/features/assets/asset-filters-sheet";
import { AssetTable } from "@/frontend/components/features/assets/asset-table";
import { getAssetFacets, listAssets } from "@/backend/services/assets";
import { getMyAssetColumnPrefs } from "@/backend/services/saved-views";
import {
  ASSET_COLUMN_IDS,
  DEFAULT_VISIBLE_COLUMNS,
  type AssetColumnId,
} from "@/shared/asset-columns";
import { assetFiltersSchema, type AssetFiltersInput } from "@/shared/schemas/asset";

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
    brand: typeof raw.brand === "string" ? raw.brand : undefined,
    model: typeof raw.model === "string" ? raw.model : undefined,
    serial: typeof raw.serial === "string" ? raw.serial : undefined,
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    sort: typeof raw.sort === "string" ? raw.sort : undefined,
    order: typeof raw.order === "string" ? raw.order : undefined,
  });

  const ownerId = session?.user?.id ?? "";
  const [list, facets, columnPrefs] = await Promise.all([
    listAssets(workspaceId, filters),
    getAssetFacets(workspaceId),
    ownerId ? getMyAssetColumnPrefs(workspaceId, ownerId) : Promise.resolve(null),
  ]);

  const initialOrder: AssetColumnId[] =
    columnPrefs?.order ?? ([...ASSET_COLUMN_IDS] as AssetColumnId[]);
  const initialVisible: AssetColumnId[] = columnPrefs?.visible ?? DEFAULT_VISIBLE_COLUMNS;

  const activeFilterCount =
    (filters.status?.length ?? 0) +
    (filters.siteId?.length ?? 0) +
    (filters.categoryId?.length ?? 0) +
    (filters.assigneeId?.length ?? 0) +
    (filters.brand ? 1 : 0) +
    (filters.model ? 1 : 0) +
    (filters.serial ? 1 : 0);

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
          <>
            <Button asChild variant="secondary" size="md">
              <Link href="/assets/import">
                <FileUp /> Bulk CSV
              </Link>
            </Button>
            <Button asChild variant="primary" size="md">
              <Link href="/assets/new">
                <Plus /> New asset
              </Link>
            </Button>
          </>
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
        initialOrder={initialOrder}
        initialVisible={initialVisible}
      />
    </div>
  );
}
