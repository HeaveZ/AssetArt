import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/frontend/components/common/page-header";
import { Button } from "@/frontend/components/ui/button";
import { Badge } from "@/frontend/components/ui/badge";
import { KpiCards } from "@/frontend/components/features/dashboard/kpi-cards";
import { RecentAssetsCard } from "@/frontend/components/features/dashboard/recent-assets";
import { ActivityFeedCard } from "@/frontend/components/features/dashboard/activity-feed";
import { AlertsWidget } from "@/frontend/components/features/dashboard/alerts-widget";
import { CategoryChart } from "@/frontend/components/features/dashboard/category-chart";
import { StatusChart } from "@/frontend/components/features/dashboard/status-chart";
import { WeeklyDiffWidget } from "@/frontend/components/features/dashboard/weekly-diff-widget";
import { getDashboardSummary } from "@/backend/services/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const workspaceId = session?.user?.workspaceId ?? "";
  const summary = await getDashboardSummary(workspaceId);

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi ${firstName} 👋`}
        description="A live picture of your portfolio — devices, leases, and what needs attention."
        meta={
          <div className="flex items-center gap-2">
            <Badge tone="success" size="md" dot="bg-success-fg">
              All systems calm
            </Badge>
            <Badge tone="muted" size="md">
              {summary.totals.totalAssets} assets
            </Badge>
          </div>
        }
        actions={
          <>
            <Button asChild variant="secondary" size="md">
              <Link href="/reports">
                Reports
                <ArrowUpRight />
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

      <KpiCards totals={summary.totals} trends={summary.trends} weekDiff={summary.weekDiff} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentAssetsCard assets={summary.recentAssets} />
        </div>
        <div className="space-y-3">
          <WeeklyDiffWidget weekDiff={summary.weekDiff} trends={summary.trends} />
          <AlertsWidget alerts={summary.alerts} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <div className="xl:col-span-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StatusChart data={summary.statusMix} />
          <CategoryChart data={summary.categoryMix} />
        </div>
        <ActivityFeedCard items={summary.activity} />
      </div>
    </div>
  );
}
