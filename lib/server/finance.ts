import { getDb } from "@/lib/db/mongo";
import { fromUnits } from "@/lib/money";
import { bangkokDate } from "./daily";
import { UserError } from "./poster";
import { MongoServerError } from "mongodb";

const DAY = 86_400_000;
export function financeRange(from?: string, to?: string, now = new Date()) {
  const end = to || bangkokDate(now);
  const valid = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s;
  if (!valid(end)) throw new UserError("วันที่สิ้นสุดไม่ถูกต้อง");
  const start = from || new Date(Date.parse(end) - 29 * DAY).toISOString().slice(0, 10);
  if (!valid(start)) throw new UserError("วันที่เริ่มต้นไม่ถูกต้อง");
  const count = (Date.parse(end) - Date.parse(start)) / DAY + 1;
  if (count < 1 || count > 93) throw new UserError("เลือกช่วงวันที่ไม่เกิน 93 วัน และวันเริ่มต้นต้องไม่เกินวันสิ้นสุด");
  return { from: start, to: end, start: new Date(`${start}T00:00:00+07:00`), end: new Date(new Date(`${end}T00:00:00+07:00`).getTime() + DAY), days: Array.from({ length: count }, (_, i) => new Date(Date.parse(start) + i * DAY).toISOString().slice(0, 10)) };
}

export type FinanceDay = { date: string; active: number; newUsers: number; payers: number; topups: number; promptpay: number; truemoney: number; revenue: number; spent: number; posters: number };
const dateExpr = (field: string) => ({ $dateToString: { date: field, format: "%Y-%m-%d", timezone: "Asia/Bangkok" } });

/** Activity is counted once per signed-in account and Thai calendar day. */
export async function recordAccountActivity(userId: string) {
  const date = bangkokDate();
  await (await getDb()).collection<{ _id: string; date: string; userId: string; createdAt: Date }>("daily_activity").updateOne({ _id: `${date}:${userId}` }, { $setOnInsert: { date, userId, createdAt: new Date() } }, { upsert: true }).catch(error => {
    if (!(error instanceof MongoServerError && error.code === 11000)) throw error;
  });
}

export async function getFinanceReport(from?: string, to?: string) {
  const range = financeRange(from, to);
  const db = await getDb();
  const txs = db.collection("transactions");
  const [money, usage, activity, signups] = await Promise.all([
    txs.aggregate<{ _id: string; promptpay: number; truemoney: number; payers: string[]; count: number }>([
      { $match: { kind: "topup", status: "completed" } },
      { $set: { reportDate: { $ifNull: ["$completedAt", "$updatedAt"] } } },
      { $match: { reportDate: { $gte: range.start, $lt: range.end } } },
      { $group: { _id: dateExpr("$reportDate"), promptpay: { $sum: { $cond: [{ $eq: ["$topup.method", "promptpay"] }, "$topup.payAmount", 0] } }, truemoney: { $sum: { $cond: [{ $in: ["$topup.method", ["truemoney", "truemoney_wallet"]] }, "$topup.payAmount", 0] } }, payers: { $addToSet: "$userId" }, count: { $sum: 1 } } },
    ]).toArray(),
    txs.aggregate<{ _id: string; users: string[]; spent: number; posters: number }>([
      { $match: { createdAt: { $gte: range.start, $lt: range.end } } },
      { $group: { _id: dateExpr("$createdAt"), users: { $addToSet: "$userId" }, spent: { $sum: { $cond: [{ $and: [{ $eq: ["$kind", "poster"] }, { $eq: ["$status", "completed"] }] }, { $abs: "$amount" }, 0] } }, posters: { $sum: { $cond: [{ $and: [{ $eq: ["$kind", "poster"] }, { $eq: ["$status", "completed"] }] }, 1, 0] } } } },
    ]).toArray(),
    db.collection("daily_activity").aggregate<{ _id: string; users: string[] }>([
      { $match: { date: { $gte: range.from, $lte: range.to } } }, { $group: { _id: "$date", users: { $addToSet: "$userId" } } },
    ]).toArray(),
    db.collection("users").aggregate<{ _id: string; count: number }>([
      { $match: { createdAt: { $gte: range.start, $lt: range.end } } }, { $group: { _id: dateExpr("$createdAt"), count: { $sum: 1 } } },
    ]).toArray(),
  ]);
  const allActive = new Set<string>();
  const allPayers = new Set<string>();
  const days: FinanceDay[] = range.days.map(date => {
    const m = money.find(r => r._id === date);
    const u = usage.find(r => r._id === date);
    const a = activity.find(r => r._id === date);
    // Historical transactions remain useful before activity tracking was introduced.
    const users = new Set([...(u?.users ?? []), ...(a?.users ?? []), ...(m?.payers ?? [])]);
    users.forEach(id => allActive.add(id));
    m?.payers.forEach(id => allPayers.add(id));
    const pp = (m?.promptpay ?? 0) / 100, tm = (m?.truemoney ?? 0) / 100;
    return { date, active: users.size, newUsers: signups.find(r => r._id === date)?.count ?? 0, payers: m?.payers.length ?? 0, topups: m?.count ?? 0, promptpay: pp, truemoney: tm, revenue: pp + tm, spent: fromUnits(u?.spent ?? 0), posters: u?.posters ?? 0 };
  });
  // Sum currency as integer satang to avoid cumulative floating-point errors.
  const revenue = money.reduce((sum, r) => sum + r.promptpay + r.truemoney, 0) / 100;
  return { from: range.from, to: range.to, days, totals: { revenue, active: allActive.size, payers: allPayers.size, topups: money.reduce((sum, r) => sum + r.count, 0), spent: fromUnits(usage.reduce((sum, r) => sum + r.spent, 0)) } };
}
