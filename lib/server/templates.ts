import { cache } from "react";
import { getDb } from "@/lib/db/mongo";
import { DEFAULT_TEMPLATES, TEMPLATE_IDS, type TemplateSetting, type TemplatesConfig } from "@/lib/templates";
import { UserError } from "./poster";
import { isUploadedUrl } from "./media";

type Doc = { _id: "templates"; value: TemplatesConfig; updatedAt: Date; updatedBy: string };
const col = async () => (await getDb()).collection<Doc>("settings");

const MAX_PRICE = 10_000;
const money = (v: unknown, label: string) => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > MAX_PRICE) throw new UserError(`${label} ต้องอยู่ระหว่าง 0–${MAX_PRICE.toLocaleString("th-TH")} เครดิต`);
  if (Math.round(n * 100) !== n * 100) throw new UserError(`${label} ใส่ทศนิยมได้ไม่เกิน 2 ตำแหน่ง`);
  return n;
};
const text = (v: unknown, label: string, max: number, required: boolean) => {
  const s = String(v ?? "").trim();
  if (required && !s) throw new UserError(`กรุณากรอก${label}`);
  if (s.length > max) throw new UserError(`${label}ยาวเกิน ${max} ตัวอักษร`);
  return s;
};

const bannerImage = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!/^\/(images|logo)\/[\w-]+(\/[\w-]+)*\.(webp|png|jpe?g|avif)$/.test(s) && !isUploadedUrl(s, "templates")) throw new UserError("ภาพหัวป้ายต้องเป็นรูปในเว็บหรือรูปที่อัปโหลดผ่านระบบ");
  return s;
};

/** ตรวจค่าทั้งชุด — ต้องเปิดไว้อย่างน้อย 1 แบบ */
export function parseTemplates(raw: unknown): TemplatesConfig {
  const r = (raw ?? {}) as Record<string, Record<string, unknown> | undefined>;
  const out = {} as TemplatesConfig;
  for (const id of TEMPLATE_IDS) {
    const t = r[id] ?? {};
    const label = DEFAULT_TEMPLATES[id].name;
    const price = money(t.price ?? DEFAULT_TEMPLATES[id].price, `ราคา${label}`);
    const compareRaw = t.compareAtPrice;
    const compareAtPrice = compareRaw === null || compareRaw === undefined || compareRaw === "" || Number(compareRaw) === 0 ? null : money(compareRaw, `ราคาก่อนลดของ${label}`);
    if (compareAtPrice !== null && compareAtPrice <= price) throw new UserError(`ราคาก่อนลดของ${label}ต้องมากกว่าราคาขาย หรือเว้นว่างไว้`);
    out[id] = {
      enabled: t.enabled !== false,
      name: text(t.name ?? DEFAULT_TEMPLATES[id].name, `ชื่อ${label}`, 40, true),
      desc: text(t.desc ?? DEFAULT_TEMPLATES[id].desc, `คำอธิบาย${label}`, 160, false),
      price,
      compareAtPrice,
      ...(id === "a" ? { banner: bannerImage(t.banner ?? DEFAULT_TEMPLATES.a.banner) } : {}),
    } satisfies TemplateSetting;
  }
  if (!TEMPLATE_IDS.some((id) => out[id].enabled)) throw new UserError("ต้องเปิดใช้งานอย่างน้อย 1 แบบ");
  return out;
}

const merge = (value?: Partial<TemplatesConfig>): TemplatesConfig =>
  Object.fromEntries(TEMPLATE_IDS.map((id) => [id, { ...DEFAULT_TEMPLATES[id], ...(value?.[id] ?? {}) }])) as TemplatesConfig;

export async function getTemplatesConfig(): Promise<TemplatesConfig> {
  const doc = await (await col()).findOne({ _id: "templates" });
  return merge(doc?.value);
}

/** ใช้ใน layout — ฐานข้อมูลล่มต้องไม่ทำให้ทั้งเว็บล่ม */
export const getTemplatesSafe = cache(async (): Promise<TemplatesConfig> => {
  try { return await getTemplatesConfig(); }
  catch (error) { console.error("getTemplatesConfig failed", error); return DEFAULT_TEMPLATES; }
});

export async function saveTemplates(raw: unknown, by: string) {
  const value = parseTemplates(raw);
  await (await col()).updateOne({ _id: "templates" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}
