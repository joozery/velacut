import type { TemplateId } from "@/lib/pricing";

/** ตั้งค่าแบบป้ายที่แอดมินแก้ได้ — หน้าตาของแต่ละแบบยังกำหนดในโค้ด (none / a / b) */
export type TemplateSetting = { enabled: boolean; name: string; desc: string; price: number; compareAtPrice: number | null;
  /** ภาพหัวป้าย (ใช้กับเทมเพลต A) — แอดมินอัปโหลดเองจากหลังบ้าน */
  banner?: string };

export const DEFAULT_TEMPLATE_A_BANNER = "/logo/bannerexam.png";
export type TemplatesConfig = Record<TemplateId, TemplateSetting>;

export const TEMPLATE_IDS: TemplateId[] = ["none", "a", "b"];

export const DEFAULT_TEMPLATES: TemplatesConfig = {
  none: { enabled: true, name: "ไม่ตกแต่ง", desc: "ตารางสกินอย่างเดียว ไม่มีหัวป้ายด้านบน", price: 0, compareAtPrice: null },
  a: { enabled: true, name: "เทมเพลต A", desc: "หัวป้ายพร้อมข้อมูลไอดี ราคา และภาพตัวละครเป็นพื้นหลัง", price: 15, compareAtPrice: 25, banner: DEFAULT_TEMPLATE_A_BANNER },
  b: { enabled: true, name: "เทมเพลต B", desc: "หัวป้ายว่างไว้ให้ใส่แบนเนอร์ของคุณเอง ไม่มีข้อความทับ", price: 25, compareAtPrice: 45 },
};

export const enabledTemplates = (cfg: TemplatesConfig) => TEMPLATE_IDS.filter((id) => cfg[id].enabled);

/** แบบที่ผู้ใช้เลือกไว้ถูกปิด → ใช้แบบแรกที่เปิดอยู่แทน */
export const resolveTemplate = (cfg: TemplatesConfig, id: TemplateId): TemplateId => (cfg[id]?.enabled ? id : enabledTemplates(cfg)[0] ?? "none");
