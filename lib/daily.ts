/** ตั้งค่าเช็กอินรายวัน — เก็บใน MongoDB (settings/daily) แก้ได้ที่ /admin/daily */
export type DailyDay = { reward: number; /** แสดงเป็นรางวัลใหญ่ (ไอคอนของขวัญ) */ highlight: boolean };
export type DailyConfig = { enabled: boolean; days: DailyDay[] };

export const DAILY_MAX_DAYS = 60;

/** สร้างตารางรางวัลแบบเร็ว: วันปกติ / ทุก N วัน / วันสุดท้าย */
export function buildDailyDays(o: { length: number; base: number; everyN: number; everyNReward: number; lastReward: number }): DailyDay[] {
  return Array.from({ length: o.length }, (_, i) => {
    const day = i + 1;
    if (day === o.length && o.lastReward > 0) return { reward: o.lastReward, highlight: true };
    if (o.everyN > 0 && day % o.everyN === 0) return { reward: o.everyNReward, highlight: o.everyNReward > o.base };
    return { reward: o.base, highlight: false };
  });
}

// ค่าเดิมของระบบ: 0.5 ทุกวัน, ทุกวันที่ 5 ได้ 1, ทุกวันที่ 7 ได้ 3, วันที่ 30 ได้ 10
export const DEFAULT_DAILY: DailyConfig = {
  enabled: true,
  days: Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const reward = day === 30 ? 10 : day % 7 === 0 ? 3 : day % 5 === 0 ? 1 : 0.5;
    return { reward, highlight: reward >= 3 };
  }),
};

/** วันที่จะรับรางวัลถัดไป (1–จำนวนวันในรอบ) */
export const nextRewardDay = (claimed: number, cycle: number) => Math.min(Math.max(1, cycle), claimed + 1);
