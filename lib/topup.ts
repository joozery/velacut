/**
 * ตั้งค่าการเติมเครดิต — ค่าจริงเก็บใน MongoDB (settings/topup) แก้ได้ที่หลังบ้าน /admin/settings
 * ค่าด้านล่างเป็นค่าเริ่มต้นเมื่อยังไม่เคยบันทึก
 */
export type TopupTag = "popular" | "best";

export type TopupPackage = {
  id: string;
  baht: number;
  /** เครดิตโบนัสที่ได้เพิ่ม (เข้ากระเป๋าโบนัส) */
  bonus: number;
  tag?: TopupTag;
  /** ปิดไว้ = ไม่แสดงในหน้าเติมเงิน */
  active?: boolean;
};

export type TopupConfig = {
  /** เครดิตที่ได้ต่อ 1 บาท (เข้ากระเป๋าโอนได้) */
  coinPerBaht: number;
  packages: TopupPackage[];
  firstTopup: { enabled: boolean; bonusPct: number; minBaht: number };
  custom: { enabled: boolean; minBaht: number; maxBaht: number };
  /** QR มีอายุ (นาที) */
  qrTtlMin: number;
};

export const DEFAULT_TOPUP_CONFIG: TopupConfig = {
  coinPerBaht: 1,
  packages: [
    { id: "p50", baht: 50, bonus: 0, active: true },
    { id: "p100", baht: 100, bonus: 5, active: true },
    { id: "p200", baht: 200, bonus: 15, tag: "popular", active: true },
    { id: "p500", baht: 500, bonus: 50, tag: "best", active: true },
    { id: "p1000", baht: 1000, bonus: 120, active: true },
    { id: "p2000", baht: 2000, bonus: 300, active: true },
  ],
  firstTopup: { enabled: true, bonusPct: 20, minBaht: 50 },
  custom: { enabled: true, minBaht: 20, maxBaht: 10000 },
  qrTtlMin: 15,
};

export const activePackages = (cfg: TopupConfig) => cfg.packages.filter((p) => p.active !== false);

export type TopupQuote = { baht: number; coins: number; bonus: number; promo: number; total: number };

/** คำนวณเครดิตที่จะได้ (โปรเติมครั้งแรกคิดจากเครดิตหลัก ไม่รวมโบนัสแพ็กเกจ) */
export function quoteTopup(cfg: TopupConfig, baht: number, bonus: number, firstTopup: boolean): TopupQuote {
  const coins = Math.floor(baht * cfg.coinPerBaht);
  const f = cfg.firstTopup;
  const promo = firstTopup && f.enabled && baht >= f.minBaht ? Math.floor((coins * f.bonusPct) / 100) : 0;
  return { baht, coins, bonus, promo, total: coins + bonus + promo };
}
