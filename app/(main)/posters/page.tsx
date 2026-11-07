import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, FileImage, Plus } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PostersTable } from "@/components/posters/posters-table";
import { formatCoinsFixed } from "@/lib/format";
import { DEFAULT_GAME } from "@/lib/games";
import { listPosters } from "@/lib/server/account";

export const metadata: Metadata = { title: "ป้ายของฉัน" };

export default async function PostersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = (await auth())?.user;
  if (!user?.id) redirect("/login?callbackUrl=%2Fposters");
  const { posters, total, page, pages, summary } = await listPosters(user.id, (await searchParams).page);
  const href = (p: number) => (p > 1 ? `/posters?page=${p}` : "/posters");
  return (
    <div className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 sm:px-8 sm:pt-8">
        <nav aria-label="เส้นทางหน้าป้ายของฉัน" className="mb-6 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Link href="/" className="hover:text-primary">หน้าแรก</Link><ChevronRight className="size-3" aria-hidden /><span aria-current="page">ป้ายของฉัน</span></nav>
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="mb-2 font-mono text-[9px] tracking-[0.18em] text-primary">YOUR POSTERS, READY ANYTIME</p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">ป้าย<span className="text-primary">ของฉัน</span></h1>
            <p className="mt-2 text-xs leading-6 text-muted-foreground sm:text-sm">ป้ายทั้งหมดที่คุณสร้าง {total.toLocaleString("th-TH")} ใบ · ดาวน์โหลดซ้ำได้ฟรีทุกเมื่อ</p>
          </div>
          <Button asChild size="sm" className="shrink-0 rounded-xl"><Link href={`/generate/${DEFAULT_GAME}`}><Plus className="size-4" aria-hidden />สร้างป้ายใหม่</Link></Button>
        </header>

        {posters.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-5 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary"><FileImage className="size-6" aria-hidden /></span>
            <h2 className="mt-4 text-base font-semibold">ยังไม่มีป้าย</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">สร้างป้ายแล้วดาวน์โหลด ป้ายจะถูกเก็บไว้ที่นี่ให้ดาวน์โหลดซ้ำได้ฟรี</p>
            <Button asChild className="mt-5 rounded-xl"><Link href={`/generate/${DEFAULT_GAME}`}><Plus aria-hidden />เริ่มสร้างป้าย</Link></Button>
          </div>
        ) : (
          <>
            <dl className="mb-4 grid grid-cols-3 gap-3">
              {[
                { label: "ป้ายทั้งหมด", value: total.toLocaleString("th-TH"), unit: "ใบ" },
                { label: "ไม่มีลายน้ำ / มีลายน้ำ", value: `${summary.clean.toLocaleString("th-TH")} / ${summary.watermark.toLocaleString("th-TH")}`, unit: "ใบ" },
                { label: "ใช้เครดิตไปแล้ว", value: formatCoinsFixed(summary.spent), unit: "เครดิต" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-surface px-4 py-3">
                  <dt className="truncate text-[11px] text-muted-foreground">{s.label}</dt>
                  <dd className="mt-1 text-lg font-bold tabular-nums sm:text-xl">{s.value} <span className="text-xs font-normal text-muted-foreground">{s.unit}</span></dd>
                </div>
              ))}
            </dl>
            <PostersTable posters={posters} />
            {pages > 1 && (
              <nav aria-label="เปลี่ยนหน้า" className="mt-8 flex items-center justify-center gap-2 text-sm">
                {page > 1 ? <Link href={href(page - 1)} aria-label="หน้าก่อนหน้า" className="grid size-10 place-items-center rounded-xl border border-border bg-surface hover:bg-surface-2"><ChevronLeft className="size-4" /></Link> : <span className="grid size-10 place-items-center rounded-xl border border-border opacity-40"><ChevronLeft className="size-4" /></span>}
                <span className="px-2 text-muted-foreground tabular-nums">{page} / {pages}</span>
                {page < pages ? <Link href={href(page + 1)} aria-label="หน้าถัดไป" className="grid size-10 place-items-center rounded-xl border border-border bg-surface hover:bg-surface-2"><ChevronRight className="size-4" /></Link> : <span className="grid size-10 place-items-center rounded-xl border border-border opacity-40"><ChevronRight className="size-4" /></span>}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
