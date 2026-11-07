import { NextResponse } from "next/server";
import { UserError } from "@/lib/server/poster";
import { requireAdmin } from "@/lib/server/session";
import { confirmTopup } from "@/lib/server/topup";

/** ผู้ดูแลยืนยันว่าได้รับเงินแล้ว → เพิ่มเครดิตให้ผู้ใช้ (หน้าแอดมินใช้ server action แทน — route นี้ไว้ต่อระบบภายนอก) */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    return NextResponse.json(await confirmTopup((await params).id, admin.email));
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: e.message.includes("สิทธิ์") ? 403 : 409 });
    throw e;
  }
}
