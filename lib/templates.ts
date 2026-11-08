import type { TemplateId } from "@/lib/pricing";

/**
 * ชนิดของแบบป้าย
 * - grid: ตารางสกินล้วน ไม่มีหัวป้าย
 * - banner: ภาพหัวป้ายที่แอดมินอัปโหลด + ชิ้นส่วน (ข้อความ/แรงค์/หน้าปก) วางทับตามที่จัดไว้ในหลังบ้าน
 * - upload: ลูกค้าอัปโหลดแบนเนอร์เอง (วางชิ้นส่วนทับได้เช่นกัน)
 */
export type TemplateKind = "grid" | "banner" | "upload";

export type LayerAlign = "left" | "center" | "right";
/** ตำแหน่งจุดยึดของชิ้นส่วน เป็น % ของกรอบหัวป้าย (ข้อความยึดตาม align · แรงค์/หน้าปกยึดกึ่งกลาง) */
type LayerBase = { id: string; x: number; y: number };
export type TextLayer = LayerBase & {
  type: "text";
  /** ข้อความ ใส่ข้อมูลของลูกค้าด้วย {code} {price} ฯลฯ — ถ้ามีช่องข้อมูลแต่ลูกค้าไม่ได้กรอกเลย ชิ้นนี้จะถูกซ่อน */
  text: string;
  /** ขนาดตัวอักษร เป็น % ของความกว้างป้าย */
  size: number;
  weight: 400 | 600 | 800;
  /** สีข้อความ — "accent" = สีไฮไลต์ที่ลูกค้าเลือก */
  color: string;
  /** สีของค่าที่มาจากลูกค้า (ตัวเลข/ชื่อ) — ว่าง = ใช้สีเดียวกับข้อความ */
  valueColor: string;
  align: LayerAlign;
  /** ขอบดำรอบตัวอักษร ให้อ่านง่ายบนภาพพื้นหลัง */
  shadow: boolean;
};
export type RankLayer = LayerBase & {
  type: "rank";
  /** rank = แรงค์ปัจจุบัน · peakRank = แรงค์สูงสุด */
  source: "rank" | "peakRank";
  /** ความกว้างตราแรงค์ เป็น % ของความกว้างป้าย */
  size: number;
};
export type CoverLayer = LayerBase & {
  type: "cover";
  /** ความกว้างภาพหน้าปก เป็น % ของความกว้างป้าย (สัดส่วน 3:4) */
  size: number;
  radius: number;
};
export type Layer = TextLayer | RankLayer | CoverLayer;

/** ตั้งค่าแบบป้ายที่แอดมินแก้ได้ */
export type TemplateSetting = {
  enabled: boolean; name: string; desc: string; price: number; compareAtPrice: number | null;
  kind: TemplateKind;
  /** ภาพหัวป้าย (ชนิด banner) — แอดมินอัปโหลดเองจากหลังบ้าน */
  banner?: string;
  /** ชิ้นส่วนที่วางบนหัวป้าย เรียงจากล่างขึ้นบน */
  layers?: Layer[];
};

export const DEFAULT_TEMPLATE_A_BANNER = "/logo/bannerexam.png";
/** ลำดับของ key ใน object = ลำดับที่แสดงให้ลูกค้าเห็น */
export type TemplatesConfig = Record<TemplateId, TemplateSetting>;

/** แบบมาตรฐานของระบบ — ลบไม่ได้ ชนิดคงที่ */
export const BUILTIN_TEMPLATE_IDS = ["none", "a", "b"] as const;
export const isBuiltinTemplate = (id: string) => (BUILTIN_TEMPLATE_IDS as readonly string[]).includes(id);
export const TEMPLATE_ID_RE = /^[a-z0-9][a-z0-9-]{0,23}$/;
export const MAX_TEMPLATES = 30;
export const MAX_LAYERS = 24;

export const DEFAULT_TEMPLATES: TemplatesConfig = {
  none: { enabled: true, kind: "grid", name: "ไม่ตกแต่ง", desc: "ตารางสกินอย่างเดียว ไม่มีหัวป้ายด้านบน", price: 0, compareAtPrice: null },
  a: { enabled: true, kind: "banner", name: "เทมเพลต A", desc: "หัวป้ายพร้อมข้อมูลไอดี ราคา และภาพตัวละครเป็นพื้นหลัง", price: 15, compareAtPrice: 25, banner: DEFAULT_TEMPLATE_A_BANNER, layers: [] },
  b: { enabled: true, kind: "upload", name: "เทมเพลต B", desc: "หัวป้ายว่างไว้ให้ใส่แบนเนอร์ของคุณเอง ไม่มีข้อความทับ", price: 25, compareAtPrice: 45, layers: [] },
};

export const templateIds = (cfg: TemplatesConfig): TemplateId[] => Object.keys(cfg);
export const enabledTemplates = (cfg: TemplatesConfig) => templateIds(cfg).filter((id) => cfg[id].enabled);

/** แบบที่ผู้ใช้เลือกไว้ถูกปิดหรือถูกลบ → ใช้แบบแรกที่เปิดอยู่แทน */
export const resolveTemplate = (cfg: TemplatesConfig, id: TemplateId): TemplateId => (cfg[id]?.enabled ? id : enabledTemplates(cfg)[0] ?? "none");

