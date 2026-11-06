/**
 * ดึงข้อมูล + ภาพสกินจริงมาเก็บในโปรเจค
 *
 *   npm run import:skins                     # สกิน + ระดับเมต้าฮีโร่ MLBB
 *   npm run import:skins -- --limit 5        # ทดสอบ 5 ฮีโร่แรก
 *   npm run import:skins -- --rankings-only  # อัปเดตเฉพาะระดับเมต้า + ตราแรงค์ (แนะนำรันทุกสัปดาห์)
 *
 * ผลลัพธ์
 *   data/catalog/<game>.json      — รายชื่อฮีโร่/สกิน/ระดับ (lib/catalog.ts อ่านไฟล์นี้)
 *   data/catalog/mlbb-rankings.json — ระดับเมต้าฮีโร่ S+…C + winrate/banrate (lib/rankings.ts)
 *   public/ranks/<rank>.webp       — ตราแรงค์ผู้เล่น Warrior…Mythic Immortal (lib/ranks.ts)
 *   public/skins/<game>/<file>.webp — ภาพการ์ดสกิน (resize + แปลง webp แล้ว)
 *   .cache/skins-src/             — ไฟล์ดิบที่ดาวน์โหลด (ไม่ commit, รันซ้ำไม่ต้องโหลดใหม่)
 *
 * แหล่งข้อมูล
 *   MLBB : mlbbdex.com API (ข้อมูล CC BY-SA จาก Mobile Legends wiki) — จำกัด 90 req/นาที
 * ภาพสกินเป็นลิขสิทธิ์ของ Moonton
 *
 * Phase 4: เปลี่ยนปลายทางจาก JSON → MongoDB และภาพ → object storage
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { GAME_TIERS, type LibraryGame } from "../lib/tiers";
import { compareText } from "../lib/utils";

const ROOT = path.resolve(__dirname, "..");
const CACHE = path.join(ROOT, ".cache/skins-src");
const UA = "velacut-skin-import/0.1";

export type CatalogFile = {
  game: LibraryGame;
  source: string;
  generatedAt: string;
  heroes: { id: string; name: string }[];
  /** f = ชื่อไฟล์ภาพ (ไม่มีนามสกุล), h = hero id, n = ชื่อสกิน, t = tier code, l = label/ซีรีส์ (ถ้ามี) */
  skins: { f: string; h: string; n: string; t: string; l?: string }[];
};

// ───────────────────────── helpers ─────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

async function fetchWithRetry(url: string, tries = 4): Promise<Response> {
  for (let i = 0; ; i++) {
    let res: Response;
    try {
      res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000) });
    } catch (e) {
      // network error / timeout → ลองใหม่
      if (i >= tries - 1) throw e;
      const wait = 3000 * (i + 1);
      console.warn(`  ↻ ${(e as Error).cause ?? (e as Error).message} — รอ ${wait / 1000}s แล้วลองใหม่ (${url})`);
      await sleep(wait);
      continue;
    }
    if (res.ok) return res;
    if (i >= tries - 1 || ![429, 500, 502, 503, 504].includes(res.status)) {
      throw new Error(`${res.status} ${url}`);
    }
    const wait = Number(res.headers.get("retry-after") ?? 0) * 1000 || 2000 * (i + 1);
    console.warn(`  ↻ ${res.status} — รอ ${wait / 1000}s แล้วลองใหม่`);
    await sleep(wait);
  }
}

/** ดาวน์โหลดไฟล์ไปยัง cache (ถ้ามีแล้วข้าม) */
async function cached(url: string, file: string): Promise<Buffer> {
  if (existsSync(file)) return readFile(file);
  const buf = Buffer.from(await (await fetchWithRetry(url)).arrayBuffer());
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, buf);
  return buf;
}

/** ตรวจว่าเป็นรูปจริง → resize → webp */
async function writeCard(input: Buffer, out: string, width: number) {
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(input, { failOn: "error" }).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
}

