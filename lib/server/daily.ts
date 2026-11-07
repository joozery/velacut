import { MongoServerError } from "mongodb";
import { toUnits } from "@/lib/money";
import type { DailySnapshot } from "@/lib/account";
import { collections, newId } from "./collections";
import { credit } from "./wallet";
import { UserError } from "./poster";
import { getDailyConfig } from "./settings";

/** วันที่ตามเวลาไทย เช่น 2026-11-07 — ตัดรอบเที่ยงคืนไทย */
export const bangkokDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(d);

export async function getDaily(userId: string): Promise<DailySnapshot> {
  const { txs } = await collections();
  const [cfg, total, today] = await Promise.all([
    getDailyConfig(),
    txs.countDocuments({ userId, kind: "reward", status: "completed" }),
    txs.findOne({ userId, kind: "reward", rewardDate: bangkokDate() }, { projection: { _id: 1 } }),
  ]);
  // วนรอบตามจำนวนวันที่ตั้งไว้: วันที่รับไปแล้วในรอบปัจจุบัน
  const cycle = cfg.days.length;
  const claimed = today ? ((total - 1) % cycle) + 1 : total % cycle;
  return { claimed, claimedToday: Boolean(today) };
}

export async function claimDaily(userId: string) {
  const { txs } = await collections();
  const cfg = await getDailyConfig();
  if (!cfg.enabled) throw new UserError("ปิดระบบเช็กอินรายวันชั่วคราว");
  const before = await getDaily(userId);
  if (before.claimedToday) throw new UserError("วันนี้รับรางวัลไปแล้ว พรุ่งนี้มาใหม่นะ");
  const day = before.claimed + 1;
  const reward = cfg.days[day - 1]?.reward ?? 0;
  const now = new Date();
  const id = newId("RW");
  try {
    await txs.insertOne({
      _id: id, userId, kind: "reward", status: "pending", amount: toUnits(reward),
      title: "รับรางวัลเช็กอิน", description: `รางวัลเช็กอินวันที่ ${day}`,
      note: "เครดิตโบนัสใช้สร้างป้ายได้ แต่ไม่สามารถโอนให้ผู้อื่นได้",
      createdAt: now, updatedAt: now, rewardDate: bangkokDate(now), rewardDay: day,
    });
  } catch (e) {
    if (e instanceof MongoServerError && e.code === 11000) throw new UserError("วันนี้รับรางวัลไปแล้ว พรุ่งนี้มาใหม่นะ");
    throw e;
  }
  await credit(userId, { bonus: toUnits(reward) });
  await txs.updateOne({ _id: id }, { $set: { status: "completed", updatedAt: new Date() } });
  return { reward, day };
}
