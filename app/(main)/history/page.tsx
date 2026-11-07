import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { HistoryDashboard } from "@/components/history/history-dashboard";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listHistory } from "@/lib/server/account";

export const metadata: Metadata = { title: copy.pages.history.title };

export default async function HistoryPage() {
  const user = (await auth())?.user;
  if (!user?.id) redirect("/login?callbackUrl=%2Fhistory");
  const records = await listHistory(user.id);
  return <div className="bg-background"><div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
    <nav aria-label="เส้นทางหน้าประวัติ" className="mb-6 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Link href="/" className="hover:text-primary">หน้าแรก</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">ประวัติรายการ</span></nav>
    <header className="mb-6 flex items-center justify-between gap-4"><div><p className="mb-2 font-mono text-[9px] tracking-[0.18em] text-primary">YOUR ACTIVITY, ALL IN ONE PLACE</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ประวัติ<span className="text-primary">ของคุณ</span></h1><p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">ติดตามการเติมเครดิต สร้างป้าย และทุกความเคลื่อนไหว</p></div><Button asChild size="sm" className="shrink-0 rounded-xl"><Link href="/topup"><Wallet className="size-4" aria-hidden />เติมเครดิต</Link></Button></header>
    <HistoryDashboard records={records} />
  </div></div>;
}
