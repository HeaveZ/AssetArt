import type { Metadata } from "next";
import { PageHeader } from "@/frontend/components/common/page-header";
import { LeasesList } from "@/frontend/components/features/leases/leases-list";
import { LeaseFormDialog } from "@/frontend/components/features/leases/lease-form-dialog";
import { getLeaseAssetOptions, listLeases } from "@/backend/services/leases";
import { requireSession } from "@/backend/session";
import { LeaseSegmentEnum } from "@/shared/schemas/lease";

export const metadata: Metadata = { title: "Leases" };

interface SearchParams {
  segment?: string;
}

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const segmentParam = params.segment?.trim();
  const segment = segmentParam && LeaseSegmentEnum.safeParse(segmentParam).success
    ? LeaseSegmentEnum.parse(segmentParam)
    : "ALL";

  const [{ rows, counts }, assets] = await Promise.all([
    listLeases(session.workspaceId, segment),
    getLeaseAssetOptions(session.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description="Active leases, upcoming renewals, and 60-day expiring alerts."
        actions={<LeaseFormDialog assets={assets} />}
      />
      <LeasesList rows={rows} counts={counts} />
    </div>
  );
}
