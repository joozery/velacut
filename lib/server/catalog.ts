import { cache } from "react";
import { getDb } from "@/lib/db/mongo";
import { getBaseCatalog, mergeCatalog, type CatalogChanges, type ManagedHero, type ManagedSkin } from "@/lib/catalog";
import { GAME_TIERS } from "@/lib/tiers";
import { isUploadedUrl } from "./media";
import { UserError } from "./poster";

type HeroDoc = Omit<ManagedHero, "id" | "updatedAt"> & { _id: string; updatedAt: Date; updatedBy: string };
type SkinDoc = Omit<ManagedSkin, "id" | "updatedAt"> & { _id: string; updatedAt: Date; updatedBy: string };
const cols = async () => { const db = await getDb(); return { heroes: db.collection<HeroDoc>("catalog_heroes"), skins: db.collection<SkinDoc>("catalog_skins") }; };

export const getCatalogChanges = cache(async (): Promise<CatalogChanges> => {
  const { heroes, skins } = await cols();
  const [h, s] = await Promise.all([heroes.find().toArray(), skins.find().toArray()]);
  return {
    heroes: h.map(row => ({ id: row._id, name: row.name, image: row.image, active: row.active, updatedAt: row.updatedAt.toISOString() })),
    skins: s.map(row => ({ id: row._id, heroId: row.heroId, name: row.name, tier: row.tier, label: row.label, image: row.image, active: row.active, updatedAt: row.updatedAt.toISOString() })),
  };
});
export async function getCatalogChangesSafe(): Promise<CatalogChanges> {
  try { return await getCatalogChanges(); } catch (error) { console.error("getCatalogChanges failed", error); return { heroes: [], skins: [] }; }
}
export async function getServerCatalog(includeHidden = false) {
  return mergeCatalog(getBaseCatalog("mlbb"), await getCatalogChanges(), includeHidden);
}
export async function getServerCatalogSafe() {
  return mergeCatalog(getBaseCatalog("mlbb"), await getCatalogChangesSafe());
}

const text = (v: unknown, label: string, max: number) => {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max) throw new UserError(`${label}ต้องมี 1–${max} ตัวอักษร`);
  return v.trim();
};
const validId = (id: unknown) => typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,119}$/.test(id);

export async function saveLibraryItem(kind: "hero" | "skin", raw: unknown, by: string) {
  if (kind !== "hero" && kind !== "skin") throw new UserError("ประเภทรายการไม่ถูกต้อง");
  const r = (raw ?? {}) as Record<string, unknown>;
  if (!validId(r.id)) throw new UserError("รหัสรายการไม่ถูกต้อง");
  const id = r.id as string;
  const name = text(r.name, "ชื่อ", 100);
  if (typeof r.active !== "boolean") throw new UserError("สถานะรายการไม่ถูกต้อง");
  const { heroes, skins } = await cols();
  const base = getBaseCatalog("mlbb");
  const now = new Date();
  const image = typeof r.image === "string" ? r.image.trim() : "";
  if (kind === "hero") {
    const existing = await heroes.findOne({ _id: id });
    const oldHero = base.heroById.get(id);
    if (!oldHero && !existing && !id.startsWith("custom-")) throw new UserError("รหัสฮีโร่ใหม่ไม่ถูกต้อง");
    if (image && !isUploadedUrl(image, "catalog") && image !== existing?.image) throw new UserError("กรุณาอัปโหลดรูปฮีโร่ผ่านระบบ");
    if (!oldHero && !existing && !image) throw new UserError("กรุณาอัปโหลดรูปฮีโร่");
    await heroes.updateOne({ _id: id }, { $set: { name, image: image || undefined, active: r.active, updatedAt: now, updatedBy: by } }, { upsert: true });
  } else {
    const existing = await skins.findOne({ _id: id });
    const oldSkin = base.skinById.get(id);
    if (!oldSkin && !existing && !id.startsWith("mlbb-custom-")) throw new UserError("รหัสสกินใหม่ไม่ถูกต้อง");
    const heroId = text(r.heroId, "ฮีโร่", 120);
    if (!base.heroById.has(heroId) && !(await heroes.findOne({ _id: heroId }))) throw new UserError("ไม่พบฮีโร่ที่เลือก");
    const tier = text(r.tier, "ระดับสกิน", 30);
    if (!GAME_TIERS.mlbb.some(t => t.code === tier)) throw new UserError("ระดับสกินไม่ถูกต้อง");
    if (!isUploadedUrl(image, "catalog") && image !== oldSkin?.image && image !== existing?.image) throw new UserError("กรุณาอัปโหลดรูปสกินผ่านระบบ");
    const label = typeof r.label === "string" ? r.label.trim().slice(0, 80) : "";
    await skins.updateOne({ _id: id }, { $set: { name, heroId, tier, label, image, active: r.active, updatedAt: now, updatedBy: by } }, { upsert: true });
  }
  return { id };
}

export async function libraryImage(kind: string, id: string) {
  if (!validId(id) || (kind !== "hero" && kind !== "skin")) return null;
  const { heroes, skins } = await cols();
  const doc = kind === "hero" ? await heroes.findOne({ _id: id }) : await skins.findOne({ _id: id });
  return doc?.image && isUploadedUrl(doc.image, "catalog") ? doc.image : null;
}

export type LibraryItem = { id: string; name: string; heroId?: string; heroName?: string; tier?: string; label?: string; image: string; preview: string; active: boolean; uploaded: boolean };
export async function listLibrary(opts: { kind?: string; q?: string; hero?: string; page?: string; status?: string }) {
  const kind: "hero" | "skin" = opts.kind === "hero" ? "hero" : "skin";
  const changes = await getCatalogChanges();
  const all = mergeCatalog(getBaseCatalog("mlbb"), changes, true);
  const q = (opts.q ?? "").trim().toLowerCase();
  const heroOverrides = new Map(changes.heroes.map(h => [h.id, h]));
  const skinOverrides = new Map(changes.skins.map(s => [s.id, s]));
  const records: LibraryItem[] = kind === "hero" ? all.heroes.map(h => ({ id: h.id, name: h.name, image: heroOverrides.get(h.id)?.image ?? "", preview: h.image ?? all.skinById.get(h.skinIds[0])?.image ?? "", active: h.active !== false, uploaded: Boolean(heroOverrides.get(h.id)?.image) })) : all.skins.map(s => ({ id: s.id, name: s.name, heroId: s.heroId, heroName: s.heroName, tier: s.tier, label: s.label ?? "", image: skinOverrides.get(s.id)?.image ?? getBaseCatalog("mlbb").skinById.get(s.id)?.image ?? "", preview: s.image, active: s.active !== false, uploaded: isUploadedUrl(skinOverrides.get(s.id)?.image ?? "", "catalog") }));
  const filtered = records.filter(r => (!q || `${r.name} ${r.heroName ?? ""}`.toLowerCase().includes(q)) && (!opts.hero || opts.hero === "all" || kind === "hero" || r.heroId === opts.hero) && (opts.status === "hidden" ? !r.active : opts.status === "active" ? r.active : opts.status === "uploaded" ? r.uploaded : true));
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(opts.page)) || 1));
  return { kind, rows: filtered.slice((page - 1) * 24, page * 24), total: filtered.length, pages, page, heroes: all.heroes.map(h => ({ id: h.id, name: h.name, active: h.active !== false })), stats: { heroes: all.heroes.length, skins: all.skins.length, uploaded: changes.skins.filter(s => isUploadedUrl(s.image, "catalog")).length } };
}
