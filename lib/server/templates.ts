import { cache } from "react";
import { getDb } from "@/lib/db/mongo";
import {
  BUILTIN_TEMPLATE_IDS, DEFAULT_TEMPLATES, DEFAULT_TEMPLATE_A_BANNER, MAX_LAYERS, MAX_TEMPLATES, TEMPLATE_ID_RE, isBuiltinTemplate,
  type Layer, type TemplateKind, type TemplateSetting, type TemplatesConfig,
} from "@/lib/templates";
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

/** ตัวเลขในช่วง ปัดทศนิยม 1 ตำแหน่ง — ค่าผิดรูปแบบใช้ค่าตั้งต้น */
const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(max, Math.max(min, n)) * 10) / 10 : fallback;
};
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const color = (v: unknown, fallback: string, allowEmpty = false) =>
  v === "accent" || (typeof v === "string" && COLOR_RE.test(v)) ? (v as string) : allowEmpty && (v === "" || v == null) ? "" : fallback;

function parseLayer(raw: unknown, label: string): Layer {
  const l = (raw ?? {}) as Record<string, unknown>;
  const id = typeof l.id === "string" && /^[\w-]{1,24}$/.test(l.id) ? l.id : Math.random().toString(36).slice(2, 10);
  const base = { id, x: clamp(l.x, -20, 120, 50), y: clamp(l.y, -20, 120, 50) };
  if (l.type === "rank") return { ...base, type: "rank", source: l.source === "peakRank" ? "peakRank" : "rank", size: clamp(l.size, 2, 60, 14) };
  if (l.type === "cover") return { ...base, type: "cover", size: clamp(l.size, 4, 80, 22), radius: clamp(l.radius, 0, 50, 6) };
  if (l.type !== "text") throw new UserError(`ชิ้นส่วนบน${label}ไม่ถูกต้อง`);
  const body = String(l.text ?? "");
  if (!body.trim()) throw new UserError(`ข้อความบน${label}ต้องไม่ว่าง`);
  if (body.length > 120) throw new UserError(`ข้อความบน${label}ยาวเกิน 120 ตัวอักษร`);
  return {
    ...base, type: "text", text: body, size: clamp(l.size, 0.5, 20, 4),
    weight: l.weight === 400 || l.weight === 600 ? l.weight : 800,
    color: color(l.color, "#ffffff"), valueColor: color(l.valueColor, "", true),
    align: l.align === "left" || l.align === "right" ? l.align : "center", shadow: l.shadow !== false,
  };
}

function parseOne(id: string, raw: Record<string, unknown>): TemplateSetting {
  const builtin = isBuiltinTemplate(id) ? DEFAULT_TEMPLATES[id] : undefined;
  const label = builtin?.name ?? (String(raw.name ?? "").trim() || "แบบใหม่");
  const kind: TemplateKind = builtin?.kind ?? (raw.kind === "upload" ? "upload" : "banner");
  const price = money(raw.price ?? builtin?.price ?? 0, `ราคา${label}`);
  const compareRaw = raw.compareAtPrice;
  const compareAtPrice = compareRaw === null || compareRaw === undefined || compareRaw === "" || Number(compareRaw) === 0 ? null : money(compareRaw, `ราคาก่อนลดของ${label}`);
  if (compareAtPrice !== null && compareAtPrice <= price) throw new UserError(`ราคาก่อนลดของ${label}ต้องมากกว่าราคาขาย หรือเว้นว่างไว้`);
  const layersRaw = raw.layers ?? builtin?.layers ?? [];
  if (!Array.isArray(layersRaw)) throw new UserError(`ชิ้นส่วนบน${label}ไม่ถูกต้อง`);
  if (layersRaw.length > MAX_LAYERS) throw new UserError(`${label}วางชิ้นส่วนได้ไม่เกิน ${MAX_LAYERS} ชิ้น`);
  return {
    enabled: raw.enabled !== false,
    kind,
    name: text(raw.name ?? builtin?.name, `ชื่อ${label}`, 40, true),
    desc: text(raw.desc ?? builtin?.desc, `คำอธิบาย${label}`, 160, false),
    price,
    compareAtPrice,
    // แบบที่สร้างเองไม่ใส่ภาพได้ (ใช้พื้นไล่สี) · เทมเพลต A ต้องมีภาพ
    ...(kind === "banner" ? { banner: !builtin && !raw.banner ? "" : bannerImage(raw.banner ?? builtin?.banner ?? DEFAULT_TEMPLATE_A_BANNER) } : {}),
    ...(kind === "banner" ? { allowCustomerBg: raw.allowCustomerBg === undefined ? !builtin : raw.allowCustomerBg === true } : {}),
    ...(kind !== "grid" ? { layers: layersRaw.map((l) => parseLayer(l, label)) } : {}),
  };
}