/* ───────────── ข้อมูลลูกค้าที่ใช้ในข้อความ ───────────── */

export type TokenKey = "code" | "heroes" | "skins" | "price" | "down" | "winrate" | "matches" | "honor" | "tagline";
export const TOKENS: { key: TokenKey; label: string; sample: string | number }[] = [
  { key: "code", label: "ชื่อป้าย / รหัสไอดี", sample: "ไอดี MLBB 001" },
  { key: "heroes", label: "จำนวนฮีโร่", sample: 128 },
  { key: "skins", label: "จำนวนสกิน (นับอัตโนมัติ)", sample: 1166 },
  { key: "price", label: "ราคาขาย", sample: 9999 },
  { key: "down", label: "เงินดาวน์", sample: 999 },
  { key: "winrate", label: "อัตราชนะ", sample: 62.35 },
  { key: "matches", label: "จำนวนแมตช์", sample: 2314 },
  { key: "honor", label: "คะแนนสะสม", sample: 50 },
  { key: "tagline", label: "ข้อความเพิ่มเติม", sample: "ติดเบอร์พร้อมเปลี่ยน" },
];
const TOKEN_RE = /\{(\w+)\}/g;
const isToken = (k: string): k is TokenKey => TOKENS.some((t) => t.key === k);

export type TokenValues = Partial<Record<TokenKey, string | number>>;

const formatValue = (v: string | number | undefined) =>
  typeof v === "number" ? (v ? v.toLocaleString("th-TH", { maximumFractionDigits: 2 }) : "") : (v ?? "").trim();

/** แยกข้อความเป็นช่วง ๆ (ค่าลูกค้า vs ข้อความคงที่) — คืน null ถ้ามีช่องข้อมูลแต่ไม่มีค่าเลย (ซ่อนชิ้นนี้) */
export function renderTokens(text: string, values: TokenValues): { text: string; value: boolean }[] | null {
  const parts: { text: string; value: boolean }[] = [];
  let last = 0, tokens = 0, filled = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    if (!isToken(m[1])) continue;
    if (m.index > last) parts.push({ text: text.slice(last, m.index), value: false });
    tokens++;
    const v = formatValue(values[m[1]]);
    if (v) { filled++; parts.push({ text: v, value: true }); }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), value: false });
  return tokens > 0 && filled === 0 ? null : parts;
}

/** ช่องข้อมูลที่แบบนี้ใช้ — ใช้เลือกว่าจะให้ลูกค้ากรอกอะไรบ้างในขั้นตกแต่ง */
export function templateUses(t: TemplateSetting | undefined) {
  const tokens = new Set<TokenKey>();
  let rank = false, peakRank = false, cover = false, accent = false;
  for (const l of t?.layers ?? []) {
    if (l.type === "text") {
      for (const m of l.text.matchAll(TOKEN_RE)) if (isToken(m[1])) tokens.add(m[1]);
      if (l.color === "accent" || l.valueColor === "accent") accent = true;
    } else if (l.type === "rank") { if (l.source === "peakRank") peakRank = true; else rank = true; }
    else cover = true;
  }
  return { tokens, rank, peakRank, cover, accent, any: tokens.size > 0 || rank || peakRank || cover || accent };
}

/* ───────────── ชิ้นส่วนเริ่มต้นสำหรับหลังบ้าน ───────────── */

export const newLayerId = () => Math.random().toString(36).slice(2, 10);

export const newTextLayer = (patch: Partial<TextLayer> = {}): TextLayer => ({
  id: newLayerId(), type: "text", text: "ข้อความ", x: 50, y: 50, size: 4, weight: 800, color: "#ffffff", valueColor: "", align: "center", shadow: true, ...patch,
});
export const newRankLayer = (patch: Partial<RankLayer> = {}): RankLayer => ({ id: newLayerId(), type: "rank", source: "rank", x: 85, y: 50, size: 14, ...patch });
export const newCoverLayer = (patch: Partial<CoverLayer> = {}): CoverLayer => ({ id: newLayerId(), type: "cover", x: 80, y: 50, size: 22, radius: 6, ...patch });

/** ชุดชิ้นส่วนตั้งต้นของแบบใหม่ — จัดวางคล้ายป้ายขายไอดีทั่วไป แอดมินลากปรับต่อได้ */
export const starterLayers = (): Layer[] => [
  newTextLayer({ text: "{code}", x: 4, y: 12, size: 4.2, align: "left" }),
  newTextLayer({ text: "ฮีโร่ {heroes} สกิน {skins}", x: 4, y: 27, size: 5.2, align: "left", valueColor: "accent" }),
  newTextLayer({ text: "อัตราชนะ {winrate}%  จำนวนเล่น {matches}", x: 4, y: 39, size: 2.8, align: "left", valueColor: "accent" }),
  newRankLayer({ x: 14, y: 72, size: 17 }),
  newTextLayer({ text: "ดาวน์ {down} บาท", x: 50, y: 61, size: 3.6, valueColor: "accent" }),
  newTextLayer({ text: "ราคา {price} บาท", x: 50, y: 73, size: 6.4, valueColor: "accent" }),
  newTextLayer({ text: "{tagline}", x: 50, y: 85, size: 3.2, color: "accent" }),
  newRankLayer({ source: "peakRank", x: 89, y: 70, size: 12 }),
];
