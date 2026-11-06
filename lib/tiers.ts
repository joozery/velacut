import type { GameSlug } from "./games";

/**
 * ระดับสกินแยกตามเกม (rank สูง = หายาก/แพงกว่า ใช้กับ "AI เรียง")
 * - ROV: ระบบ A → SSS+ ตามเซิร์ฟเวอร์ไทย
 * - MLBB: ระบบ rarity ใหม่ของ Moonton (ลำดับ Grand/Supreme อ้างอิงจากราคาในเกม — ตรวจทานได้)
 */
export type TierDef = {
  code: string;
  /** ข้อความบน badge (สั้น) */
  short: string;
  label: string;
  rank: number;
  className: string;
};

const grad = (from: string, to: string) => `bg-gradient-to-r ${from} ${to} text-white`;

export const GAME_TIERS: Record<Exclude<GameSlug, "freefire">, TierDef[]> = {
  rov: [
    { code: "SSS+", short: "SSS+", label: "Ultimate", rank: 7, className: grad("from-rose-500", "to-fuchsia-600") },
    { code: "SSS", short: "SSS", label: "Prestige", rank: 6, className: grad("from-fuchsia-500", "to-violet-600") },
    { code: "SS+", short: "SS+", label: "Legend", rank: 5, className: grad("from-amber-400", "to-orange-500") },
    { code: "SS", short: "SS", label: "Limited", rank: 4, className: grad("from-yellow-400", "to-amber-500") },
    { code: "S+", short: "S+", label: "Epic", rank: 3, className: "bg-violet-500 text-white" },
    { code: "S", short: "S", label: "Heroic", rank: 2, className: "bg-sky-500 text-white" },
    { code: "A", short: "A", label: "EVO", rank: 1, className: "bg-zinc-500 text-white" },
  ],
  mlbb: [
    { code: "Supreme", short: "SUP", label: "Supreme", rank: 6, className: grad("from-rose-500", "to-fuchsia-600") },
    { code: "Grand", short: "GRD", label: "Grand", rank: 5, className: grad("from-amber-400", "to-orange-500") },
    { code: "Exquisite", short: "EXQ", label: "Exquisite", rank: 4, className: grad("from-fuchsia-500", "to-violet-600") },
    { code: "Exceptional", short: "EXC", label: "Exceptional", rank: 3, className: "bg-violet-500 text-white" },
    { code: "Deluxe", short: "DLX", label: "Deluxe", rank: 2, className: "bg-sky-500 text-white" },
    { code: "Common", short: "CMN", label: "Common", rank: 1, className: "bg-teal-500 text-white" },
    { code: "Basic", short: "BSC", label: "Basic", rank: 0, className: "bg-zinc-500 text-white" },
  ],
};

export type LibraryGame = keyof typeof GAME_TIERS;

const FALLBACK: TierDef = { code: "?", short: "?", label: "?", rank: 0, className: "bg-zinc-500 text-white" };

export function getTier(game: LibraryGame, code: string): TierDef {
  return GAME_TIERS[game].find((t) => t.code === code) ?? FALLBACK;
}
