import Link from "next/link";
import { Banknote, Coins, Users, Wallet } from "lucide-react";
import { Card, PageTitle, fieldClass } from "@/components/admin/ui";
import { getFinanceReport } from "@/lib/server/finance";
import { UserError } from "@/lib/server/poster";
import { requireAdminPage } from "@/lib/server/session";
import { formatBaht, formatCoinsFixed, formatInt } from "@/lib/format";

export const metadata = { title: "รายงานการเงิน" };
const dateLabel = (s: string) => new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" }).format(new Date(`${s}T00:00:00+07:00`));

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireAdminPage();
  const sp = await searchParams;
  let report;
  try { report = await getFinanceReport(sp.from, sp.to); }
  catch (error) {
    if (!(error instanceof UserError)) throw error;
    return <><PageTitle title="รายงานการเงิน" /><Card className="p-6"><p role="alert" className="text-sm text-danger">{error.message}</p><Link href="/admin/finance" className="mt-3 inline-block text-sm text-primary underline">กลับรายงาน 30 วันล่าสุด</Link></Card></>;
  }
  const { days, totals } = report;
  const max = Math.max(1, ...days.map(d => d.revenue));
  const cards = [
    { label: "ยอดเติมสำเร็จ", value: `฿${formatBaht(totals.revenue)}`, sub: `${formatInt(totals.topups)} รายการ · รวมเศษสตางค์ที่ได้รับ`, icon: Banknote },
    { label: "ผู้ใช้ในช่วงวันที่", value: formatInt(totals.active), sub: "บัญชีที่ใช้งาน / ทำรายการ ไม่ซ้ำคน", icon: Users },
    { label: "คนเติมเงิน", value: formatInt(totals.payers), sub: "นับเฉพาะเติมสำเร็จ ไม่ซ้ำคน", icon: Wallet },
    { label: "เครดิตใช้สร้างป้าย", value: formatCoinsFixed(totals.spent), sub: "หน่วยคอยน์ · แยกจากรายรับเงินบาท", icon: Coins },
  ];
  return <>
    <PageTitle title="รายงานการเงิน" desc="สรุปยอดเติมเงินและการใช้งานตามช่วงวันที่ที่เลือก"><Link href="/admin/topups?status=completed" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm hover:bg-surface-2">ดูรายการเติมสำเร็จ</Link></PageTitle>
    <Card className="mb-5 p-4"><form action="/admin/finance" className="flex flex-wrap items-end gap-3"><label className="grid flex-1 gap-1.5 text-xs text-muted-foreground">ตั้งแต่วันที่<input type="date" name="from" required defaultValue={report.from} className={`${fieldClass} w-full`} /></label><label className="grid flex-1 gap-1.5 text-xs text-muted-foreground">ถึงวันที่<input type="date" name="to" required defaultValue={report.to} className={`${fieldClass} w-full`} /></label><button className="h-10 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover">แสดงรายงาน</button><Link href="/admin/finance" className="grid h-10 place-items-center px-2 text-xs text-muted-foreground hover:text-primary">30 วันล่าสุด</Link></form><p className="mt-3 text-[11px] text-muted-foreground">เลือกได้สูงสุด 93 วัน · รายรับนับตามวันยืนยันเติมสำเร็จ ไม่นับรายการรอชำระหรือไม่สำเร็จ</p></Card>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(c => <Card key={c.label} className="p-5"><div className="flex items-center justify-between text-xs text-muted-foreground">{c.label}<c.icon className="size-4 text-primary" aria-hidden /></div><p className="mt-3 text-2xl font-bold tabular-nums">{c.value}</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{c.sub}</p></Card>)}</div>
    <Card className="mt-6 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-semibold">แนวโน้มยอดเติมเงิน</h2><p className="text-xs text-muted-foreground">{dateLabel(report.from)} – {dateLabel(report.to)}</p></div><div className="mt-4 flex gap-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" />PromptPay</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-orange-400" />TrueMoney (ซอง / โอน Wallet)</span></div>{totals.revenue === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">ยังไม่มียอดเติมสำเร็จในช่วงวันที่นี้</p> : <div className="mt-6 overflow-x-auto"><div className="flex h-44 items-end gap-1 border-b border-border pb-1" style={{ minWidth: days.length * 12 }} role="img" aria-label="กราฟยอดเติมสำเร็จในช่วงวันที่ที่เลือก แยก PromptPay และ TrueMoney">{days.map(d => <div key={d.date} className="flex h-full min-w-2 flex-1 flex-col justify-end" title={`${dateLabel(d.date)} · PromptPay ฿${formatBaht(d.promptpay)} · TrueMoney ฿${formatBaht(d.truemoney)}`}><div className="rounded-t bg-orange-400" style={{ height: `${d.truemoney / max * 100}%` }} /><div className="bg-primary" style={{ height: `${d.promptpay / max * 100}%` }} /></div>)}</div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>{dateLabel(report.from)}</span><span>{dateLabel(report.to)}</span></div></div>}</Card>
    <p className="mt-4 text-[11px] leading-6 text-muted-foreground">ผู้ใช้และคนเติมนับไม่ซ้ำในช่วงวันที่ที่เลือก · ยอดเงินคือยอดเติมสำเร็จ · เวลาไทย (UTC+7)</p>
  </>;
}
