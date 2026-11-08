/**
 * ค่าราคาชั่วคราว (mock) — Phase 4 จะย้ายไปอ่านจากตาราง Template / config ใน DB
 */
export const PRICE_PER_SKIN = 0.3;
export const MIN_SKINS = 4;
export const MAX_SKINS = 60;

/** id แบบป้าย — แบบมาตรฐาน none / a / b + แบบที่แอดมินสร้างเองในหลังบ้าน */
export type TemplateId = string;

/** ราคาตั้งต้น — ราคาจริงมาจากหน้าตั้งค่าเทมเพลตในหลังบ้าน (lib/templates.ts) */
export const TEMPLATE_PRICES: Record<string, { price: number; compareAtPrice?: number }> = {
  none: { price: 0 },
  a: { price: 15, compareAtPrice: 25 },
  b: { price: 25, compareAtPrice: 45 },
};
type PriceTable = Record<TemplateId, { price: number }>;

export function discountPercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** ราคารวม = สกิน × 0.3 + ค่า template (ปัดทศนิยม 2 ตำแหน่ง) */
export function calcTotal(skinCount: number, template: TemplateId, prices: PriceTable = TEMPLATE_PRICES) {
  const total = skinCount * PRICE_PER_SKIN + (prices[template]?.price ?? 0);
  return Math.round(total * 100) / 100;
}

/** ราคาที่ต้องจ่ายจริงตามรูปแบบไฟล์ — แบบมีลายน้ำดาวน์โหลดฟรี */
export function payableTotal(skinCount: number, template: TemplateId, output: "clean" | "watermark" = "clean", prices: PriceTable = TEMPLATE_PRICES) {
  return output === "watermark" ? 0 : calcTotal(skinCount, template, prices);
}
