/**
 * ค่าราคาชั่วคราว (mock) — Phase 4 จะย้ายไปอ่านจากตาราง Template / config ใน DB
 */
export const PRICE_PER_SKIN = 0.3;
export const MIN_SKINS = 4;
export const MAX_SKINS = 60;

export type TemplateId = "none" | "a" | "b";

export const TEMPLATE_PRICES: Record<TemplateId, { price: number; compareAtPrice?: number }> = {
  none: { price: 0 },
  a: { price: 15, compareAtPrice: 25 },
  b: { price: 25, compareAtPrice: 45 },
};

export function discountPercent(price: number, compareAt?: number) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** ราคารวม = สกิน × 0.3 + ค่า template (ปัดทศนิยม 2 ตำแหน่ง) */
export function calcTotal(skinCount: number, template: TemplateId) {
  const total = skinCount * PRICE_PER_SKIN + TEMPLATE_PRICES[template].price;
  return Math.round(total * 100) / 100;
}

/** ราคาที่ต้องจ่ายจริงตามรูปแบบไฟล์ — แบบมีลายน้ำดาวน์โหลดฟรี */
export function payableTotal(skinCount: number, template: TemplateId, output: "clean" | "watermark" = "clean") {
  return output === "watermark" ? 0 : calcTotal(skinCount, template);
}
