/**
 * ดึงไอคอนเกมทางการจาก App Store (iTunes Lookup API — ไม่ต้องใช้ key)
 *   npm run import:icons
 * ผลลัพธ์: public/games/<slug>.webp (256×256)
 * หมายเหตุ: เกมเปลี่ยนไอคอนตามอีเวนต์ (เช่น Free Fire คอลแลบ) — รันใหม่เมื่ออยากอัปเดต
 * ไอคอน/โลโก้เป็นเครื่องหมายการค้าของ Garena / Moonton ใช้เพื่อระบุชื่อเกมเท่านั้น
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const APPS = { rov: 1150337432, mlbb: 1160056295, freefire: 1300146617 } as const;

async function main() {
  const ids = Object.values(APPS).join(",");
  const res = await fetch(`https://itunes.apple.com/lookup?id=${ids}&country=th`, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`lookup ${res.status}`);
  const { results } = (await res.json()) as { results: { trackId: number; trackName: string; artworkUrl512: string }[] };

  await mkdir(path.join(ROOT, "public/games"), { recursive: true });
  for (const [slug, id] of Object.entries(APPS)) {
    const app = results.find((r) => r.trackId === id);
    if (!app) {
      console.warn(`✗ ${slug}: ไม่พบแอป ${id}`);
      continue;
    }
    const img = await fetch(app.artworkUrl512, { signal: AbortSignal.timeout(30_000) });
    if (!img.ok) throw new Error(`${slug} icon ${img.status}`);
    const out = path.join(ROOT, "public/games", `${slug}.webp`);
    await sharp(Buffer.from(await img.arrayBuffer()), { failOn: "error" }).resize(256, 256).webp({ quality: 85 }).toFile(out);
    console.log(`✓ ${slug}: ${app.trackName}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
