import { getDb } from "@/lib/db/mongo";
import { DEFAULT_TOPUP_CONFIG, type TopupConfig, type TopupPackage } from "@/lib/topup";
import { DEFAULT_PROMO, type PromoConfig } from "@/lib/promo";
import { DAILY_MAX_DAYS, DEFAULT_DAILY, type DailyConfig } from "@/lib/daily";
import { UserError } from "./poster";
import { isUploadedUrl } from "./media";

type SettingsDoc = { _id: "topup" | "promo" | "daily"; value: TopupConfig | PromoConfig | DailyConfig; updatedAt: Date; updatedBy: string };

const col = async () => (await getDb()).collection<SettingsDoc>("settings");

export async function getTopupConfig(): Promise<TopupConfig> {
  const doc = await (await col()).findOne({ _id: "topup" });
  return doc ? { ...DEFAULT_TOPUP_CONFIG, ...(doc.value as TopupConfig) } : DEFAULT_TOPUP_CONFIG;
}

export async function getSettingsMeta(id: SettingsDoc["_id"]) {
  const doc = await (await col()).findOne({ _id: id }, { projection: { updatedAt: 1, updatedBy: 1 } });
  return doc ? { updatedAt: doc.updatedAt.toISOString(), updatedBy: doc.updatedBy } : null;
}

const int = (v: unknown, label: string, min: number, max: number) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new UserError(`${label} ต้องเป็นจำนวนเต็ม ${min.toLocaleString("th-TH")}–${max.toLocaleString("th-TH")}`);
  return n;
};

/** ตรวจค่าทั้งหมดก่อนบันทึก — คำสั่งเติมที่สร้างไปแล้วใช้ราคาเดิม ไม่ถูกเปลี่ยนตาม */
export function parseTopupConfig(raw: unknown): TopupConfig {
  const r = (raw ?? {}) as Record<string, unknown>;
  const coinPerBaht = Number(r.coinPerBaht);
  if (!Number.isFinite(coinPerBaht) || coinPerBaht <= 0 || coinPerBaht > 1000 || Math.round(coinPerBaht * 100) !== coinPerBaht * 100) throw new UserError("อัตราเครดิตต่อบาทต้องมากกว่า 0 และทศนิยมไม่เกิน 2 ตำแหน่ง");
  const list = Array.isArray(r.packages) ? r.packages : [];
  if (list.length > 12) throw new UserError("แพ็กเกจได้สูงสุด 12 รายการ");
  const seen = new Set<string>();
  const packages: TopupPackage[] = list.map((p, i) => {
    const x = (p ?? {}) as Record<string, unknown>;
    const baht = int(x.baht, `แพ็กเกจที่ ${i + 1}: ยอดเงิน`, 1, 1_000_000);
    if (seen.has(String(baht))) throw new UserError(`มีแพ็กเกจ ${baht} บาทซ้ำกัน`);
    seen.add(String(baht));
    const tag = x.tag === "popular" || x.tag === "best" ? x.tag : undefined;
    return { id: typeof x.id === "string" && /^[a-z0-9-]{1,24}$/.test(x.id) ? x.id : `p${baht}`, baht, bonus: int(x.bonus ?? 0, `แพ็กเกจที่ ${i + 1}: โบนัส`, 0, 1_000_000), ...(tag ? { tag } : {}), active: x.active !== false };
  });
  const ids = new Set<string>();
  for (const p of packages) { if (ids.has(p.id)) p.id = `p${p.baht}`; ids.add(p.id); }
  packages.sort((a, b) => a.baht - b.baht);

  const f = (r.firstTopup ?? {}) as Record<string, unknown>;
  const c = (r.custom ?? {}) as Record<string, unknown>;
  const custom = { enabled: c.enabled !== false, minBaht: int(c.minBaht, "ยอดกำหนดเองต่ำสุด", 1, 1_000_000), maxBaht: int(c.maxBaht, "ยอดกำหนดเองสูงสุด", 1, 1_000_000) };
  if (custom.minBaht > custom.maxBaht) throw new UserError("ยอดกำหนดเองต่ำสุดต้องไม่มากกว่าสูงสุด");
  const cfg: TopupConfig = {
    coinPerBaht,
    packages,
    firstTopup: { enabled: f.enabled !== false, bonusPct: int(f.bonusPct, "โบนัสเติมครั้งแรก (%)", 0, 500), minBaht: int(f.minBaht, "ยอดขั้นต่ำโปรเติมครั้งแรก", 0, 1_000_000) },
    custom,
    qrTtlMin: int(r.qrTtlMin, "อายุ QR (นาที)", 5, 120),
  };
  if (!packages.some((p) => p.active) && !custom.enabled) throw new UserError("ต้องเปิดใช้อย่างน้อย 1 แพ็กเกจ หรือเปิดยอดกำหนดเอง");
  return cfg;
}

export const getTopupConfigMeta = () => getSettingsMeta("topup");

