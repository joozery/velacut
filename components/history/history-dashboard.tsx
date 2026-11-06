"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Copy, FileImage, Gift, Info, Search, SearchX, Send, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatCoins, formatCoinsFixed } from "@/lib/format";
import { DEFAULT_GAME } from "@/lib/games";
import type { HistoryKind, HistoryRecord, HistoryStatus } from "@/lib/history";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast-store";

const kinds = {
  topup: { label: "เติมคอยน์", icon: ArrowDownLeft, color: "bg-primary-soft text-primary" },
  poster: { label: "สร้างป้าย", icon: FileImage, color: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" },
  transfer: { label: "โอนคอยน์", icon: Send, color: "bg-surface-2 text-muted-foreground" },
  reward: { label: "รางวัล", icon: Gift, color: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300" },
};
const statuses = {
  completed: { label: "สำเร็จ", icon: CheckCircle2, color: "bg-success-soft text-success" },
  pending: { label: "รอดำเนินการ", icon: Clock3, color: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300" },
  failed: { label: "ไม่สำเร็จ", icon: XCircle, color: "bg-danger-soft text-danger" },
};
const PAGE_SIZE = 5;
const dateFormatter = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" });
const timeFormatter = new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
const formatDate = (date: string) => dateFormatter.format(new Date(date));
const formatTime = (date: string) => timeFormatter.format(new Date(date));

function Status({ status }: { status: HistoryStatus }) {
  const config = statuses[status];
  const Icon = config.icon;
  return <span className={cn("inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium", config.color)}><Icon className="size-3" aria-hidden />{config.label}</span>;
}
function Amount({ record }: { record: HistoryRecord }) {
  return <span className={cn("font-semibold whitespace-nowrap tabular-nums", record.status !== "completed" ? "text-muted-foreground" : record.coins > 0 ? "text-primary" : "text-foreground")}>{record.coins > 0 ? "+" : "−"}{formatCoins(Math.abs(record.coins))}<span className="ml-1 text-[9px] font-normal text-muted-foreground">คอยน์</span></span>;
}

export function HistoryDashboard({ records, balance }: { records: HistoryRecord[]; balance: number }) {
  const [kind, setKind] = useState<"all" | HistoryKind>("all");
  const [status, setStatus] = useState<"all" | HistoryStatus>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const completed = records.filter((record) => record.status === "completed");
  const filtered = records.filter((record) => (kind === "all" || record.kind === kind) && (status === "all" || record.status === status) && `${record.id} ${record.title} ${record.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const showDetails = (record: HistoryRecord) => { setSelected(record); setDetailsOpen(true); };
  const reset = () => { setKind("all"); setStatus("all"); setQuery(""); setPage(1); };
  const stats = [
    { label: "คอยน์คงเหลือ", value: formatCoinsFixed(balance), icon: Wallet, note: "ยอดในกระเป๋า", primary: true },
    { label: "รายการสำเร็จ", value: String(completed.length), icon: CheckCircle2, note: "จากข้อมูลตัวอย่าง" },
    { label: "ป้ายที่สร้าง", value: String(completed.filter((record) => record.kind === "poster").length), icon: FileImage, note: "จากข้อมูลตัวอย่าง" },
  ];

  return <>
    <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">{stats.map((stat) => <div key={stat.label} className={cn("min-w-0 rounded-2xl border p-3 sm:p-5", stat.primary ? "border-primary/15 bg-primary-soft/50" : "border-border bg-surface")}><div className="mb-3 flex items-center justify-between gap-1"><span className="text-[10px] leading-5 text-muted-foreground sm:text-xs">{stat.label}</span><stat.icon className={cn("hidden size-4 shrink-0 sm:block", stat.primary ? "text-primary" : "text-muted-foreground")} aria-hidden /></div><p className={cn("text-xl leading-none font-bold tracking-tight tabular-nums sm:text-[28px]", stat.primary && "text-primary")}>{stat.value}</p><p className="mt-2 text-[8px] leading-4 text-muted-foreground sm:text-[10px]">{stat.note}</p></div>)}</div>
    <p className="mb-5 flex items-start gap-2 text-[10px] leading-5 text-muted-foreground"><Info className="mt-1 size-3 shrink-0 text-primary" aria-hidden /><span><strong className="font-medium text-primary">ข้อมูลตัวอย่าง</strong> · รายการด้านล่างใช้แสดงหน้าจอ ยังไม่ใช่ประวัติธุรกรรมจริง</span></p>

    <Tabs value={kind} onValueChange={(value) => { setKind(value as typeof kind); setPage(1); }} className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-4 sm:px-5"><TabsList aria-label="ประเภทรายการ" className="h-auto w-full justify-start gap-4 rounded-none bg-transparent p-0 sm:gap-6">{(["all", ...Object.keys(kinds)] as ("all" | HistoryKind)[]).map((value) => <TabsTrigger key={value} value={value} className="relative h-14 gap-1.5 rounded-none border-b-2 border-transparent px-0 text-[11px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none sm:text-xs">{value === "all" ? "ทั้งหมด" : kinds[value].label}<span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] text-muted-foreground">{value === "all" ? records.length : records.filter((record) => record.kind === value).length}</span></TabsTrigger>)}</TabsList></div>
      <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center sm:px-5"><div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} aria-label="ค้นหารายการ" placeholder="ค้นหารายการ หรือเลขอ้างอิง" className="h-11 w-full rounded-xl border border-input bg-surface-2/40 pr-3 pl-9 text-base placeholder:text-xs placeholder:text-muted-foreground sm:text-xs" /></div><select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} aria-label="กรองสถานะ" className="h-11 rounded-xl border border-input bg-surface px-3 text-xs text-foreground sm:w-40"><option value="all">ทุกสถานะ</option>{Object.entries(statuses).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}</select></div>
      <TabsContent value={kind} className="m-0">
        {visible.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-surface-2 text-muted-foreground"><SearchX className="size-6" aria-hidden /></span><h2 className="mt-4 text-sm font-semibold">ไม่พบรายการที่ค้นหา</h2><p className="mt-2 text-xs text-muted-foreground">ลองใช้คำค้นอื่น หรือเลือกดูรายการทั้งหมด</p><Button variant="outline" size="sm" className="mt-5 rounded-xl" onClick={reset}>ล้างตัวกรอง</Button></div> : <>
          <div className="hidden md:block"><table className="w-full text-left"><caption className="sr-only">รายการประวัติตัวอย่างของคุณ</caption><thead className="bg-surface-2/40 text-[10px] font-medium text-muted-foreground"><tr><th scope="col" className="px-5 py-3 font-medium">รายการ</th><th scope="col" className="px-3 py-3 font-medium">วันและเวลา</th><th scope="col" className="px-3 py-3 text-right font-medium">คอยน์</th><th scope="col" className="px-4 py-3 font-medium">สถานะ</th><th scope="col" className="pr-5"><span className="sr-only">รายละเอียด</span></th></tr></thead><tbody className="divide-y divide-border/70">{visible.map((record) => { const config = kinds[record.kind]; const Icon = config.icon; return <tr key={record.id} className="transition-colors hover:bg-surface-2/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", config.color)}><Icon className="size-4" aria-hidden /></span><div><p className="text-xs font-semibold">{record.title}</p><p className="mt-1 text-[10px] text-muted-foreground">{record.description}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground/70">{record.id}</p></div></div></td><td className="px-3 text-[11px] whitespace-nowrap"><p>{formatDate(record.date)}</p><p className="mt-1 text-[10px] text-muted-foreground">{formatTime(record.date)} น.</p></td><td className="px-3 text-right text-xs"><Amount record={record} /></td><td className="px-4"><Status status={record.status} /></td><td className="pr-4"><Button variant="ghost" size="icon-sm" aria-label={`ดูรายละเอียด ${record.id}`} onClick={() => showDetails(record)}><ArrowUpRight className="size-4" aria-hidden /></Button></td></tr>; })}</tbody></table></div>
          <ul className="divide-y divide-border/70 md:hidden">{visible.map((record) => { const config = kinds[record.kind]; const Icon = config.icon; return <li key={record.id}><button type="button" aria-label={`ดูรายละเอียด ${record.id}`} onClick={() => showDetails(record)} className="flex w-full items-start gap-3 p-4 text-left transition-colors active:bg-surface-2"><span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", config.color)}><Icon className="size-4" aria-hidden /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-xs leading-5 font-semibold">{record.title}</span><ArrowUpRight className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden /></span><span className="mt-0.5 block text-[10px] leading-5 text-muted-foreground">{record.description}</span><span className="mt-2 flex items-center justify-between gap-2"><span className="text-sm"><Amount record={record} /></span><Status status={record.status} /></span><span className="mt-2 block text-[9px] text-muted-foreground">{formatDate(record.date)} · {formatTime(record.date)} น.</span></span></button></li>; })}</ul>
        </>}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-5"><p role="status" className="text-[10px] text-muted-foreground">{filtered.length ? `แสดง ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} จาก ${filtered.length} รายการ` : "0 รายการ"}</p><div className="flex items-center gap-1"><Button variant="ghost" size="icon-sm" aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft className="size-4" aria-hidden /></Button><span className="px-1 text-[10px] text-muted-foreground tabular-nums">{currentPage} / {pageCount}</span><Button variant="ghost" size="icon-sm" aria-label="หน้าถัดไป" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight className="size-4" aria-hidden /></Button></div></div>
      </TabsContent>
    </Tabs>

    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}><DialogContent className="max-w-md">{selected && <>
      <DialogTitle>รายละเอียดรายการ</DialogTitle><DialogDescription>ข้อมูลตัวอย่าง · {kinds[selected.kind].label}</DialogDescription>
      <div className="flex items-center justify-between rounded-xl bg-surface-2/60 p-4"><div><p className="text-xs font-semibold">{selected.title}</p><p className="mt-2 text-2xl"><Amount record={selected} /></p></div><Status status={selected.status} /></div>
      <dl className="grid gap-3 text-xs"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">เลขอ้างอิง</dt><dd className="font-mono text-[11px] select-all">{selected.id}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">วันและเวลา</dt><dd>{formatDate(selected.date)} · {formatTime(selected.date)} น.</dd></div>{selected.baht !== undefined && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">จำนวนเงิน</dt><dd>{formatCoins(selected.baht)} บาท</dd></div>}</dl>
      <p className="rounded-xl border border-border p-3 text-[11px] leading-6 text-muted-foreground">{selected.note}</p>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={async () => { try { await navigator.clipboard.writeText(selected.id); toast({ title: "คัดลอกเลขอ้างอิงแล้ว", variant: "success" }); } catch { toast({ title: "คัดลอกไม่ได้ กรุณาเลือกเลขอ้างอิงแล้วคัดลอก", variant: "error" }); } }}><Copy className="size-3.5" aria-hidden />คัดลอกเลขอ้างอิง</Button>{selected.kind === "poster" ? <DialogClose asChild><Button asChild size="sm" className="rounded-xl"><Link href={`/generate/${DEFAULT_GAME}`}>สร้างป้ายใหม่<ArrowUpRight aria-hidden /></Link></Button></DialogClose> : <DialogClose asChild><Button size="sm" className="rounded-xl"><Check className="size-3.5" aria-hidden />ปิด</Button></DialogClose>}</div>
    </>}</DialogContent></Dialog>
  </>;
}
