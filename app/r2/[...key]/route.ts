import { publicBaseUrl } from "@/lib/server/storage";
import { R2_KEY } from "@/lib/media-url";

export const runtime = "nodejs";

/**
 * ส่งรูปจาก bucket R2 ของเราผ่านโดเมนเดียวกับเว็บ — ให้ html-to-image ฝังรูปลงไฟล์ PNG ได้
 * รับเฉพาะ key รูปแบบที่ระบบอัปโหลดของเราสร้าง (ไม่ใช่ proxy เปิด)
 */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const base = publicBaseUrl();
  if (!base || !R2_KEY.test(key)) return new Response("Not found", { status: 404 });
  const res = await fetch(`${base}/${key}`, { cache: "force-cache" }).catch(() => null);
  if (!res?.ok || !res.body) return new Response("Not found", { status: 404 });
  return new Response(res.body, {
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "image/webp",
      // key มี uuid ไม่ซ้ำ — เนื้อหาไม่เปลี่ยน
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
