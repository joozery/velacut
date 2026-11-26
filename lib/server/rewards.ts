import { cache } from "react";
import { getDb } from "@/lib/db/mongo";
import { DEFAULT_REWARDS, MAX_REWARDS, REWARD_ID_RE, newRewardId, type Reward } from "@/lib/rewards";
import { UserError } from "./poster";
import { isUploadedUrl } from "./media";

type Doc = { _id: "rewards"; value: Reward[]; updatedAt: Date; updatedBy: string };
const col = async () => (await getDb()).collection<Doc>("settings");

export function parseRewards(raw: unknown): Reward[] {
  if (!Array.isArray(raw)) throw new UserError("รูปแบบข้อมูลไม่ถูกต้อง");
  if (raw.length > MAX_REWARDS) throw new UserError(`เพิ่มตรารีวอร์ดได้ไม่เกิน ${MAX_REWARDS} รายการ`);
  const seen = new Set<string>();
  return raw.map((x, i) => {
    const r = (x ?? {}) as Record<string, unknown>;
    let id = typeof r.id === "string" && REWARD_ID_RE.test(r.id) ? r.id : newRewardId();
    while (seen.has(id)) id = newRewardId();
    seen.add(id);
    const name = String(r.name ?? "").trim();
    if (!name || name.length > 40) throw new UserError(`ตราที่ ${i + 1}: ชื่อต้องมี 1–40 ตัวอักษร`);
    const image = String(r.image ?? "");
    if (!/^\/rewards\/[\w-]+\.webp$/.test(image) && !isUploadedUrl(image, "rewards")) throw new UserError(`ตราที่ ${i + 1}: ต้องอัปโหลดรูป`);
    return { id, name, image };
  });
}

export async function getRewardsConfig(): Promise<Reward[]> {
  const doc = await (await col()).findOne({ _id: "rewards" });
  return doc?.value ?? DEFAULT_REWARDS;
}

/** ใช้ใน layout — ฐานข้อมูลล่มต้องไม่ทำให้ทั้งเว็บล่ม */
export const getRewardsSafe = cache(async (): Promise<Reward[]> => {
  try { return await getRewardsConfig(); }
  catch (error) { console.error("getRewardsConfig failed", error); return DEFAULT_REWARDS; }
});

/** บันทึกทั้งชุด — ตราที่ถูกเอาออกต้องยังไม่มีป้ายที่ซื้อไปแล้วใช้อยู่ */
export async function saveRewards(raw: unknown, by: string) {
  const value = parseRewards(raw);
  const before = await getRewardsConfig();
  const removed = before.map((r) => r.id).filter((id) => !value.some((v) => v.id === id));
  if (removed.length) {
    const used = await (await getDb()).collection("transactions").countDocuments({ kind: "poster", "poster.doc.decoration.reward": { $in: removed } }, { limit: 1 });
    if (used) throw new UserError("ลบตราที่มีป้ายซื้อไปแล้วใช้อยู่ไม่ได้");
  }
  await (await col()).updateOne({ _id: "rewards" }, { $set: { value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}
