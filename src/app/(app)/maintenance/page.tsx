import type { Metadata } from "next";
import { PageHeader } from "@/frontend/components/common/page-header";
import { MaintenanceList } from "@/frontend/components/features/maintenance/maintenance-list";
import { MaintenanceFormDialog } from "@/frontend/components/features/maintenance/maintenance-form-dialog";
import {
  getMaintenanceAssetOptions,
  listMaintenance,
} from "@/backend/services/maintenance";
import { requireSession } from "@/backend/session";
import { MaintenanceStatusEnum } from "@/shared/schemas/maintenance";

export const metadata: Metadata = { title: "Maintenance" };

interface SearchParams {
  status?: string;
  page?: string;
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const statusParam = params.status?.trim();
  const status = statusParam && MaintenanceStatusEnum.safeParse(statusParam).success
    ? [MaintenanceStatusEnum.parse(statusParam)]
    : undefined;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;

  const [{ rows, counts, total }, assets] = await Promise.all([
    listMaintenance(session.workspaceId, { status, page, pageSize: 50 }),
    getMaintenanceAssetOptions(session.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Schedule, start, and complete maintenance jobs across the fleet."
        actions={<MaintenanceFormDialog assets={assets} />}
      />
      <MaintenanceList rows={rows} counts={counts} total={total} />
    </div>
  );
}
