import type { Metadata } from "next";
import { PageHeader } from "@/frontend/components/common/page-header";
import { AlertsInbox } from "@/frontend/components/features/alerts/alerts-inbox";
import { listAlerts } from "@/backend/services/alerts";
import { requireSession } from "@/backend/session";
import { AlertReadStateEnum, AlertSeverityEnum, AlertTypeEnum } from "@/shared/schemas/alert";

export const metadata: Metadata = { title: "Alerts" };

interface SearchParams {
  read?: string;
  severity?: string;
  type?: string;
  page?: string;
}

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const params = await searchParams;

  const read = params.read && AlertReadStateEnum.safeParse(params.read).success
    ? AlertReadStateEnum.parse(params.read)
    : "ALL";
  const severity = params.severity && AlertSeverityEnum.safeParse(params.severity).success
    ? [AlertSeverityEnum.parse(params.severity)]
    : undefined;
  const type = params.type && AlertTypeEnum.safeParse(params.type).success
    ? [AlertTypeEnum.parse(params.type)]
    : undefined;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;

  const { rows, total, unreadCount } = await listAlerts(session.workspaceId, {
    read,
    severity,
    type,
    page,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts"
        description="Warranty, lease, license, maintenance, and overdue checkouts — sorted by severity."
      />
      <AlertsInbox rows={rows} total={total} unreadCount={unreadCount} />
    </div>
  );
}
