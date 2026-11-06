import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { isLibraryGame } from "@/lib/assets";

export const runtime = "nodejs";

/**
 * ดาวน์โหลดภาพสกินเป็น PNG
 * - รับเฉพาะ id ที่มีอยู่จริงใน catalog (กัน path traversal — ไม่เอา input ไปต่อ path ตรงๆ)
 * Phase 5: เปลี่ยนเป็นอ่านจาก object storage
 */
export async function GET(_req: Request, { params }: { params: Promise<{ game: string; file: string }> }) {
  const { game, file } = await params;
  if (!isLibraryGame(game)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const skin = getCatalog(game).skinById.get(`${game}-${file}`);
  if (!skin) return NextResponse.json({ error: "not_found" }, { status: 404 });

  try {
    // skin.image มาจาก catalog (ค่าที่เราสร้างเอง) ไม่ใช่จาก request
    const src = path.join(process.cwd(), "public", skin.image);
    const png = await sharp(await readFile(src)).png({ compressionLevel: 9 }).toBuffer();
    const ascii = `${skin.heroName}-${skin.name}`.replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "skin";
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${ascii}.png"; filename*=UTF-8''${encodeURIComponent(`${skin.heroName} - ${skin.name}.png`)}`,
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
