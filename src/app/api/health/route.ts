import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Lightweight liveness probe for docker healthchecks. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "assetart",
      time: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200, headers: { "Cache-Control": "no-store" } },
  );
}