/** ตรวจค่าทั้งชุด — แบบมาตรฐานต้องมีครบ (ไม่ส่งมา = ค่าเริ่มต้น) และต้องเปิดไว้อย่างน้อย 1 แบบ */
export function parseTemplates(raw: unknown): TemplatesConfig {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, Record<string, unknown> | undefined>;
  const ids = [...Object.keys(r), ...BUILTIN_TEMPLATE_IDS.filter((id) => !(id in r))];
  if (ids.length > MAX_TEMPLATES) throw new UserError(`สร้างแบบป้ายได้ไม่เกิน ${MAX_TEMPLATES} แบบ`);
  const out: TemplatesConfig = {};
  for (const id of ids) {
    if (!TEMPLATE_ID_RE.test(id)) throw new UserError("รหัสแบบป้ายไม่ถูกต้อง");
    out[id] = parseOne(id, r[id] ?? {});
  }
  if (!ids.some((id) => out[id].enabled)) throw new UserError("ต้องเปิดใช้งานอย่างน้อย 1 แบบ");
  return out;
}

/** ค่าที่เก็บไว้ (อาจเป็นรุ่นเก่าที่ยังไม่มี kind/layers) + เติมแบบมาตรฐานที่ขาด */
const merge = (value?: TemplatesConfig): TemplatesConfig => {
  const out: TemplatesConfig = {};
  for (const id of [...Object.keys(value ?? {}), ...BUILTIN_TEMPLATE_IDS]) {
    if (id in out) continue;
    const builtin = isBuiltinTemplate(id) ? DEFAULT_TEMPLATES[id] : undefined;
    const stored = value?.[id];
    out[id] = builtin
      ? { ...builtin, ...stored, kind: builtin.kind }
      : { ...stored!, kind: stored?.kind ?? "banner", layers: stored?.layers ?? [] };
  }
  return out;
};

export async function getTemplatesConfig(): Promise<TemplatesConfig> {
  const doc = await (await col()).findOne({ _id: "templates" });
  return merge(doc?.value);
}

/** ใช้ใน layout — ฐานข้อมูลล่มต้องไม่ทำให้ทั้งเว็บล่ม */
export const getTemplatesSafe = cache(async (): Promise<TemplatesConfig> => {
  try { return await getTemplatesConfig(); }
  catch (error) { console.error("getTemplatesConfig failed", error); return DEFAULT_TEMPLATES; }
});

/** บันทึกทั้งชุด — แบบที่ถูกเอาออกต้องยังไม่มีคนซื้อ (ป้ายเก่าต้องเปิดดูซ้ำได้) */
export async function saveTemplates(raw: unknown, by: string) {
  const value = parseTemplates(raw);
  const before = await getTemplatesConfig();
  const removed = Object.keys(before).filter((id) => !(id in value));
  if (removed.length) {
    const used = await (await getDb()).collection("transactions").countDocuments({ kind: "poster", "poster.doc.template": { $in: removed } }, { limit: 1 });
    if (used) throw new UserError("ลบแบบที่มีคนซื้อไปแล้วไม่ได้ ให้ปิดการใช้งานแทน");
  }
  await (await col()).updateOne({ _id: "templates" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}
