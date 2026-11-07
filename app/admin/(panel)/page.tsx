import Link from "next/link";
import { ArrowRight, Coins as CoinsIcon, FileImage, QrCode, Users } from "lucide-react";
import { getStats, listTransactions } from "@/lib/server/admin";
import { formatCoinsFixed, formatInt } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";
import { TxTable } from "@/components/admin/tx-table";

export const metadata = { title: "ภาพรวม" };

export default async function AdminDashboard() {
  const [s, pending, recent] = await Promise.all([getStats(), listTransactions({ kind: "topup", status: "pending" }), listTransactions({})]);
  const cards = [
    { label: "คำสั่งเติมรอยืนยัน", value: formatInt(s.pendingTopups), sub: "ตรวจยอดแล้วกดยืนยัน", icon: QrCode, href: "/admin/topups", alert: s.pendingTopups > 0 },
    { label: "ยอดเติมวันนี้", value: `฿${formatInt(s.topupTodayBaht)}`, sub: `${formatInt(s.topupTodayCount)} รายการสำเร็จ`, icon: CoinsIcon },
    { label: "ผู้ใช้ทั้งหมด", value: formatInt(s.users), sub: `ใหม่วันนี้ ${formatInt(s.newUsers)} คน`, icon: Users, href: "/admin/users" },
    { label: "ป้ายที่ขายแล้ว", value: formatInt(s.posters), sub: `ใช้ไป ${formatCoinsFixed(s.posterCoins)} เครดิต`, icon: FileImage },
  ];
  return (
    <>
      <PageTitle title="ภาพรวม" desc="สรุปสถานะระบบ ณ ตอนนี้" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const body = (
            <Card className={c.alert ? "border-danger/30 bg-danger-soft/40 p-4" : "p-4"}>
              <div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{c.label}</span><c.icon className={c.alert ? "size-4 text-danger" : "size-4 text-muted-foreground"} aria-hidden /></div>
              <p className={c.alert ? "mt-3 text-2xl font-bold text-danger tabular-nums" : "mt-3 text-2xl font-bold tabular-nums"}>{c.value}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{c.sub}</p>
            </Card>
          );
          return c.href ? <Link key={c.label} href={c.href} className="rounded-2xl transition-shadow hover:shadow-[0_4px_16px_rgb(17_17_20/0.06)]">{body}</Link> : <div key={c.label}>{body}</div>;
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">เครดิตคงค้างในระบบ: โอนได้ {formatCoinsFixed(s.coinsTransferable)} · โบนัส {formatCoinsFixed(s.coinsBonus)}</p>

      <Card className="mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">คำสั่งเติมรอยืนยัน</h2><Link href="/admin/topups" className="flex items-center gap-1 text-xs text-primary hover:underline">ดูทั้งหมด<ArrowRight className="size-3" aria-hidden /></Link></div>
        <TxTable rows={pending.rows.slice(0, 5)} showActions />
      </Card>
      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3"><h2 className="text-sm font-semibold">รายการล่าสุด</h2><Link href="/admin/transactions" className="flex items-center gap-1 text-xs text-primary hover:underline">ดูทั้งหมด<ArrowRight className="size-3" aria-hidden /></Link></div>
        <TxTable rows={recent.rows.slice(0, 8)} />
      </Card>
    </>
  );
}
