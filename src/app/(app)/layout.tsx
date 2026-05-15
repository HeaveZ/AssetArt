import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/backend/db";
import { AppSidebar } from "@/frontend/components/layout/app-sidebar";
import { TopBar } from "@/frontend/components/layout/top-bar";
import { getUnreadAlertCount } from "@/backend/services/alerts";
import type { ActiveSession } from "@/backend/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const activeSession: ActiveSession = {
    userId: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    role: session.user.role,
    workspaceId: session.user.workspaceId,
  };

  let workspace = { name: "AssetArt", siteCount: 0 };
  let unreadAlerts = 0;
  try {
    const [ws, alerts] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: activeSession.workspaceId },
        select: { name: true, _count: { select: { sites: true } } },
      }),
      getUnreadAlertCount(activeSession.workspaceId),
    ]);
    if (ws) workspace = { name: ws.name, siteCount: ws._count.sites };
    unreadAlerts = alerts;
  } catch {
    // DB may be unavailable in dev — fall back to placeholder
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <AppSidebar workspace={workspace} session={activeSession} />
      <div className="lg:pl-[var(--sidebar-width)]">
        <TopBar unreadAlerts={unreadAlerts} />
        <main className="px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
