/**
 * ระดับเมต้าฮีโร่ MLBB (S+ / S / A / B / C) + อัตราชนะ/แบน/เลือก
 * ข้อมูลจาก mlbbdex.com /api/v1/rankings (Mobile Legends Wiki, CC BY-SA)
 * อัปเดต: npm run import:skins -- --rankings-only
 */
import data from "@/data/catalog/mlbb-rankings.json";

export type MetaTier = "S+" | "S" | "A" | "B" | "C";
export type HeroMeta = { heroId: string; tier: MetaTier; winRate: number; banRate: number; pickRate: number; lowSample: boolean };

type Row = { id: string; t: string; wr: number; br: number; pr: number; low?: boolean };

export const META_MEASURED_AT = data.measuredAt;
export const META_SOURCE = data.source;

/** สีของแต่ละระดับ (ใช้บนเหรียญ/badge) */
export const META_TIER_STYLE: Record<MetaTier, { rank: number; className: string; ring: string }> = {
  "S+": { rank: 5, className: "from-rose-400 via-fuchsia-500 to-violet-700", ring: "ring-fuchsia-200/70" },
  S: { rank: 4, className: "from-amber-200 via-amber-500 to-orange-700", ring: "ring-amber-100/70" },
  A: { rank: 3, className: "from-sky-300 via-blue-500 to-indigo-700", ring: "ring-sky-100/70" },
  B: { rank: 2, className: "from-emerald-300 via-teal-500 to-cyan-700", ring: "ring-emerald-100/70" },
  C: { rank: 1, className: "from-zinc-300 via-zinc-500 to-zinc-700", ring: "ring-zinc-100/60" },
};

const isTier = (t: string): t is MetaTier => t in META_TIER_STYLE;

const byHero = new Map<string, HeroMeta>(
  (data.heroes as Row[])
    .filter((r) => isTier(r.t))
    .map((r) => [r.id, { heroId: r.id, tier: r.t as MetaTier, winRate: r.wr, banRate: r.br, pickRate: r.pr, lowSample: !!r.low }]),
);

export function getHeroMeta(heroId: string | undefined): HeroMeta | undefined {
  return heroId ? byHero.get(heroId) : undefined;
}

/** ฮีโร่ที่เมต้าแรงสุดในรายการ (ใช้เลือกฮีโร่ที่จะโชว์บนป้าย) */
export function strongestMeta(heroIds: string[]): HeroMeta | undefined {
  return heroIds
    .map((id) => byHero.get(id))
    .filter((m): m is HeroMeta => !!m)
    .sort((a, b) => META_TIER_STYLE[b.tier].rank - META_TIER_STYLE[a.tier].rank || b.winRate - a.winRate)[0];
}
