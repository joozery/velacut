import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/server/media";
import { UserError } from "@/lib/server/poster";
import { requireAdmin } from "@/lib/server/session";

export const runtime = "nodejs";

/**
 * อัปโหลดรูป (แอดมินเท่านั้น) → แปลงเป็น webp → เก็บที่ Cloudflare R2
 * ใช้ route แทน server action เพราะ server action จำกัดขนาด body 1 MB
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new UserError("ไม่พบไฟล์");
    return NextResponse.json(await uploadImage(file, form.get("folder")));
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: e.message.includes("สิทธิ์") ? 403 : 400 });
    console.error(e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
