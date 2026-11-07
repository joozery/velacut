import Link from "next/link";
import { CheckCircle2, Clock3, ListOrdered, XCircle } from "lucide-react";
import { listTransactions } from "@/lib/server/admin";
import { Card, FilterBar, PageTitle, Pager, fieldClass, qs } from "@/components/admin/ui";
import { TxTable } from "@/components/admin/tx-table";
import { FilterSelect } from "@/components/admin/filter-select";

export const metadata = { title: "คำสั่งเติมเงิน" };
type Params = { status?: string; method?: string; q?: string; page?: string };

export default async function AdminTopups({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const status = ["pending", "completed", "failed"].includes(sp.status ?? "") ? sp.status! : "all";
  const method = ["promptpay", "truemoney", "truemoney_wallet"].includes(sp.method ?? "") ? sp.method! : "all";
  const data = await listTransactions({ kind: "topup", status, method, q: sp.q, page: sp.page, withStatusCounts: true });
  const filtered = Boolean(sp.q?.trim() || status !== "all" || method !== "all");
  const summary = [
    { key: "all", label: "ทั้งหมด", icon: ListOrdered, color: "text-foreground" },
    { key: "pending", label: "รอชำระ / ตรวจสอบ", icon: Clock3, color: "text-amber-600 dark:text-amber-300" },
    { key: "completed", label: "เติมสำเร็จ", icon: CheckCircle2, color: "text-success" },
    { key: "failed", label: "ไม่สำเร็จ / หมดอายุ", icon: XCircle, color: "text-danger" },
  ] as const;
  return <>
    <PageTitle title="คำสั่งเติมเงิน" desc="ติดตามรายการเติมอัตโนมัติ ดูหลักฐาน และจัดการกรณีที่ต้องตรวจสอบเอง"><Link href="/admin/finance" className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm hover:bg-surface-2">ดูรายงานการเงิน ↗</Link></PageTitle>
    <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">{summary.map(item => <Link key={item.key} href={qs("/admin/topups", { status: item.key, method, q: sp.q })} aria-current={status === item.key ? "page" : undefined} className={`rounded-2xl focus-visible:outline-2 focus-visible:outline-ring ${status === item.key ? "ring-2 ring-primary" : ""}`}><Card className="p-4 transition-colors hover:bg-surface-2"><div className="flex items-center justify-between gap-2"><p className="text-[11px] text-muted-foreground">{item.label}</p><item.icon className={`size-4 ${item.color}`} aria-hidden /></div><p className={`mt-3 text-2xl font-bold tabular-nums ${item.color}`}>{data.counts[item.key].toLocaleString("th-TH")} <span className="text-[10px] font-normal text-muted-foreground">รายการ</span></p></Card></Link>)}</div>
    <p className="mb-5 text-[11px] leading-5 text-muted-foreground">จำนวนด้านบนอิงคำค้นและช่องทางที่เลือก · สลิปผ่านจะเติมเครดิตอัตโนมัติ ปุ่มยืนยันเองใช้สำหรับรายการที่ผู้ดูแลตรวจยอดรับแล้ว</p>
    <Card className="overflow-hidden">
      <FilterBar action="/admin/topups"><input name="q" aria-label="ค้นหารายการเติมเงิน" defaultValue={sp.q} placeholder="ยอดโอน อีเมล เลขรายการ หรือเลขอ้างอิงสลิป" maxLength={160} className={`${fieldClass} min-w-0 flex-1`} /><FilterSelect key={`method-${method}`} name="method" defaultValue={method} label="ช่องทางชำระเงิน" className="sm:w-44" options={[["all", "ทุกช่องทาง"], ["promptpay", "PromptPay"], ["truemoney_wallet", "Wallet โอนเบอร์"], ["truemoney", "ซองอั่งเปา"]]} /><FilterSelect key={`status-${status}`} name="status" defaultValue={status} label="สถานะ" className="sm:w-44" options={[["all", "ทุกสถานะ"], ["pending", "รอชำระ / ตรวจสอบ"], ["completed", "สำเร็จ"], ["failed", "ไม่สำเร็จ / หมดอายุ"]]} /></FilterBar>
      {filtered && <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-2/40 px-4 py-2.5 text-xs"><p className="text-muted-foreground">พบ {data.total.toLocaleString("th-TH")} รายการ{sp.q?.trim() && <> สำหรับ “{sp.q.trim()}”</>}</p><Link href="/admin/topups" className="shrink-0 text-primary hover:underline">ล้างตัวกรอง</Link></div>}
      <TxTable rows={data.rows} showActions />
      <Pager page={data.page} pages={data.pages} total={data.total} href={page => qs("/admin/topups", { status, method, q: sp.q, page })} />
    </Card>
  </>;
}
