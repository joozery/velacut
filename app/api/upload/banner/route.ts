import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/server/media";
import { UserError } from "@/lib/server/poster";
import { requireUser } from "@/lib/server/session";

export const runtime = "nodejs";

/** ลูกค้าอัปโหลดแบนเนอร์ของตัวเองสำหรับเทมเพลต B → แปลงเป็น webp → เก็บที่ R2 */
export async function POST(req: Request) {
  try {
    await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new UserError("ไม่พบไฟล์");
    return NextResponse.json(await uploadImage(file, "banners"));
  } catch (e) {
    if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: e.message.includes("เข้าสู่ระบบ") ? 401 : 400 });
    console.error(e);
    return NextResponse.json({ error: "อัปโหลดไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
