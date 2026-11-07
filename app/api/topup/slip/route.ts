import { NextResponse } from "next/server";
import { getAccount } from "@/lib/server/account";
import { UserError } from "@/lib/server/poster";
import { requireUser } from "@/lib/server/session";
import { submitSlip } from "@/lib/server/topup";

export const runtime = "nodejs";

/** อัปโหลดสลิป PromptPay ของคำสั่งเติม → ตรวจ → เติมเครดิต (multipart: id, file) */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    const id = String(form.get("id") ?? "");
    if (!(file instanceof File) || !id) throw new UserError("กรุณาเลือกรูปสลิป");
    const r = await submitSlip(user.id, id, file);
    return NextResponse.json({ ...r, account: await getAccount(user.id) });
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "ตรวจสลิปไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
