import { cache } from "react";
import { getDb } from "@/lib/db/mongo";
import { DEFAULT_APPEARANCE, DEFAULT_WATERMARK, HOME_SECTIONS, type Appearance } from "@/lib/appearance";
import { CONTACT_CHANNEL_IDS, DEFAULT_SOCIAL, type SocialLinks } from "@/lib/contact";
import { copy } from "@/lib/copy";
import { isUploadedUrl } from "./media";
import { UserError } from "./poster";

type Doc = { _id: "appearance"; value: Appearance; updatedAt: Date; updatedBy: string };
const col = async () => (await getDb()).collection<Doc>("settings");
const text = (v: unknown, label: string, max: number) => {
  if (typeof v !== "string" || !v.trim() || v.trim().length > max) throw new UserError(`${label}ต้องมี 1–${max} ตัวอักษร`);
  return v.trim();
};
const image = (v: unknown, label: string) => {
  const s = text(v, label, 500);
  if (!/^\/(images|logo)\/[\w-]+(\/[\w-]+)*\.(webp|png|jpe?g|gif|avif)$/.test(s) && !isUploadedUrl(s, "appearance")) throw new UserError(`${label}ต้องเป็นรูปในเว็บหรือรูปที่อัปโหลดผ่านระบบ`);
  return s;
};
/** ลิงก์โซเชียล: ว่างได้ / ต้องเป็น https และไม่เกิน 300 ตัวอักษร (ไม่ใส่ https:// มา → เติมให้) */
export function parseSocial(raw: unknown): SocialLinks {
  const r = { ...DEFAULT_SOCIAL, ...((raw ?? {}) as Record<string, unknown>) };
  return Object.fromEntries(CONTACT_CHANNEL_IDS.map((id) => {
    let s = typeof r[id] === "string" ? (r[id] as string).trim() : "";
    if (!s) return [id, ""];
    const name = copy.dock.channels[id];
    if (!/^[a-z][a-z\d+.-]*:/i.test(s)) s = `https://${s.replace(/^\/+/, "")}`;
    let url: URL;
    try { url = new URL(s); } catch { throw new UserError(`ลิงก์ ${name} ไม่ถูกต้อง`); }
    if (url.protocol !== "https:" || !url.hostname.includes(".") || s.length > 300 || /[\s<>"']/.test(s)) throw new UserError(`ลิงก์ ${name} ต้องขึ้นต้นด้วย https:// และยาวไม่เกิน 300 ตัวอักษร`);
    return [id, url.toString()];
  })) as SocialLinks;
}

export function parseAppearance(raw: unknown): Appearance {
  const r = (raw ?? {}) as Record<string, unknown>;
  // ค่าที่บันทึกก่อนมีช่องใหม่ → เติมด้วยค่าเริ่มต้น (ไม่ทำให้ค่าเดิมหาย)
  const hero: Record<string, unknown> = { wordmarkImage: DEFAULT_APPEARANCE.hero.wordmarkImage, wordmarkAnimate: DEFAULT_APPEARANCE.hero.wordmarkAnimate, ...((r.hero ?? {}) as Record<string, unknown>) };
  const sections = (r.sections ?? {}) as Record<string, unknown>;
  const wm: Record<string, unknown> = { ...DEFAULT_WATERMARK, ...((r.watermark ?? {}) as Record<string, unknown>) };
  const pct = (v: unknown, label: string, min: number, max: number) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < min || n > max) throw new UserError(`${label}ต้องอยู่ระหว่าง ${min}–${max}%`);
    return n;
  };
  const wmText = typeof wm.text === "string" ? wm.text.trim() : "";
  if (wmText.length > 24) throw new UserError("ข้อความลายน้ำยาวเกิน 24 ตัวอักษร");
  const color = (v: unknown) => {
    if (typeof v !== "string" || !/^#[0-9a-f]{6}$/i.test(v)) throw new UserError("สีต้องอยู่ในรูปแบบ #RRGGBB");
    return v.toLowerCase();
  };
  const ctaHref = text(hero.ctaHref, "ลิงก์ปุ่ม", 200);
  if (!/^\/(?!\/)/.test(ctaHref) || /[\\\s\x00-\x1f]/.test(ctaHref)) throw new UserError("ลิงก์ปุ่มต้องเป็นหน้าในเว็บ เช่น /generate/mlbb");
  return {
    name: text(r.name, "ชื่อเว็บ", 40), description: text(r.description, "คำอธิบายเว็บ", 200),
    logoLight: image(r.logoLight, "โลโก้โหมดสว่าง"), logoDark: image(r.logoDark, "โลโก้โหมดมืด"),
    primaryLight: color(r.primaryLight), primaryDark: color(r.primaryDark), footerAbout: text(r.footerAbout, "ข้อความท้ายเว็บ", 300),
    hero: { background: image(hero.background, "ภาพพื้นหลังหน้าแรก"), wordmarkImage: image(hero.wordmarkImage, "ภาพในตัวหนังสือ"), wordmarkAnimate: hero.wordmarkAnimate !== false, kicker: text(hero.kicker, "ข้อความเหนือหัวข้อ", 80), title: text(hero.title, "หัวข้อหน้าแรก", 60), highlight: text(hero.highlight, "หัวข้อบรรทัดที่สอง", 60), description: text(hero.description, "คำอธิบายหน้าแรก", 300), ctaLabel: text(hero.ctaLabel, "ข้อความปุ่ม", 40), ctaHref },
    sections: Object.fromEntries(HOME_SECTIONS.map(([key]) => {
      if (typeof sections[key] !== "boolean") throw new UserError("ข้อมูลส่วนแสดงหน้าแรกไม่ถูกต้อง");
      return [key, sections[key]];
    })) as Appearance["sections"],
    social: parseSocial(r.social),
    watermark: { enabled: wm.enabled !== false, mode: wm.mode === "image" ? "image" : "text", text: wmText, image: image(wm.image, "รูปลายน้ำ"), opacity: pct(wm.opacity, "ความเข้มลายน้ำ", 5, 90), size: pct(wm.size, "ขนาดลายน้ำ", 50, 200) },
  };
}
export async function getAppearance() {
  const doc = await (await col()).findOne({ _id: "appearance" });
  return { value: doc ? parseAppearance(doc.value) : DEFAULT_APPEARANCE, meta: doc ? { updatedAt: doc.updatedAt.toISOString(), updatedBy: doc.updatedBy } : null };
}
/** Shared within a server render; database failure preserves the existing frontend. */
export const getAppearanceSafe = cache(async (): Promise<Appearance> => {
  try { return (await getAppearance()).value; }
  catch (error) { console.error("getAppearance failed", error); return DEFAULT_APPEARANCE; }
});
export async function saveAppearance(raw: unknown, by: string) {
  const value = parseAppearance(raw);
  await (await col()).updateOne({ _id: "appearance" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}
