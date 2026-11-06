import { compareText } from "./utils";
/**
 * คลังภาพฟรี — ค้นหา / กรอง / เรียง / แบ่งหน้า (ทำงานฝั่ง server)
 * ตอนนี้มีหมวด "skin" (ภาพสกินจาก catalog) — โครงรองรับหมวดอื่นในอนาคต
 * (ป้ายสังหาร, กรอบโปรไฟล์ ฯลฯ) ซึ่ง Phase 4/5 จะมาจาก collection `assets` ใน MongoDB
 */
import { getCatalog, type Skin } from "./catalog";
import { getGame, type GameSlug } from "./games";
import { GAME_TIERS, type LibraryGame } from "./tiers";

export const ASSET_SORTS = ["default", "name", "tierDesc", "tierAsc"] as const;
export type AssetSort = (typeof ASSET_SORTS)[number];
export const ASSETS_PER_PAGE = 24;

export type AssetItem = Skin & { category: "skin"; downloadUrl: string };

export type AssetQuery = { q?: string; sort?: string; tier?: string; page?: string };

export type AssetResult = {
  items: AssetItem[];
  total: number;
  /** จำนวนทั้งหมดในเกม (ไม่สนตัวกรอง) */
  grandTotal: number;
  page: number;
  pages: number;
  sort: AssetSort;
  tier: string | null;
  q: string;
  /** จำนวนต่อระดับ (คำนวณหลังค้นหา เพื่อให้ตัวเลขบน chip ตรงกับผลจริง) */
  tierCounts: { code: string; short: string; label: string; count: number }[];
  searchCount: number;
};

export const isLibraryGame = (slug: string): slug is LibraryGame => getGame(slug)?.mode === "library";

export function queryAssets(game: GameSlug, query: AssetQuery): AssetResult | null {
  if (!isLibraryGame(game)) return null;
  const { skins } = getCatalog(game);
  const tiers = GAME_TIERS[game];

  const q = (query.q ?? "").trim().slice(0, 60);
  const needle = q.toLowerCase();
  const sort: AssetSort = (ASSET_SORTS as readonly string[]).includes(query.sort ?? "") ? (query.sort as AssetSort) : "default";
  const tier = tiers.some((t) => t.code === query.tier) ? query.tier! : null;

  const searched = needle
    ? skins.filter((s) => s.name.toLowerCase().includes(needle) || s.heroName.toLowerCase().includes(needle))
    : skins;

  const tierCounts = tiers
    .map((t) => ({ code: t.code, short: t.short, label: t.label, count: searched.filter((s) => s.tier === t.code).length }))
    .filter((t) => t.count > 0);

  const filtered = tier ? searched.filter((s) => s.tier === tier) : searched;

  const sorted = [...filtered];
  if (sort === "default") sorted.sort((a, b) => compareText(a.heroName, b.heroName) || compareText(a.name, b.name));
  if (sort === "name") sorted.sort((a, b) => compareText(a.name, b.name));
  if (sort === "tierDesc") sorted.sort((a, b) => b.tierRank - a.tierRank || compareText(a.heroName, b.heroName));
  if (sort === "tierAsc") sorted.sort((a, b) => a.tierRank - b.tierRank || compareText(a.heroName, b.heroName));

  const pages = Math.max(1, Math.ceil(sorted.length / ASSETS_PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1));
  const items = sorted.slice((page - 1) * ASSETS_PER_PAGE, page * ASSETS_PER_PAGE).map((s) => ({
    ...s,
    category: "skin" as const,
    downloadUrl: `/api/assets/${game}/${s.id.slice(game.length + 1)}`,
  }));

  return { items, total: sorted.length, grandTotal: skins.length, page, pages, sort, tier, q, tierCounts, searchCount: searched.length };
}

/** สร้าง URL ของหน้าคลังภาพ โดยคงพารามิเตอร์เดิมไว้ */
export function assetsHref(game: GameSlug, current: { q?: string; sort?: string; tier?: string | null; page?: number }, patch: Partial<{ q: string; sort: string; tier: string | null; page: number }>) {
  const next = { ...current, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.sort && next.sort !== "default") sp.set("sort", next.sort);
  if (next.tier) sp.set("tier", next.tier);
  if (next.page && next.page > 1) sp.set("page", String(next.page));
  const qs = sp.toString();
  return `/assets/${game}${qs ? `?${qs}` : ""}`;
}

/** เลขหน้าที่จะแสดง เช่น [1, 2, 3, 4, 5, "…", 10] */
export function pageList(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 4) [2, 3, 4, 5].forEach((n) => set.add(n));
  if (page >= pages - 3) [pages - 4, pages - 3, pages - 2, pages - 1].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}
