import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";
import { getGame } from "@/lib/games";
import { hashString } from "@/lib/utils";

import { MAX_UPLOAD_BYTES } from "@/lib/limits";

/**
 * STUB: ตรวจจับสกินจาก screenshot
 * ตอนนี้ตรวจไฟล์แล้วสุ่มสกินจากคลังแบบ deterministic (ไฟล์เดิม → ผลเดิม)
 * ภายหลังเปลี่ยนเป็นเรียก vision model / image matching จริง
 */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  const game = getGame(String(form.get("game") ?? ""));

  if (!game || game.mode !== "library") return NextResponse.json({ error: "invalid_game" }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "missing_file" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "invalid_type" }, { status: 415 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "too_large" }, { status: 413 });

  const { skins } = getCatalog(game.slug);
  const seed = hashString(`${file.name}:${file.size}`);
  const count = 6 + (seed % 5); // 6–10 สกิน
  const picked = new Set<string>();
  for (let i = 0; picked.size < count && i < count * 4; i++) {
    picked.add(skins[hashString(`${seed}:${i}`) % skins.length].id);
  }

  // จำลองเวลาประมวลผล
  await new Promise((r) => setTimeout(r, 700));
  return NextResponse.json({ stub: true, skinIds: [...picked] });
}
