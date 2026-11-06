import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { HistoryDashboard } from "@/components/history/history-dashboard";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { SAMPLE_HISTORY } from "@/lib/history";
import { MOCK_USER } from "@/lib/mock";

export const metadata: Metadata = { title: copy.pages.history.title };

export default function HistoryPage() {
  return <div className="bg-background"><div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
    <nav aria-label="เส้นทางหน้าประวัติ" className="mb-6 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Link href="/" className="hover:text-primary">หน้าแรก</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">ประวัติรายการ</span></nav>
    <header className="mb-6 flex items-center justify-between gap-4"><div><p className="mb-2 font-mono text-[9px] tracking-[0.18em] text-primary">YOUR ACTIVITY, ALL IN ONE PLACE</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ประวัติ<span className="text-primary">ของคุณ</span></h1><p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">ติดตามการเติมคอยน์ สร้างป้าย และทุกความเคลื่อนไหว</p></div><Button asChild size="sm" className="shrink-0 rounded-xl"><Link href="/topup"><Wallet className="size-4" aria-hidden />เติมคอยน์</Link></Button></header>
    <HistoryDashboard records={SAMPLE_HISTORY} balance={MOCK_USER.wallet.balance} />
  </div></div>;
}
