/**
 * Mock data สำหรับ Phase 1–3 (ก่อนต่อ DB จริงใน Phase 4)
 * — ข้อมูลฮีโร่/สกินจริงอยู่ที่ lib/catalog.ts
 */
import type { GameSlug } from "./games";

export const MOCK_USER = {
  name: "ผู้ใช้ทดสอบ",
  email: "demo@example.com",
  initials: "DM",
  wallet: { balance: 128.5, transferable: 100, bonus: 28.5 },
};

export const MOCK_STATS = {
  posters: 128540,
  users: 24310,
  skins: 3200,
  rating: 4.9,
};

export const GAME_SKIN_COUNTS: Record<GameSlug, number> = {
  mlbb: 1680,
};

export const SAMPLE_POSTERS: { id: string; game: GameSlug; cols: number; rows: number; template: "none" | "a" | "b" }[] = [
  { id: "p1", game: "mlbb", cols: 4, rows: 3, template: "b" },
  { id: "p2", game: "mlbb", cols: 3, rows: 3, template: "a" },
  { id: "p3", game: "mlbb", cols: 3, rows: 2, template: "none" },
  { id: "p4", game: "mlbb", cols: 5, rows: 4, template: "b" },
];

/** ปฏิทิน 30 วัน: ทุกวันที่ 7 ได้รางวัลใหญ่ */
export const DAILY_REWARDS = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const reward = day === 30 ? 10 : day % 7 === 0 ? 3 : day % 5 === 0 ? 1 : 0.5;
  return { day, reward };
});
export const MOCK_CLAIMED_DAYS = 4; // เช็กอินมาแล้ว 4 วัน → วันนี้คือวันที่ 5

/** ตัวเลขบนป้ายตัวอย่างในหน้าแรก */
export const SAMPLE_LISTING = { no: "01", heroes: 98, skins: 212, winrate: 56, matches: 4210, price: 1290, down: 500, honor: 50000 };
