import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/server/media";
import { UserError } from "@/lib/server/poster";
import { requireAdmin } from "@/lib/server/session";

export const runtime = "nodejs";

/** แอดมินอัปโหลดภาพหัวป้ายเทมเพลต A → webp → R2 โฟลเดอร์ templates/ */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new UserError("ไม่พบไฟล์");
    return NextResponse.json(await uploadImage(file, "templates"));
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: e.message.includes("สิทธิ์") ? 403 : 400 });
    console.error(e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
