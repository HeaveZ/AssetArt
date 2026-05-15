import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/server/db";
import { AppSidebar } from "@/components/app/app-sidebar";
import { TopBar } from "@/components/app/top-bar";
import type { ActiveSession } from "@/server/session";

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

  let workspace = { name: "Evam Tech", siteCount: 0 };
  try {
    const ws = await prisma.workspace.findUnique({
      where: { id: activeSession.workspaceId },
      select: { name: true, _count: { select: { sites: true } } },
    });
    if (ws) workspace = { name: ws.name, siteCount: ws._count.sites };
  } catch {
    // DB may be unavailable in dev — fall back to placeholder
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <AppSidebar workspace={workspace} session={activeSession} />
      <div className="lg:pl-[var(--sidebar-width)]">
        <TopBar />
        <main className="px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