/** รันงานทีละ n ตัวพร้อมกัน */
async function pool<T>(items: T[], n: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i], i);
      }
    }),
  );
}

const validTiers = (game: LibraryGame) => new Set(GAME_TIERS[game].map((t) => t.code));

// ───────────────────────── MLBB ─────────────────────────
type MlbbHeroLite = { slug: string; name: string };
type MlbbHero = {
  slug: string;
  name: string;
  skins: { id: string; name: string; rarity?: string | null; label?: string | null }[];
  images: { skins: Record<string, string> };
};
const MLBB = "https://mlbbdex.com";

async function importMlbb(limit?: number): Promise<CatalogFile> {
  const dir = path.join(CACHE, "mlbb");
  console.log("• MLBB: ดึงรายชื่อฮีโร่จาก mlbbdex.com");
  const list = JSON.parse((await cached(`${MLBB}/api/v1/heroes`, path.join(dir, "heroes.json"))).toString()).data as MlbbHeroLite[];
  const heroesLite = limit ? list.slice(0, limit) : list;
  const tiers = validTiers("mlbb");

  // รายละเอียดฮีโร่ทีละตัว (≤ 85 req/นาที)
  const heroes: MlbbHero[] = [];
  for (const [i, h] of heroesLite.entries()) {
    const file = path.join(dir, "heroes", `${h.slug}.json`);
    const hit = existsSync(file);
    const json = JSON.parse((await cached(`${MLBB}/api/v1/heroes/${h.slug}`, file)).toString());
    heroes.push(json.data ?? json);
    if (!hit) await sleep(720);
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${heroesLite.length} ฮีโร่`);
  }

  // จับคู่สกิน ↔ ไฟล์ภาพด้วยชื่อ (ไฟล์ภาพชื่อ "<num>-<slug-ชื่อสกิน>.webp")
  type Job = { hero: MlbbHero; name: string; tier: string; label?: string; url: string; file: string };
  const jobs: Job[] = [];
  let unmatched = 0;
  for (const hero of heroes) {
    const bySlug = new Map(
      Object.values(hero.images?.skins ?? {}).map((p) => [slugify(p.split("/").pop()!.replace(/\.\w+$/, "").replace(/^\d+-/, "")), p]),
    );
    for (const s of hero.skins ?? []) {
      const p = bySlug.get(slugify(s.name));
      if (!p) {
        unmatched++;
        continue;
      }
      const tier = s.rarity && tiers.has(s.rarity) ? s.rarity : "Basic";
      jobs.push({ hero, name: s.name, tier, label: s.label ?? undefined, url: MLBB + p, file: `${hero.slug}-${slugify(s.name)}` });
    }
  }
  if (unmatched) console.log(`  ⚠ หาไฟล์ภาพไม่เจอ ${unmatched} สกิน (ข้าม)`);

  console.log(`• MLBB: ดาวน์โหลดภาพ ${jobs.length} ไฟล์`);
  const skins: CatalogFile["skins"] = [];
  let done = 0;
  let failed = 0;
  await pool(jobs, 4, async (j) => {
    const cacheFile = path.join(dir, "img", new URL(j.url).pathname);
    const hit = existsSync(cacheFile);
    try {
      const buf = await cached(j.url, cacheFile);
      await writeCard(buf, path.join(ROOT, "public/skins/mlbb", `${j.file}.webp`), 200);
      skins.push({ f: j.file, h: j.hero.slug, n: j.name, t: j.tier, l: j.label });
    } catch (e) {
      failed++;
      console.warn(`  ✗ ${j.file}: ${(e as Error).message}`);
    }
    if (!hit) await sleep(120);
    if (++done % 200 === 0) console.log(`  ${done}/${jobs.length} ภาพ`);
  });
  if (failed) console.log(`  ⚠ ดาวน์โหลดไม่สำเร็จ ${failed} ไฟล์`);

  return {
    game: "mlbb",
    source: "mlbbdex.com (CC BY-SA)",
    generatedAt: new Date().toISOString(),
    heroes: heroes.map((h) => ({ id: h.slug, name: h.name })),
    skins: skins.sort((a, b) => compareText(a.f, b.f)),
  };
}

// ───────────────────────── MLBB rankings (ระดับเมต้าฮีโร่) ─────────────────────────
type RankingRow = { slug: string; name: string; tier: string; winRate: number; banRate: number; pickRate: number; lowSample?: boolean };

async function importRankings() {
  console.log("• MLBB: ดึงระดับเมต้าฮีโร่ (/api/v1/rankings)");
  // ไม่ใช้ cache — อยากได้ข้อมูลล่าสุดทุกครั้ง
  const json = (await (await fetchWithRetry(`${MLBB}/api/v1/rankings`)).json()) as {
    data: { measuredAt: string; heroes: RankingRow[] };
    source?: { name: string; url: string; license: string };
  };
  const out = {
    measuredAt: json.data.measuredAt,
    source: json.source ?? { name: "Mobile Legends Wiki", url: "https://mobilelegends.fandom.com", license: "CC BY-SA" },
    heroes: json.data.heroes.map((h) => ({ id: h.slug, t: h.tier, wr: h.winRate, br: h.banRate, pr: h.pickRate, low: h.lowSample || undefined })),
  };
  await writeFile(path.join(ROOT, "data/catalog/mlbb-rankings.json"), JSON.stringify(out));
  console.log(`✓ rankings: ${out.heroes.length} ฮีโร่ (วัดเมื่อ ${out.measuredAt})\n`);
}

// ───────────────────────── MLBB rank emblems (ตราแรงค์ผู้เล่น) ─────────────────────────
export const RANK_IDS = ["warrior", "elite", "master", "grandmaster", "epic", "legend", "mythic", "mythic-honor", "mythic-glory", "mythic-immortal"] as const;

async function importRankEmblems() {
  console.log("• MLBB: ดึงตราแรงค์ (/visuels/rangs)");
  const dir = path.join(CACHE, "mlbb", "rangs");
  for (const id of RANK_IDS) {
    const buf = await cached(`${MLBB}/visuels/rangs/${id}.webp`, path.join(dir, `${id}.webp`));
    await mkdir(path.join(ROOT, "public/ranks"), { recursive: true });
    await sharp(buf, { failOn: "error" }).resize({ width: 192, height: 192, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toFile(path.join(ROOT, "public/ranks", `${id}.webp`));
    await sleep(250);
  }
  console.log(`✓ ranks: ${RANK_IDS.length} ตรา → public/ranks\n`);
}

// ───────────────────────── main ─────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const li = args.indexOf("--limit");
  const limit = li >= 0 ? Number(args[li + 1]) : undefined;

  await mkdir(path.join(ROOT, "data/catalog"), { recursive: true });
  if (!args.includes("--rankings-only")) {
    const t0 = Date.now();
    const cat = await importMlbb(limit);
    // ตัดสกินซ้ำ (แหล่งข้อมูลบางครั้งลงสกินเดียวกันซ้ำ) และฮีโร่ที่ไม่มีสกินเหลือ
    const seenFile = new Set<string>();
    const before = cat.skins.length;
    cat.skins = cat.skins.filter((s) => !seenFile.has(s.f) && seenFile.add(s.f));
    if (cat.skins.length < before) console.log(`  ⚠ ตัดสกินซ้ำ ${before - cat.skins.length} รายการ`);
    const used = new Set(cat.skins.map((s) => s.h));
    cat.heroes = cat.heroes.filter((h) => used.has(h.id)).sort((a, b) => compareText(a.name, b.name));
    await writeFile(path.join(ROOT, "data/catalog/mlbb.json"), JSON.stringify(cat));
    console.log(`✓ mlbb: ${cat.heroes.length} ฮีโร่ / ${cat.skins.length} สกิน (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  await importRankings();
  await importRankEmblems();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
