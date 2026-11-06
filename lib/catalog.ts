/**
 * คลังฮีโร่/สกินจริง — อ่านจาก data/catalog/<game>.json ที่สร้างโดย `npm run import:skins`
 * Phase 4 จะย้ายไปอ่านจาก MongoDB (collections: heroes, skins)
 */
import type { GameSlug } from "./games";
import { compareText } from "./utils";
import { getTier, type LibraryGame } from "./tiers";
import mlbbData from "@/data/catalog/mlbb.json";

type CatalogFile = {
  game: string;
  source: string;
  heroes: { id: string; name: string }[];
  skins: { f: string; h: string; n: string; t: string; l?: string }[];
};

export type Hero = { id: string; name: string; letter: string; skinIds: string[] };
export type Skin = {
  /** `${game}-${file}` — ใช้ใน editor state และลิงก์แชร์ */
  id: string;
  game: LibraryGame;
  heroId: string;
  heroName: string;
  name: string;
  tier: string;
  tierRank: number;
  /** ซีรีส์/ป้ายกำกับ เช่น Collector, StarLight (ถ้ามี) */
  label?: string;
  image: string;
};
export type Catalog = {
  game: LibraryGame;
  source: string;
  heroes: Hero[];
  skins: Skin[];
  skinById: Map<string, Skin>;
  heroById: Map<string, Hero>;
};

const RAW: Record<LibraryGame, CatalogFile> = { mlbb: mlbbData };

function build(game: LibraryGame): Catalog {
  const raw = RAW[game];
  const heroName = new Map(raw.heroes.map((h) => [h.id, h.name]));
  const skins: Skin[] = raw.skins
    .filter((s) => heroName.has(s.h))
    .map((s) => ({
      id: `${game}-${s.f}`,
      game,
      heroId: s.h,
      heroName: heroName.get(s.h)!,
      name: s.n,
      tier: s.t,
      tierRank: getTier(game, s.t).rank,
      label: s.l,
      image: `/skins/${game}/${s.f}.webp`,
    }));

  const byHero = new Map<string, string[]>();
  for (const s of skins) byHero.set(s.heroId, [...(byHero.get(s.heroId) ?? []), s.id]);

  const heroes: Hero[] = raw.heroes
    .filter((h) => byHero.has(h.id))
    .map((h) => ({ id: h.id, name: h.name, letter: h.name[0].toUpperCase(), skinIds: byHero.get(h.id)! }))
    .sort((a, b) => compareText(a.name, b.name));

  return {
    game,
    source: raw.source,
    heroes,
    skins,
    skinById: new Map(skins.map((s) => [s.id, s])),
    heroById: new Map(heroes.map((h) => [h.id, h])),
  };
}

const cache = new Map<LibraryGame, Catalog>();
export function getCatalog(game: GameSlug): Catalog {
  const g = game as LibraryGame;
  let c = cache.get(g);
  if (!c) {
    c = build(g);
    cache.set(g, c);
  }
  return c;
}

/** สกินระดับสูงคละฮีโร่ (ไม่ซ้ำฮีโร่) — ใช้โชว์ในหน้าแรก */
export function featuredSkins(game: LibraryGame, count: number, minRank = 3): Skin[] {
  const c = getCatalog(game);
  const seen = new Set<string>();
  const out: Skin[] = [];
  const pool = [...c.skins].sort((a, b) => b.tierRank - a.tierRank || compareText(a.id, b.id));
  for (const s of pool) {
    if (s.tierRank < minRank || seen.has(s.heroId)) continue;
    seen.add(s.heroId);
    out.push(s);
    if (out.length >= count) break;
  }
  return out;
}
