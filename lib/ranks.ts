/**
 * แรงค์ผู้เล่น MLBB (ตราแรงค์ในเกม) — ภาพจาก mlbbdex.com/visuels/rangs (ลิขสิทธิ์ Moonton)
 * อัปเดตภาพ: npm run import:skins -- --rankings-only
 */
export const RANKS = [
  { id: "warrior", name: "Warrior" },
  { id: "elite", name: "Elite" },
  { id: "master", name: "Master" },
  { id: "grandmaster", name: "Grandmaster" },
  { id: "epic", name: "Epic" },
  { id: "legend", name: "Legend" },
  { id: "mythic", name: "Mythic" },
  { id: "mythic-honor", name: "Mythical Honor" },
  { id: "mythic-glory", name: "Mythical Glory" },
  { id: "mythic-immortal", name: "Mythical Immortal" },
] as const;

export type RankId = (typeof RANKS)[number]["id"];

/** แรงค์ตัวอย่างที่ใช้ใน preview เมื่อผู้ใช้ยังไม่เลือก */
export const SAMPLE_RANK: RankId = "mythic-glory";

export const rankImage = (id: RankId) => `/ranks/${id}.webp`;
export const getRank = (id: string | undefined) => RANKS.find((r) => r.id === id);
