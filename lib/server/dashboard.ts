import { getDb } from "@/lib/db/mongo";
import { getStats } from "./admin";
import { bangkokDate } from "./daily";
import { getFinanceReport } from "./finance";
import { getPaymentMethods } from "./payments";
import { getDailyConfig, getPromo } from "./settings";

type UserLite = { _id: string; name: string; email: string; image?: string | null; providers: string[]; createdAt: Date };

/** ข้อมูลหน้าภาพรวมหลังบ้าน — 30 วันล่าสุด (เวลาไทย) */
export async function getDashboard() {
  const db = await getDb();
  const users = db.collection<UserLite>("users");
  const txs = db.collection("transactions");
  const today = bangkokDate();
  const [stats, report, payments, promo, daily, recentUsers, checkins] = await Promise.all([
    getStats(),
    getFinanceReport(),
    getPaymentMethods(),
    getPromo(),
    getDailyConfig(),
    users.find({}, { projection: { name: 1, email: 1, image: 1, providers: 1, createdAt: 1 } }).sort({ createdAt: -1 }).limit(6).toArray(),
    txs.countDocuments({ kind: "reward", rewardDate: today }),
  ]);
  const start = new Date(`${report.from}T00:00:00+07:00`);
  const top = await txs.aggregate<{ _id: string; baht: number; count: number }>([
    { $match: { kind: "topup", status: "completed", updatedAt: { $gte: start } } },
    { $group: { _id: "$userId", baht: { $sum: "$topup.payAmount" }, count: { $sum: 1 } } },
    { $sort: { baht: -1 } }, { $limit: 5 },
  ]).toArray();
  const topUsers = await users.find({ _id: { $in: top.map((t) => t._id) } }, { projection: { name: 1, email: 1, image: 1 } }).toArray();

  const days = report.days;
  const t = days.at(-1)!;
  const y = days.at(-2);
  const sum = (k: "promptpay" | "truemoney" | "posters" | "newUsers") => days.reduce((s, d) => s + d[k], 0);
  return {
    stats,
    today: t,
    yesterday: y ?? null,
    days: days.slice(-14),
    month: { ...report.totals, promptpay: sum("promptpay"), truemoney: sum("truemoney"), posters: sum("posters"), newUsers: sum("newUsers"), from: report.from, to: report.to },
    checkinsToday: checkins,
    topPayers: top.map((r) => {
      const u = topUsers.find((x) => x._id === r._id);
      return { id: r._id, name: u?.name ?? "ผู้ใช้ที่ถูกลบ", email: u?.email ?? "", image: u?.image ?? null, baht: r.baht / 100, count: r.count };
    }),
    recentUsers: recentUsers.map((u) => ({ id: u._id, name: u.name, email: u.email, image: u.image ?? null, providers: u.providers ?? [], createdAt: u.createdAt.toISOString() })),
    status: [
      { label: "PromptPay", ok: payments.promptpayReady, detail: payments.promptpayReady ? "ตั้งเลขรับเงินแล้ว" : "ยังไม่ตั้งเลขพร้อมเพย์", href: "/admin/payments" },
      { label: "ตรวจสลิป Slip2Go", ok: payments.slipEnabled, detail: payments.slipEnabled ? "เปิดใช้ · ยืนยันอัตโนมัติ" : "ปิดอยู่ · ต้องยืนยันเอง", href: "/admin/payments" },
      { label: "ซองของขวัญ TrueMoney", ok: payments.truemoneyEnabled, detail: payments.truemoneyEnabled ? "เปิดใช้" : "ปิดอยู่", href: "/admin/payments" },
      { label: "TrueMoney Wallet", ok: payments.truemoneyWalletEnabled, detail: payments.truemoneyWalletEnabled ? "เปิดใช้ · แนบสลิป" : "ปิดอยู่", href: "/admin/payments" },
      { label: "โปรโมชัน", ok: promo.enabled, detail: promo.enabled ? promo.title : "ปิดอยู่", href: "/admin/promo" },
      { label: "เช็กอินรายวัน", ok: daily.enabled, detail: daily.enabled ? `${daily.days.length} วัน · วันนี้ ${checkins} คน` : "ปิดอยู่", href: "/admin/daily" },
    ],
  };
}
