import type { Metadata } from "next";
import { PageHeader } from "@/frontend/components/common/page-header";
import { ActivityPageFeed } from "@/frontend/components/features/activity/activity-page-feed";
import { getActivityFacets, listActivity } from "@/backend/services/activity";
import { requireSession } from "@/backend/session";

export const metadata: Metadata = { title: "Activity" };

interface SearchParams {
  actorId?: string;
  action?: string;
  resourceType?: string;
  from?: string;
  to?: string;
  page?: string;
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const page = params.page ? Math.max(1, Number(params.page)) : 1;

  const [result, facets] = await Promise.all([
    listActivity(session.workspaceId, {
      actorId: params.actorId || undefined,
      action: params.action || undefined,
      resourceType: params.resourceType || undefined,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
      page,
      pageSize: 50,
    }),
    getActivityFacets(session.workspaceId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Audit log of every state change. Filter by actor, action, resource, or date range."
      />
      <ActivityPageFeed
        rows={result.rows}
        facets={facets}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
      />
    </div>
  );
}
