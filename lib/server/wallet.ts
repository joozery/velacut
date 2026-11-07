import { fromUnits } from "@/lib/money";
import type { WalletSnapshot } from "@/lib/account";
import { collections } from "./collections";

export type Bucket = "transferable" | "bonus";

export async function getWalletUnits(userId: string) {
  const { wallets } = await collections();
  const w = await wallets.findOne({ _id: userId });
  return { transferable: w?.transferable ?? 0, bonus: w?.bonus ?? 0 };
}

export function toSnapshot(w: { transferable: number; bonus: number }): WalletSnapshot {
  return { transferable: fromUnits(w.transferable), bonus: fromUnits(w.bonus), balance: fromUnits(w.transferable + w.bonus) };
}

export async function credit(userId: string, units: Partial<Record<Bucket, number>>) {
  const { wallets } = await collections();
  await wallets.updateOne(
    { _id: userId },
    { $inc: { transferable: units.transferable ?? 0, bonus: units.bonus ?? 0 }, $set: { updatedAt: new Date() } },
    { upsert: true },
  );
}

/**
 * ตัดยอดแบบ atomic: ใช้เครดิตโบนัสก่อน แล้วค่อยตัดเครดิตที่โอนได้
 * คืนจำนวนโบนัสที่ใช้ หรือ null ถ้ายอดไม่พอ
 */
export async function debitSpendable(userId: string, amount: number): Promise<number | null> {
  const { wallets } = await collections();
  const before = await wallets.findOneAndUpdate(
    { _id: userId, $expr: { $gte: [{ $add: ["$transferable", "$bonus"] }, amount] } },
    [
      {
        $set: {
          bonus: { $max: [{ $subtract: ["$bonus", amount] }, 0] },
          transferable: { $subtract: ["$transferable", { $max: [{ $subtract: [amount, "$bonus"] }, 0] }] },
          updatedAt: "$$NOW",
        },
      },
    ],
    { returnDocument: "before" },
  );
  return before ? Math.min(before.bonus, amount) : null;
}

/** ตัดยอดจากกระเป๋าเดียวแบบ atomic — ยอดไม่พอคืน false (ไม่ติดลบ) */
export async function debitBucket(userId: string, bucket: Bucket, amount: number) {
  const { wallets } = await collections();
  const r = await wallets.updateOne({ _id: userId, [bucket]: { $gte: amount } }, { $inc: { [bucket]: -amount }, $set: { updatedAt: new Date() } });
  return r.modifiedCount === 1;
}

export const debitTransferable = (userId: string, amount: number) => debitBucket(userId, "transferable", amount);