export async function saveTopupConfig(raw: unknown, by: string) {
  const value = parseTopupConfig(raw);
  await (await col()).updateOne({ _id: "topup" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}

export async function getPromo(): Promise<PromoConfig> {
  const doc = await (await col()).findOne({ _id: "promo" });
  return doc ? { ...DEFAULT_PROMO, ...(doc.value as PromoConfig) } : DEFAULT_PROMO;
}

/** ใช้ใน layout หน้าเว็บ — ฐานข้อมูลล่มต้องไม่ทำให้ทั้งเว็บล่ม */
export async function getPromoSafe(): Promise<PromoConfig> {
  try {
    return await getPromo();
  } catch (e) {
    console.error("getPromo failed", e);
    return DEFAULT_PROMO;
  }
}

const text = (v: unknown, label: string, max: number, required = true) => {
  const s = String(v ?? "").trim();
  if (required && !s) throw new UserError(`กรุณากรอก${label}`);
  if (s.length > max) throw new UserError(`${label}ยาวเกิน ${max} ตัวอักษร`);
  return s;
};
const isoOrNull = (v: unknown, label: string) => {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) throw new UserError(`${label}ไม่ถูกต้อง`);
  return d.toISOString();
};

export function parsePromo(raw: unknown, prevVersion: number): PromoConfig {
  const r = (raw ?? {}) as Record<string, unknown>;
  const image = text(r.image, "รูปโปรโมชัน", 300);
  // รับเฉพาะรูปที่อัปโหลดผ่านระบบ (R2 ของเรา) หรือไฟล์ใน /public/images — ไม่รับลิงก์ที่พิมพ์เอง
  if (!isUploadedUrl(image, "promo") && !/^\/images\/[\w-]+(\/[\w-]+)*\.(webp|png|jpe?g|gif|avif)$/.test(image)) throw new UserError("รูปโปรโมชันไม่ถูกต้อง กรุณาอัปโหลดใหม่");
  const ctaHref = text(r.ctaHref, "ลิงก์ปุ่ม", 200);
  if (!ctaHref.startsWith("/") || ctaHref.startsWith("//")) throw new UserError("ลิงก์ปุ่มต้องเป็นหน้าในเว็บ ขึ้นต้นด้วย / เช่น /topup");
  const startsAt = isoOrNull(r.startsAt, "วันเริ่ม");
  const endsAt = isoOrNull(r.endsAt, "วันสิ้นสุด");
  if (startsAt && endsAt && startsAt >= endsAt) throw new UserError("วันสิ้นสุดต้องอยู่หลังวันเริ่ม");
  const autoOpen = r.autoOpen === "once" || r.autoOpen === "always" ? r.autoOpen : "off";
  return {
    enabled: r.enabled !== false,
    barText: text(r.barText, "ข้อความแถบประกาศ", 120),
    barLinkLabel: text(r.barLinkLabel, "ข้อความลิงก์ในแถบ", 30),
    title: text(r.title, "หัวข้อโปรโมชัน", 80),
    image,
    imageAlt: text(r.imageAlt, "คำอธิบายรูป", 200),
    ctaLabel: text(r.ctaLabel, "ข้อความปุ่ม", 40),
    ctaHref,
    note: text(r.note, "หมายเหตุ", 200, false),
    startsAt, endsAt, autoOpen,
    version: prevVersion + 1,
  };
}

export async function savePromo(raw: unknown, by: string) {
  const value = parsePromo(raw, (await getPromo()).version);
  await (await col()).updateOne({ _id: "promo" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}

export async function getDailyConfig(): Promise<DailyConfig> {
  const doc = await (await col()).findOne({ _id: "daily" });
  return doc ? { ...DEFAULT_DAILY, ...(doc.value as DailyConfig) } : DEFAULT_DAILY;
}

export async function getDailyConfigSafe(): Promise<DailyConfig> {
  try {
    return await getDailyConfig();
  } catch (e) {
    console.error("getDailyConfig failed", e);
    return DEFAULT_DAILY;
  }
}

/** รอบที่ผู้ใช้กำลังเช็กอินอยู่ไม่รีเซ็ต — ระบบนับจากจำนวนครั้งที่รับทั้งหมด หารด้วยจำนวนวันในรอบใหม่ */
export function parseDaily(raw: unknown): DailyConfig {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(r.days) ? r.days : [];
  if (list.length < 1 || list.length > DAILY_MAX_DAYS) throw new UserError(`จำนวนวันต่อรอบต้องอยู่ระหว่าง 1–${DAILY_MAX_DAYS} วัน`);
  const days = list.map((d, i) => {
    const x = (d ?? {}) as Record<string, unknown>;
    const reward = Number(x.reward);
    if (!Number.isFinite(reward) || reward < 0 || reward > 10_000 || Math.abs(reward * 100 - Math.round(reward * 100)) > 1e-6) throw new UserError(`วันที่ ${i + 1}: รางวัลต้องเป็น 0–10,000 ทศนิยมไม่เกิน 2 ตำแหน่ง`);
    return { reward: Math.round(reward * 100) / 100, highlight: x.highlight === true };
  });
  return { enabled: r.enabled !== false, days };
}

export async function saveDailyConfig(raw: unknown, by: string) {
  const value = parseDaily(raw);
  await (await col()).updateOne({ _id: "daily" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}
