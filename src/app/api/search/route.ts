import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/backend/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 8;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.workspaceId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ ok: true, results: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const rows = await prisma.asset.findMany({
    where: {
      workspaceId: session.user.workspaceId,
      deletedAt: null,
      OR: [
        { tag: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { serialNumber: { contains: q, mode: "insensitive" } },
      ],
    },
    take: LIMIT,
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      tag: true,
      name: true,
      status: true,
      brand: true,
      model: true,
    },
  });

  return NextResponse.json(
    { ok: true, results: rows },
    { headers: { "Cache-Control": "no-store" } },
  );
}
