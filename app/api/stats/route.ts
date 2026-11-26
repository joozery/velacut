import { NextResponse } from "next/server";
import { getSiteStats } from "@/lib/server/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getSiteStats(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("getSiteStats failed", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
