/**
 * แพ็กเกจเติมคอยน์ (mock) — Phase 4 ย้ายไปเก็บเป็น config ใน MongoDB
 * อัตรา 1 บาท = 1 คอยน์ + โบนัสตามแพ็กเกจ + โปรเติมครั้งแรก
 */
export type TopupPackage = {
  id: string;
  baht: number;
  bonus: number;
  tag?: "popular" | "best";
};

export const COIN_PER_BAHT = 1;
export const FIRST_TOPUP_BONUS_PCT = 20;
export const FIRST_TOPUP_MIN_BAHT = 50;
export const CUSTOM_MIN_BAHT = 20;
export const CUSTOM_MAX_BAHT = 10000;
/** QR มีอายุ (นาที) */
export const QR_TTL_MIN = 15;

export const TOPUP_PACKAGES: TopupPackage[] = [
  { id: "p50", baht: 50, bonus: 0 },
  { id: "p100", baht: 100, bonus: 5 },
  { id: "p200", baht: 200, bonus: 15, tag: "popular" },
  { id: "p500", baht: 500, bonus: 50, tag: "best" },
  { id: "p1000", baht: 1000, bonus: 120 },
  { id: "p2000", baht: 2000, bonus: 300 },
];

export type TopupQuote = { baht: number; coins: number; bonus: number; promo: number; total: number };

/** คำนวณคอยน์ที่จะได้ (โปรเติมครั้งแรกคิดจากยอดเงิน ไม่รวมโบนัสแพ็กเกจ) */
export function quoteTopup(baht: number, bonus: number, firstTopup: boolean): TopupQuote {
  const coins = Math.floor(baht * COIN_PER_BAHT);
  const promo = firstTopup && baht >= FIRST_TOPUP_MIN_BAHT ? Math.floor((coins * FIRST_TOPUP_BONUS_PCT) / 100) : 0;
  return { baht, coins, bonus, promo, total: coins + bonus + promo };
}

/**
 * ยอดโอนแบบมีเศษสตางค์ไม่ซ้ำ (uniqueAmount) ใช้จับคู่รายการโอนกับคำสั่งเติม
 * Phase 4: สุ่มฝั่ง server และกันชนกับคำสั่งที่ยังค้างอยู่
 */
export function uniqueAmount(baht: number) {
  const satang = 1 + Math.floor(Math.random() * 98);
  return Math.round((baht + satang / 100) * 100) / 100;
}
