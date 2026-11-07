/**
 * Existing local catalog plus admin-managed overrides from MongoDB.
 * Legacy IDs stay stable; no character API is called when browsing or editing.
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

export type Hero = { id: string; name: string; letter: string; skinIds: string[]; image?: string; active?: boolean };
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
  active?: boolean;
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
let clientCatalog: Catalog | undefined;
/** Browser event handlers (editor store) share the catalog provided by the server. */
export function setClientCatalog(catalog: Catalog) {
  if (typeof window !== "undefined") clientCatalog = catalog;
}
export function getCatalog(game: GameSlug): Catalog {
  if (typeof window !== "undefined" && clientCatalog?.game === game) return clientCatalog;
  return getBaseCatalog(game);
}
export function getBaseCatalog(game: GameSlug): Catalog {
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
  return featuredFromCatalog(getCatalog(game), count, minRank);
}

export function featuredFromCatalog(c: Catalog, count: number, minRank = 3): Skin[] {
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

export type ManagedHero = { id: string; name: string; image?: string; active: boolean; updatedAt: string };
export type ManagedSkin = { id: string; heroId: string; name: string; tier: string; label?: string; image: string; active: boolean; updatedAt: string };
export type CatalogChanges = { heroes: ManagedHero[]; skins: ManagedSkin[] };

export function managedImage(kind: "hero" | "skin", id: string, version: string) {
  return `/api/catalog/images/${kind}/${encodeURIComponent(id)}?v=${encodeURIComponent(version)}`;
}

/** Preserve legacy IDs and hidden records for saved posters; picker lists contain only active records. */
export function mergeCatalog(base: Catalog, changes: CatalogChanges, includeHidden = false): Catalog {
  const heroes = new Map([...base.heroById].map(([id, hero]) => [id, { ...hero, skinIds: [] as string[], active: true }]));
  for (const h of changes.heroes) heroes.set(h.id, { id: h.id, name: h.name, letter: h.name[0]?.toUpperCase() ?? "#", skinIds: [], active: h.active, ...(h.image ? { image: managedImage("hero", h.id, h.updatedAt) } : {}) });
  const skins = new Map([...base.skinById].map(([id, skin]) => [id, { ...skin, active: true }]));
  for (const s of changes.skins) {
    const hero = heroes.get(s.heroId);
    if (!hero) continue;
    skins.set(s.id, { ...s, game: base.game, heroName: hero.name, tierRank: getTier(base.game, s.tier).rank, image: s.image.startsWith("/") ? s.image : managedImage("skin", s.id, s.updatedAt) });
  }
  for (const skin of skins.values()) {
    const hero = heroes.get(skin.heroId);
    skin.heroName = hero?.name ?? skin.heroName;
    if (hero && (includeHidden || (skin.active && hero.active))) hero.skinIds.push(skin.id);
  }
  const list = [...skins.values()].filter(s => includeHidden || (s.active && heroes.get(s.heroId)?.active));
  return { ...base, source: "managed-library", skins: list, heroes: [...heroes.values()].filter(h => includeHidden || (h.active && h.skinIds.length > 0)).sort((a,b) => compareText(a.name,b.name)), skinById: skins, heroById: heroes };
}
