import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/session";
import { UserError } from "@/lib/server/poster";
import { slipArchive } from "@/lib/server/slip-archive";

export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UserError) return NextResponse.json({ error: "ไม่มีสิทธิ์ผู้ดูแล" }, { status: 403 });
    throw error;
  }
  const { id } = await params;
  const slip = await (await slipArchive()).findOne({ _id: id });
  if (!slip) return NextResponse.json({ error: "ไม่พบรูปสลิป" }, { status: 404 });
  return new Response(new Uint8Array(slip.image.buffer), { headers: {
    "Content-Type": "image/webp", "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff", "Content-Disposition": 'inline; filename="slip.webp"',
  } });
}
